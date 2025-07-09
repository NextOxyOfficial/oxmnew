from django.contrib import admin
from .models import Order, OrderItem, OrderPayment, OrderStockMovement


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["total_price"]


class OrderPaymentInline(admin.TabularInline):
    model = OrderPayment
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "customer",
        "status",
        "total_amount",
        "paid_amount",
        "due_amount",
        "created_at",
    ]
    list_filter = ["status", "created_at", "updated_at"]
    search_fields = ["order_number", "customer__name", "customer__email"]
    readonly_fields = [
        "order_number",
        "total_amount",
        "due_amount",
        "created_at",
        "updated_at",
    ]
    inlines = [OrderItemInline, OrderPaymentInline]

    def due_amount(self, obj):
        return obj.due_amount

    due_amount.short_description = "Due Amount"


@admin.register(OrderStockMovement)
class OrderStockMovementAdmin(admin.ModelAdmin):
    list_display = [
        "order",
        "product",
        "variant",
        "movement_type",
        "quantity",
        "created_at",
    ]
    list_filter = ["movement_type", "created_at"]
    search_fields = ["order__order_number", "product__name"]
    readonly_fields = ["created_at"]
