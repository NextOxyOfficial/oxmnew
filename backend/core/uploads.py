"""Server-side validation for user-uploaded files.

The frontend sets `accept="image/*,application/pdf"`, but that is a file-picker
hint, not a control — a direct POST bypasses it entirely. Without a check here,
any extension lands in MEDIA_ROOT.

The dangerous case is not really `.php` (the media path is usually served as
static files). It is `.html` and `.svg`: those are served from the app's own
origin, and the "দেখুন" links open them in a tab, so an uploaded document can
run JavaScript with the viewer's session — stored XSS through a file upload.
"""

import os

from django.core.exceptions import ValidationError

# Extensions the shop actually needs for receipts, papers and photos.
DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"}

# 10 MB. Large enough for a phone photo of a receipt, small enough that a
# handful of uploads cannot fill the disk.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _check(value, allowed, label):
    if not value:
        return value
    name = getattr(value, "name", "") or ""
    ext = os.path.splitext(name)[1].lower()

    if ext not in allowed:
        raise ValidationError(
            "এই ধরনের ফাইল দেওয়া যাবে না। %s দিন।" % label,
            code="invalid_extension",
        )

    size = getattr(value, "size", 0) or 0
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError(
            "ফাইলটা %d এমবির বেশি বড় হতে পারবে না।" % (MAX_UPLOAD_BYTES // (1024 * 1024)),
            code="too_large",
        )
    return value


def validate_document(value):
    """Receipts, papers, proofs — images or a PDF."""
    return _check(value, DOCUMENT_EXTENSIONS, "ছবি বা পিডিএফ")


def validate_image(value):
    """Photos only — logos, product shots, employee pictures."""
    return _check(value, IMAGE_EXTENSIONS, "ছবি")


def document_error(value):
    """Run `validate_document` and hand back the message instead of raising.

    Model field validators only fire on `full_clean()`. A view that assigns an
    uploaded file straight onto the instance and calls `save()` skips them
    entirely, so those endpoints have to ask for the check themselves.

    Returns None when the file is acceptable.
    """
    try:
        validate_document(value)
    except ValidationError as exc:
        return exc.messages[0]
    return None
