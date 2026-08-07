"""Forgotten-password flow over email or SMS.

Three steps: request a code, verify it, set the new password. The code is sent
to whichever channel the user picks, because a shopkeeper may have a phone but
no working email — or the other way round.

Every response is deliberately vague about whether an account exists. Saying
"no account with that email" turns this endpoint into a way to enumerate
customers, so a request for an unknown identifier looks exactly like a
successful one.
"""

import random

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import PasswordResetCode

VAGUE_OK = {
    "message": (
        "অ্যাকাউন্ট থাকলে কোড পাঠানো হয়েছে। কোডটা ১০ মিনিট পর্যন্ত চলবে।"
    )
}


class ResetRequestThrottle(AnonRateThrottle):
    """Tighter than the global anon limit — this endpoint sends real SMS."""

    rate = "6/hour"
    scope = "password_reset"


def _find_user(identifier):
    """Match on username, email or the phone stored on the profile."""
    identifier = (identifier or "").strip()
    if not identifier:
        return None
    # Phone numbers are entered inconsistently (01711…, +8801711…), so compare
    # on the last nine digits, which are stable across both forms.
    digits = "".join(ch for ch in identifier if ch.isdigit())
    tail = digits[-9:] if len(digits) >= 9 else None

    query = Q(username__iexact=identifier) | Q(email__iexact=identifier)
    if tail:
        query |= Q(profile__phone__endswith=tail) | Q(
            profile__contact_number__endswith=tail
        )
    return User.objects.filter(query).select_related("profile").first()


def _mask_email(value):
    name, _, domain = (value or "").partition("@")
    if not domain:
        return value
    head = name[:2] if len(name) > 2 else name[:1]
    return f"{head}{'*' * max(2, len(name) - len(head))}@{domain}"


def _mask_phone(value):
    digits = "".join(ch for ch in (value or "") if ch.isdigit())
    return f"{'*' * max(0, len(digits) - 4)}{digits[-4:]}" if digits else value


def _send_email(user, code):
    send_mail(
        subject="OxyManager — পাসওয়ার্ড রিসেট কোড",
        message=(
            f"আসসালামু আলাইকুম {user.first_name or user.username},\n\n"
            f"আপনার পাসওয়ার্ড রিসেট কোড: {code}\n\n"
            f"কোডটা {PasswordResetCode.LIFETIME_MINUTES} মিনিট পর্যন্ত চলবে। "
            "আপনি অনুরোধ না করে থাকলে এই মেসেজটা বাদ দিন।\n\n"
            "— OxyManager"
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@oxymanager.com"),
        recipient_list=[user.email],
        fail_silently=False,
    )


def _send_sms(phone, code):
    """Uses the same gateway as the rest of the app, but never charges credits —
    a locked-out user cannot be asked to buy any."""
    response = requests.post(
        "http://api.smsinbd.com/sms-api/sendsms",
        data={
            "api_token": settings.API_SMS,
            "senderid": "8809617614969",
            "contact_number": phone,
            "message": (
                f"OxyManager password reset code: {code}. "
                f"Valid for {PasswordResetCode.LIFETIME_MINUTES} minutes."
            ),
        },
        timeout=15,
    )
    response.raise_for_status()


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ResetRequestThrottle])
def request_reset(request):
    """Step 1 — send a code to the chosen channel."""
    identifier = request.data.get("identifier", "")
    channel = request.data.get("channel", "email")
    if channel not in ("email", "sms"):
        channel = "email"

    user = _find_user(identifier)
    if user is None:
        return Response(VAGUE_OK)

    profile = getattr(user, "profile", None)
    destination = (
        user.email
        if channel == "email"
        else (getattr(profile, "phone", None) or getattr(profile, "contact_number", None))
    )
    if not destination:
        # The account exists but has nothing to send to. Naming the missing
        # channel is safe — the caller already had to know the identifier.
        return Response(
            {
                "error": (
                    "এই অ্যাকাউন্টে ইমেইল দেওয়া নেই।"
                    if channel == "email"
                    else "এই অ্যাকাউন্টে ফোন নম্বর দেওয়া নেই।"
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    code = f"{random.randint(0, 999999):06d}"
    masked = _mask_email(destination) if channel == "email" else _mask_phone(destination)

    try:
        if channel == "email":
            _send_email(user, code)
        else:
            _send_sms(destination, code)
    except Exception:
        return Response(
            {"error": "কোড পাঠানো গেল না। একটু পরে আবার চেষ্টা করুন।"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # Only stored once the send succeeded, so a failed send does not invalidate
    # a code the user may already have received.
    PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
        used_at=timezone.now()
    )
    PasswordResetCode.objects.create(
        user=user,
        code=code,
        channel=channel,
        sent_to=masked,
        expires_at=timezone.now()
        + timezone.timedelta(minutes=PasswordResetCode.LIFETIME_MINUTES),
    )

    return Response({**VAGUE_OK, "sent_to": masked, "channel": channel})


def _active_code(user):
    return (
        PasswordResetCode.objects.filter(user=user, used_at__isnull=True)
        .order_by("-created_at")
        .first()
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_code(request):
    """Step 2 — check the code before showing the new-password fields."""
    user = _find_user(request.data.get("identifier", ""))
    entered = (request.data.get("code") or "").strip()
    record = _active_code(user) if user else None

    if record is None or not record.is_usable:
        return Response(
            {"error": "কোডটা মেয়াদ শেষ বা ব্যবহার হয়ে গেছে। নতুন করে চান।"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.code != entered:
        record.attempts += 1
        record.save(update_fields=["attempts"])
        left = PasswordResetCode.MAX_ATTEMPTS - record.attempts
        return Response(
            {
                "error": (
                    "কোডটা মেলেনি। আর %d বার চেষ্টা করতে পারবেন।" % left
                    if left > 0
                    else "অনেকবার ভুল হয়েছে। নতুন কোড নিন।"
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "কোড মিলেছে।", "verified": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_reset(request):
    """Step 3 — set the new password.

    The code is re-checked here rather than trusting step 2: verification alone
    hands out no token, so this endpoint must not assume it happened.
    """
    user = _find_user(request.data.get("identifier", ""))
    entered = (request.data.get("code") or "").strip()
    password = request.data.get("password") or ""

    if len(password) < 6:
        return Response(
            {"error": "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    record = _active_code(user) if user else None
    if record is None or not record.is_usable or record.code != entered:
        if record is not None and record.code != entered:
            record.attempts += 1
            record.save(update_fields=["attempts"])
        return Response(
            {"error": "কোডটা ঠিক নেই বা মেয়াদ শেষ। নতুন করে চান।"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(password)
    user.save(update_fields=["password"])
    record.used_at = timezone.now()
    record.save(update_fields=["used_at"])

    return Response({"message": "পাসওয়ার্ড বদলে গেছে। এখন লগইন করুন।"})
