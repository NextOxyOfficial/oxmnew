from django.contrib import admin
from .models import (
    Customer, Order, OrderItem, CustomerGift, CustomerAchievement,
    CustomerLevel, DuePayment, Transaction, SMSLog
)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)


class CustomerGiftInline(admin.TabularInline):
    model = CustomerGift
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


class CustomerAchievementInline(admin.TabularInline):
    model = CustomerAchievement
    extra = 0
    readonly_fields = ('earned_date',)


class CustomerLevelInline(admin.TabularInline):
    model = CustomerLevel
    extra = 0
    readonly_fields = ('assigned_date',)


class DuePaymentInline(admin.TabularInline):
    model = DuePayment
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'status',
                    'total_orders', 'total_spent', 'created_at']
    list_filter = ['status', 'created_at', 'user']
    search_fields = ['name', 'email', 'phone']
    readonly_fields = ['total_orders', 'total_spent',
                       'last_order_date', 'created_at', 'updated_at']
    inlines = [CustomerGiftInline, CustomerAchievementInline,
               CustomerLevelInline, DuePaymentInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone', 'address', 'status', 'notes')
        }),
        ('Statistics', {
            'fields': ('total_orders', 'total_spent', 'last_order_date'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('user', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'status',
                    'total_amount', 'paid_amount', 'due_amount', 'created_at']
    list_filter = ['status', 'created_at', 'user']
    search_fields = ['order_number', 'customer__name', 'customer__email']
    readonly_fields = ['order_number', 'items_count',
                       'due_amount', 'created_at', 'updated_at']
    inlines = [OrderItemInline]

    fieldsets = (
        ('Order Information', {
            'fields': ('customer', 'order_number', 'status', 'items_count')
        }),
        ('Financial Details', {
            'fields': ('total_amount', 'paid_amount', 'due_amount', 'discount_amount', 'tax_amount')
        }),
        ('Additional Details', {
            'fields': ('notes', 'delivery_address', 'expected_delivery_date')
        }),
        ('Metadata', {
            'fields': ('user', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CustomerGift)
class CustomerGiftAdmin(admin.ModelAdmin):
    list_display = ['customer', 'gift', 'value',
                    'status', 'expiry_date', 'created_at']
    list_filter = ['status', 'gift', 'created_at', 'user']
    search_fields = ['customer__name', 'gift__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CustomerAchievement)
class CustomerAchievementAdmin(admin.ModelAdmin):
    list_display = ['customer', 'achievement', 'earned_date']
    list_filter = ['achievement', 'earned_date', 'user']
    search_fields = ['customer__name', 'achievement__name']
    readonly_fields = ['earned_date']


@admin.register(CustomerLevel)
class CustomerLevelAdmin(admin.ModelAdmin):
    list_display = ['customer', 'level',
                    'is_current', 'assigned_date', 'assigned_by']
    list_filter = ['level', 'is_current', 'assigned_date']
    search_fields = ['customer__name', 'level__name']
    readonly_fields = ['assigned_date']


@admin.register(DuePayment)
class DuePaymentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'order',
                    'payment_type', 'amount', 'due_date', 'status']
    list_filter = ['payment_type', 'status', 'due_date', 'user']
    search_fields = ['customer__name', 'order__order_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'transaction_type',
                    'amount', 'payment_method', 'sms_sent', 'created_at']
    list_filter = ['transaction_type', 'notify_customer',
                   'sms_sent', 'created_at', 'user']
    search_fields = ['customer__name', 'reference_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ['customer', 'phone_number',
                    'status', 'sent_at', 'created_at']
    list_filter = ['status', 'sent_at', 'created_at', 'user']
    search_fields = ['customer__name', 'phone_number', 'message']
    readonly_fields = ['created_at', 'sent_at']
