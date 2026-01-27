from django.contrib import admin

from .models import Product, ProductPhoto, ProductStockMovement, ProductVariant


class ProductPhotoInline(admin.TabularInline):
    model = ProductPhoto
    extra = 1
    fields = ["image", "alt_text", "order"]


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = [
        "color",
        "size",
        "weight",
        "weight_unit",
        "custom_variant",
        "buy_price",
        "sell_price",
        "stock",
    ]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "supplier",
        "user",
        "has_variants",
        "total_stock",
        "profit_margin",
        "is_active",
        "created_at",
    ]
    list_filter = [
        "has_variants",
        "is_active",
        "category",
        "supplier",
        "created_at",
        "user",
    ]
    search_fields = ["name", "details", "location"]
    readonly_fields = [
        "total_stock",
        "average_buy_price",
        "average_sell_price",
        "profit_margin",
        "variant_count",
    ]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "product_code",
                    "category",
                    "supplier",
                    "user",
                    "location",
                    "details",
                )
            },
        ),
        ("Pricing", {"fields": ("has_variants", "buy_price", "sell_price", "stock")}),
        (
            "Calculated Fields",
            {
                "fields": (
                    "total_stock",
                    "average_buy_price",
                    "average_sell_price",
                    "profit_margin",
                    "variant_count",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Meta", {"fields": ("is_active",), "classes": ("collapse",)}),
    )

    inlines = [ProductVariantInline, ProductPhotoInline]

    def get_queryset(self, request):
        return (
            super().get_queryset(request).select_related("category", "supplier", "user")
        )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "color",
        "size",
        "custom_variant",
        "buy_price",
        "sell_price",
        "stock",
        "profit_margin",
    ]
    list_filter = ["color", "size", "weight_unit", "product__category"]
    search_fields = ["product__name", "color", "size", "custom_variant"]
    readonly_fields = ["profit", "profit_margin", "weight_display"]

    fieldsets = (
        (
            "Variant Details",
            {
                "fields": (
                    "product",
                    "color",
                    "size",
                    "weight",
                    "weight_unit",
                    "custom_variant",
                )
            },
        ),
        ("Pricing & Stock", {"fields": ("buy_price", "sell_price", "stock")}),
        (
            "Calculated Fields",
            {
                "fields": ("profit", "profit_margin", "weight_display"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(ProductPhoto)
class ProductPhotoAdmin(admin.ModelAdmin):
    list_display = ["product", "alt_text", "order", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["product__name", "alt_text"]


@admin.register(ProductStockMovement)
class ProductStockMovementAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "variant",
        "movement_type",
        "quantity",
        "previous_stock",
        "new_stock",
        "reason",
        "created_at",
    ]
    list_filter = ["movement_type", "created_at", "product__category"]
    search_fields = ["product__name", "reason", "notes"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Movement Details",
            {
                "fields": (
                    "product",
                    "variant",
                    "movement_type",
                    "quantity",
                    "previous_stock",
                    "new_stock",
                )
            },
        ),
        ("Additional Info", {"fields": ("reason", "notes", "user")}),
    )
