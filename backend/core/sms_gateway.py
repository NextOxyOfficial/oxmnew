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
#: "ACCOUNT_SUSPENDED" on a screen is not an instruction; "ring the provider" is.
GATEWAY_MESSAGES = {
    "ACCOUNT_SUSPENDED": (
        "এসএমএস গেটওয়ের অ্যাকাউন্টটা বন্ধ বা মেয়াদ শেষ। "
        "smsinbd.com-এ যোগাযোগ করে চালু করিয়ে নিন — অ্যাপে কোনো সমস্যা নেই, "
        "আপনার ক্রেডিটও কাটা হয়নি।"
    ),
    "INSUFFICIENT_BALANCE": "গেটওয়েতে টাকা শেষ। smsinbd.com-এ রিচার্জ করলে আবার যাবে।",
    "INVALID_NUMBER": "নম্বরটা ঠিক নেই — আরেকবার দেখে নিন।",
    "INVALID_API_TOKEN": (
        "গেটওয়ের API কি কাজ করছে না। সেটিংসে নতুন কি বসাতে হবে।"
    ),
    "API_KEY_REQUIRED": (
        "গেটওয়ের API কি বসানো নেই। সার্ভারের .env-এ API_SMS দিতে হবে।"
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
        """Bangla text safe to show the user."""
        if self.ok:
            return "এসএমএস পাঠানো হয়েছে।"
        return GATEWAY_MESSAGES.get(self.code) or (
            self.detail or "এসএমএস পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।"
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
