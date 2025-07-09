from django.contrib import admin
from .models import OnlineProduct, OnlineOrder, OnlineOrderItem, StoreSettings


@admin.register(OnlineProduct)
class OnlineProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'price', 'category', 'is_published', 'created_at']
    list_filter = ['is_published', 'category', 'user', 'created_at']
    search_fields = ['name', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


class OnlineOrderItemInline(admin.TabularInline):
    model = OnlineOrderItem
    extra = 0
    readonly_fields = ['total']


@admin.register(OnlineOrder)
class OnlineOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'user', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'user', 'created_at']
    search_fields = ['customer_name', 'customer_email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OnlineOrderItemInline]


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'contact_email', 'contact_phone', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
