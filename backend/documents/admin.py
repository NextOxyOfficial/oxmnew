from django.contrib import admin
from django.utils.html import format_html

from .models import ImportantDocument


@admin.register(ImportantDocument)
class ImportantDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "doc_type",
        "owner",
        "expiry_badge",
        "reference_number",
        "created_at",
    )
    list_filter = ("doc_type", "is_pinned", "expiry_date", "created_at")
    search_fields = ("title", "reference_number", "issued_by", "owner__username")
    autocomplete_fields = ("owner",)
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "uploaded_by")
    list_per_page = 30

    fieldsets = (
        (None, {"fields": ("owner", "title", "doc_type", "file", "is_pinned")}),
        ("কাগজের তথ্য", {"fields": ("reference_number", "issued_by", "issue_date", "expiry_date")}),
        ("অন্যান্য", {"fields": ("notes", "uploaded_by", "created_at", "updated_at")}),
    )

    @admin.display(description="মেয়াদ")
    def expiry_badge(self, obj):
        """Same four states the app shows, so admin and app never disagree."""
        tone = {
            "expired": ("#be123c", "মেয়াদ শেষ"),
            "expiring": ("#b45309", "শেষ হয়ে আসছে"),
            "valid": ("#047857", "ঠিক আছে"),
            "permanent": ("#64748b", "মেয়াদ নাই"),
        }[obj.status]
        left = obj.days_left
        detail = f" ({left} দিন)" if left is not None else ""
        return format_html(
            '<span class="oxm-badge" style="color:{}">{}{}</span>',
            tone[0], tone[1], detail,
        )
