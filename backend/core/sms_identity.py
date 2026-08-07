"""Put the shop's name on every SMS that leaves the system.

A text that says only "আপনার কাছে ৳165749 বাকি আছে" is unusable to the person
receiving it: they buy from several shops and have no way to tell which one is
asking, or whether it is a scam. The name has to be on the message.

It is added here rather than in the screens that compose the text, because
there are several of those — the due book, analytics, a customer profile, the
password reset — and one of them would eventually forget. This runs on the way
out, so nothing can bypass it.

The signature is counted before the credit check, so the shop is charged for
what actually gets sent.
"""

from core.models import UserProfile


def store_name_for(user):
    """What the shop calls itself, or None when nothing is set."""
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    profile = UserProfile.objects.filter(user=user).only("company").first()
    name = (profile.company or "").strip() if profile else ""
    if not name:
        # Fall back to the person's own name — still better than an anonymous
        # text — and only give up when even that is blank.
        name = (user.get_full_name() or "").strip()
    return name or None


def with_store_signature(message, user):
    """Append "— <shop>" unless the shop is already named in the text.

    The containment check keeps a hand-written message that already opens with
    the shop's name from ending with it a second time.
    """
    message = (message or "").strip()
    name = store_name_for(user)
    if not name or not message:
        return message
    if name.lower() in message.lower():
        return message
    return f"{message}\n— {name}"
