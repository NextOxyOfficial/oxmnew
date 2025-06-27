from django.contrib import admin
from .models import Supplier


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
