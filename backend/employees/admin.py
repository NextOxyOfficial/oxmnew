from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Document,
    Employee,
    Incentive,
    IncentiveWithdrawal,
    PaymentInformation,
    SalaryRecord,
    Task,
)

# Status -> badge colour, rendered with the .oxm-badge classes from
# static/admin/css/oxm-admin.css so the admin matches the app's palette.
STATUS_BADGE = {
    "active": "success",
    "suspended": "warn",
    "resigned": "muted",
    "corrupted": "danger",
}


def _badge(text, tone="muted"):
    return format_html(
        '<span class="oxm-badge oxm-badge--{}">{}</span>', tone, text
    )


# ── Inlines: everything about one employee, editable from their page ──


class PaymentInformationInline(admin.StackedInline):
    model = PaymentInformation
    can_delete = False
    extra = 0
    verbose_name_plural = "Payment information"


class SalaryRecordInline(admin.TabularInline):
    model = SalaryRecord
    extra = 0
    fields = ("month", "year", "base_salary", "net_salary", "status")
    readonly_fields = ("net_salary",)
    ordering = ("-year", "-month")
    show_change_link = True


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    fields = ("title", "priority", "status", "due_date")
    ordering = ("-assigned_date",)
    show_change_link = True


class IncentiveInline(admin.TabularInline):
    model = Incentive
    extra = 0
    fields = ("title", "type", "amount", "status")
    ordering = ("-date_awarded",)
    show_change_link = True


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    fields = ("name", "category", "file_type", "size", "upload_date")
    readonly_fields = ("file_type", "size", "upload_date")
    ordering = ("-upload_date",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        "photo_thumb",
        "name",
        "employee_id",
        "role",
        "department",
        "status_badge",
        "salary_display",
        "task_progress",
        "hiring_date",
    ]
    list_display_links = ["photo_thumb", "name"]
    list_filter = ["status", "department", "role", "hiring_date"]
    search_fields = ["name", "email", "employee_id", "role", "department", "phone"]
    list_per_page = 25
    date_hierarchy = "hiring_date"
    ordering = ["-hiring_date"]
    list_select_related = ["user"]
    readonly_fields = [
        "photo_preview",
        "tasks_assigned",
        "tasks_completed",
        "created_at",
        "updated_at",
    ]
    inlines = [
        PaymentInformationInline,
        SalaryRecordInline,
        TaskInline,
        IncentiveInline,
        DocumentInline,
    ]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "user",
                    "employee_id",
                    "name",
                    "email",
                    "phone",
                    "address",
                    "photo",
                    "photo_preview",
                )
            },
        ),
        (
            "Employment Details",
            {
                "fields": (
                    "role",
                    "department",
                    "manager",
                    "salary",
                    "hiring_date",
                    "status",
                )
            },
        ),
        (
            "Task Statistics",
            {"fields": ("tasks_assigned", "tasks_completed"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    # ── Bulk actions ──
    actions = ["mark_active", "mark_suspended", "mark_resigned"]

    @admin.action(description="Mark selected employees as ACTIVE")
    def mark_active(self, request, queryset):
        updated = queryset.update(status="active")
        self.message_user(request, f"{updated} employee(s) marked active.")

    @admin.action(description="Mark selected employees as SUSPENDED")
    def mark_suspended(self, request, queryset):
        updated = queryset.update(status="suspended")
        self.message_user(request, f"{updated} employee(s) marked suspended.")

    @admin.action(description="Mark selected employees as RESIGNED")
    def mark_resigned(self, request, queryset):
        updated = queryset.update(status="resigned")
        self.message_user(request, f"{updated} employee(s) marked resigned.")

    # ── Display helpers ──
    @admin.display(description="")
    def photo_thumb(self, obj):
        if obj.photo:
            return format_html('<img src="{}" class="oxm-thumb">', obj.photo.url)
        initial = (obj.name or "?")[:1].upper()
        return format_html(
            '<span class="oxm-thumb" style="display:inline-flex;align-items:center;'
            'justify-content:center;font-weight:600;color:#0891b2;">{}</span>',
            initial,
        )

    @admin.display(description="Photo")
    def photo_preview(self, obj):
        if not obj.photo:
            return "—"
        return format_html(
            '<img src="{}" style="max-height:120px;border-radius:10px;'
            'border:1px solid #e2e8f0;">',
            obj.photo.url,
        )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        return _badge(
            obj.get_status_display(), STATUS_BADGE.get(obj.status, "muted")
        )

    @admin.display(description="Salary", ordering="salary")
    def salary_display(self, obj):
        if obj.salary is None:
            return "—"
        return format_html('<span class="oxm-num">{:,.0f}</span>', obj.salary)

    @admin.display(description="Tasks")
    def task_progress(self, obj):
        done = obj.tasks_completed or 0
        total = obj.tasks_assigned or 0
        if not total:
            return format_html('<span style="color:#94a3b8;">—</span>')
        tone = "success" if done >= total else "info"
        return _badge(f"{done}/{total}", tone)


@admin.register(PaymentInformation)
class PaymentInformationAdmin(admin.ModelAdmin):
    list_display = ["employee", "bank_name", "payment_method", "pay_frequency"]
    list_filter = ["payment_method", "pay_frequency", "tax_withholding"]
    search_fields = ["employee__name", "bank_name", "account_holder_name"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]


@admin.register(Incentive)
class IncentiveAdmin(admin.ModelAdmin):
    list_display = ["title", "employee", "type", "amount", "status_badge", "date_awarded"]
    list_filter = ["type", "status", "date_awarded"]
    search_fields = ["title", "employee__name", "description"]
    readonly_fields = ["date_awarded", "created_at", "updated_at"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]
    date_hierarchy = "date_awarded"
    list_per_page = 30

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        tone = {"approved": "success", "pending": "warn", "rejected": "danger"}.get(
            obj.status, "muted"
        )
        return _badge(obj.get_status_display(), tone)


@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = [
        "employee",
        "month",
        "year",
        "base_salary",
        "net_salary",
        "status_badge",
    ]
    list_filter = ["year", "month", "status"]
    search_fields = ["employee__name"]
    readonly_fields = ["net_salary", "payment_date", "created_at", "updated_at"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]
    ordering = ["-year", "-month"]
    list_per_page = 30

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        tone = {"paid": "success", "pending": "warn", "cancelled": "danger"}.get(
            obj.status, "muted"
        )
        return _badge(obj.get_status_display(), tone)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "employee",
        "priority_badge",
        "status_badge",
        "assigned_date",
        "due_date",
    ]
    list_filter = ["priority", "status", "assigned_date", "due_date"]
    search_fields = ["title", "employee__name", "assigned_by", "project"]
    readonly_fields = ["assigned_date", "completed_date", "created_at", "updated_at"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]
    date_hierarchy = "due_date"
    list_per_page = 30

    @admin.display(description="Priority", ordering="priority")
    def priority_badge(self, obj):
        tone = {"high": "danger", "medium": "warn", "low": "muted"}.get(
            obj.priority, "muted"
        )
        return _badge(obj.get_priority_display(), tone)

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        tone = {
            "completed": "success",
            "in_progress": "info",
            "pending": "warn",
        }.get(obj.status, "muted")
        return _badge(obj.get_status_display(), tone)


@admin.register(IncentiveWithdrawal)
class IncentiveWithdrawalAdmin(admin.ModelAdmin):
    list_display = ["employee", "amount", "withdrawal_date", "reason"]
    list_filter = ["withdrawal_date"]
    search_fields = ["employee__name", "reason"]
    readonly_fields = ["withdrawal_date", "created_at", "updated_at"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]
    date_hierarchy = "withdrawal_date"


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["name", "employee", "category", "file_type", "size", "upload_date"]
    list_filter = ["category", "upload_date"]
    search_fields = ["name", "employee__name"]
    readonly_fields = ["size", "file_type", "upload_date", "created_at", "updated_at"]
    autocomplete_fields = ["employee"]
    list_select_related = ["employee"]
    date_hierarchy = "upload_date"
