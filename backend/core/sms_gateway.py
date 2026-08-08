"""One place that talks to smsinbd.com.

Before this module the gateway was called from two files, each with the sender
ID typed into the source. Switching smsinbd accounts — which is exactly what
happens when one is suspended — meant editing Python and redeploying. Now the
account, the sender ID and the endpoint are all configuration.

smsinbd has two APIs:

  legacy   GET  http://api.smsinbd.com/sms-api/sendsms
           ?api_token=…&senderid=…&contact_number=…&message=…
  modern   POST https://login.smsinbd.com/api/external/v1/sms/send
           X-API-KEY: <key>   {"sender_id": …, "phone": …, "message": …}

Both answer with the same JSON error envelope, so the caller does not care
which is configured. Note that a 200 does NOT mean the message went: smsinbd
returns 200 with {"success": false} for a suspended account or a bad number,
which is why `ok` is decided on the body rather than the status line.
"""

import json

import requests
from django.conf import settings

LEGACY_URL = "http://api.smsinbd.com/sms-api/sendsms"
MODERN_URL = "https://login.smsinbd.com/api/external/v1/sms/send"
MODERN_BALANCE_URL = "https://login.smsinbd.com/api/external/v1/balance"

TIMEOUT = 20

#: Gateway error codes turned into something a shopkeeper can act on.
#:
#: Who our upstream SMS provider is, and what its account is doing, is our
#: problem and not the customer's — OxyManager is sold as one product, so the
#: user is pointed at OxyManager support, never at a third party they have no
#: relationship with and cannot help. The machine-readable `code` still travels
#: in the response and the raw body is logged, so support can see the real
#: cause without any of it reaching the screen.
SUPPORT = "OxyManager সাপোর্টে যোগাযোগ করুন"

GATEWAY_MESSAGES = {
    "ACCOUNT_SUSPENDED": (
        f"এসএমএস সার্ভিসটা এখন সাময়িকভাবে বন্ধ আছে। {SUPPORT} — "
        "আপনার কোনো ক্রেডিট কাটা হয়নি।"
    ),
    "INSUFFICIENT_BALANCE": (
        f"এখন এসএমএস পাঠানো যাচ্ছে না। {SUPPORT} — আপনার কোনো ক্রেডিট কাটা হয়নি।"
    ),
    # The one code the user can actually fix themselves.
    "INVALID_NUMBER": "নম্বরটা ঠিক নেই — আরেকবার দেখে নিন।",
    "INVALID_API_TOKEN": (
        f"এসএমএস সার্ভিসে সমস্যা হচ্ছে। {SUPPORT} — আপনার কোনো ক্রেডিট কাটা হয়নি।"
    ),
    "API_KEY_REQUIRED": (
        f"এসএমএস সার্ভিসটা এখনো চালু করা হয়নি। {SUPPORT}।"
    ),
    "NETWORK": (
        "এই মুহূর্তে এসএমএস সার্ভিসে পৌঁছানো যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।"
    ),
}


class SmsResult:
    """What happened, in terms the caller can branch on."""

    def __init__(self, ok, code="", detail="", raw=""):
        self.ok = ok
        self.code = code
        self.detail = detail
        self.raw = raw

    @property
    def message(self):
        """Bangla text safe to show the user.

        An unmapped code falls back to a generic line rather than to
        `self.detail`: the detail is the provider's own English wording, which
        would both name a vendor the customer knows nothing about and read as
        broken Bangla-English on the screen.
        """
        if self.ok:
            return "এসএমএস পাঠানো হয়েছে।"
        return GATEWAY_MESSAGES.get(self.code) or (
            f"এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন, না হলে {SUPPORT}।"
        )

    def __repr__(self):
        return f"<SmsResult ok={self.ok} code={self.code!r}>"


def sender_id():
    return getattr(settings, "SMS_SENDER_ID", "") or ""


def api_key():
    return getattr(settings, "API_SMS", "") or ""


def api_url():
    return getattr(settings, "SMS_API_URL", "") or MODERN_URL


def _parse(response):
    """Pull (ok, code, detail) out of whichever envelope came back."""
    try:
        body = response.json()
    except ValueError:
        body = None

    if isinstance(body, dict):
        if body.get("success") is False:
            error = body.get("error") or {}
            if isinstance(error, dict):
                return False, error.get("code", ""), error.get("message", "")
            return False, "", str(error)
        if body.get("success") is True:
            return True, "", ""

    # No usable envelope — fall back to the status line.
    ok = 200 <= response.status_code < 300
    return ok, "" if ok else f"HTTP_{response.status_code}", response.text[:200]


def send_sms(phone, message):
    """Send one message. Never raises — the caller gets an SmsResult."""
    key = api_key()
    if not key:
        return SmsResult(False, "API_KEY_REQUIRED")
    if not phone:
        return SmsResult(False, "INVALID_NUMBER")

    url = api_url()
    try:
        if url.rstrip("/") == LEGACY_URL.rstrip("/"):
            response = requests.get(
                url,
                params={
                    "api_token": key,
                    "senderid": sender_id(),
                    "contact_number": phone,
                    "message": message,
                },
                timeout=TIMEOUT,
            )
        else:
            response = requests.post(
                url,
                headers={"X-API-KEY": key, "Content-Type": "application/json"},
                data=json.dumps(
                    {
                        "sender_id": sender_id(),
                        "phone": phone,
                        "message": message,
                    }
                ),
                timeout=TIMEOUT,
            )
    except requests.RequestException as exc:
        # A network failure is not the shop's fault and not a lost credit.
        return SmsResult(False, "NETWORK", str(exc)[:200])

    ok, code, detail = _parse(response)
    # Never let the key reach a log or an API response.
    raw = response.text[:300].replace(key, "***") if key else response.text[:300]
    return SmsResult(ok, code, detail, raw)


def check_balance():
    """Ask the gateway whether the account is alive and what is left on it."""
    key = api_key()
    if not key:
        return SmsResult(False, "API_KEY_REQUIRED")
    try:
        response = requests.get(
            MODERN_BALANCE_URL, headers={"X-API-KEY": key}, timeout=TIMEOUT
        )
    except requests.RequestException as exc:
        return SmsResult(False, "NETWORK", str(exc)[:200])
    ok, code, detail = _parse(response)
    return SmsResult(ok, code, detail, response.text[:300].replace(key, "***"))
