"""জরুরি কাগজপত্র — the shop's own papers, kept in one place.

Not to be confused with `employees.Document` (a paper belonging to one staff
member) or `vehicles.VehicleDocument` (a paper belonging to one bike). This is
the shop's own file cabinet: trade licence, TIN, VAT, rent agreement, bank
papers — the things a shopkeeper is asked to produce and then cannot find.

The feature that earns its keep is `expiry_date`. A trade licence or a fire
licence lapsing without anyone noticing is a real, expensive problem, so the
model computes how many days are left and the list screen sorts by it.
"""

import os

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


def document_upload_path(instance, filename):
    """Group uploads by owner and month so the media dir stays navigable."""
    return f"important_documents/{instance.owner_id}/{timezone.now():%Y/%m}/{filename}"


class ImportantDocument(models.Model):
    """One paper the shop needs to keep."""

    DOC_TYPES = [
        ("trade_license", "ট্রেড লাইসেন্স"),
        ("tin", "টিন সার্টিফিকেট"),
        ("vat", "ভ্যাট / বিআইএন"),
        ("bank", "ব্যাংকের কাগজ"),
        ("rent_agreement", "দোকান ভাড়ার চুক্তি"),
        ("insurance", "ইনস্যুরেন্স"),
        ("fire_license", "ফায়ার লাইসেন্স"),
        ("nid", "এনআইডি / পরিচয়পত্র"),
        ("partnership", "পার্টনারশিপ দলিল"),
        ("utility", "বিদ্যুৎ / গ্যাস / পানির বিল"),
        ("tax_return", "আয়কর রিটার্ন"),
        ("other", "অন্যান্য"),
    ]

    #: Anything the browser will render inline is a stored-XSS risk once the
    #: media dir is served by nginx, so .html/.svg/.js are deliberately absent.
    ALLOWED_EXTENSIONS = [
        ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif",
        ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv",
    ]
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB, matching FILE_UPLOAD_MAX_MEMORY_SIZE

    # The shop owner. A staff login never owns papers of its own — the viewset
    # resolves it through owner_for(), same as every other app here.
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="important_documents"
    )

    title = models.CharField(max_length=200)
    doc_type = models.CharField(
        max_length=30, choices=DOC_TYPES, default="other", db_index=True
    )
    file = models.FileField(upload_to=document_upload_path)

    reference_number = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Licence / certificate number printed on the paper",
    )
    issued_by = models.CharField(max_length=200, blank=True, default="")
    issue_date = models.DateField(blank=True, null=True)
    # The whole point of the feature. Blank means "never expires".
    expiry_date = models.DateField(blank=True, null=True, db_index=True)

    notes = models.TextField(blank=True, default="")
    is_pinned = models.BooleanField(
        default=False, help_text="Keep at the top of the list"
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_important_documents",
        help_text="The login that uploaded it — may be a staff account",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Pinned first, then whatever expires soonest. NULL expiry sorts last
        # so papers that never lapse do not crowd out the ones that do.
        ordering = ["-is_pinned", models.F("expiry_date").asc(nulls_last=True), "-created_at"]
        verbose_name = "জরুরি কাগজ"
        verbose_name_plural = "জরুরি কাগজপত্র"
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["owner", "expiry_date"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_doc_type_display()})"

    # ── Expiry ────────────────────────────────────────────────────────
    #: A paper inside this window is "expiring soon" — long enough to renew
    #: a trade licence without paying a late fee.
    EXPIRING_SOON_DAYS = 30

    @property
    def days_left(self):
        """Days until it lapses; negative once it has. None if it never does."""
        if not self.expiry_date:
            return None
        return (self.expiry_date - timezone.localdate()).days

    @property
    def status(self):
        """`expired`, `expiring`, `valid`, or `permanent`."""
        left = self.days_left
        if left is None:
            return "permanent"
        if left < 0:
            return "expired"
        if left <= self.EXPIRING_SOON_DAYS:
            return "expiring"
        return "valid"

    # ── File helpers ──────────────────────────────────────────────────
    @property
    def file_name(self):
        return os.path.basename(self.file.name) if self.file else None

    @property
    def extension(self):
        return os.path.splitext(self.file.name)[1].lower().lstrip(".") if self.file else ""

    @property
    def file_size(self):
        """Bytes, or None when the file is missing from disk.

        Storage backends raise rather than return 0 for a deleted file, and a
        list page must not 500 because one upload went missing.
        """
        try:
            return self.file.size if self.file else None
        except (OSError, ValueError):
            return None
