from django.contrib import admin
from .models import Supplier, Purchase


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'user', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'user']
    search_fields = ['name', 'email', 'phone', 'contact_person']
    readonly_fields = ['created_at', 'updated_at', 'total_orders', 'total_amount']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'contact_person', 'user', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'website', 'address')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ['supplier', 'date', 'amount', 'status', 'user', 'is_active', 'created_at']
    list_filter = ['status', 'is_active', 'date', 'user', 'supplier']
    search_fields = ['supplier__name', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    fieldsets = (
        ('Purchase Information', {
            'fields': ('supplier', 'user', 'date', 'amount', 'status', 'is_active')
        }),
        ('Details', {
            'fields': ('products', 'notes', 'proof_document')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
