from django.contrib import admin
from django.utils.html import format_html

from .models import Vehicle, VehicleDocument


class VehicleDocumentInline(admin.TabularInline):
    model = VehicleDocument
    extra = 0
    fields = ("doc_type", "title", "file", "received_date", "notes")
    readonly_fields = ("created_at",)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "chassis_number",
        "product",
        "vehicle_type",
        "engine_number",
        "status_badge",
        "customer",
        "sell_price",
        "user",
    )
    list_filter = ("status", "vehicle_type", "condition", "created_at")
    search_fields = (
        "engine_number",
        "chassis_number",
        "registration_number",
        "product__name",
        "customer__name",
    )
    autocomplete_fields = ("product", "supplier", "customer")
    readonly_fields = ("created_at", "updated_at", "sold_at")
    date_hierarchy = "created_at"
    inlines = [VehicleDocumentInline]
    fieldsets = (
        ("গাড়ি", {
            "fields": (
                "user", "product", "vehicle_type", "condition",
                "engine_number", "chassis_number", "registration_number",
                "color", "model_year", "odometer_km",
            )
        }),
        ("কেনা", {
            "fields": ("supplier", "buy_price", "purchase_date", "location")
        }),
        ("বিক্রি", {
            "fields": ("status", "sell_price", "customer", "order", "sold_price", "sold_at")
        }),
        ("অন্যান্য", {"fields": ("notes", "created_at", "updated_at")}),
    )

    @admin.display(description="স্ট্যাটাস")
    def status_badge(self, obj):
        colors = {"in_stock": "#047857", "reserved": "#b45309", "sold": "#4338ca"}
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:10px;font-size:11px">{}</span>',
            colors.get(obj.status, "#64748b"),
            obj.get_status_display(),
        )


@admin.register(VehicleDocument)
class VehicleDocumentAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "doc_type", "title", "received_date", "created_at")
    list_filter = ("doc_type", "received_date")
    search_fields = ("vehicle__chassis_number", "title")
