from django.contrib import admin
from .models import UserProfile, Category, UserSettings, Gift, Achievement, Level, Brand, PaymentMethod, CustomDomain, DNSRecord


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'phone', 'city', 'post_code', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'city')
    search_fields = ('user__username', 'user__email', 'company', 'phone', 'city', 'post_code')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Company Information', {
            'fields': ('company', 'company_address')
        }),
        ('Contact Information', {
            'fields': ('phone', 'contact_number', 'address', 'city', 'post_code')
        }),
        ('Media', {
            'fields': ('store_logo', 'banner_image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'description', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'language', 'currency', 'currency_symbol',
                    'email_notifications', 'marketing_notifications', 'created_at', 'updated_at')
    list_filter = ('language', 'currency', 'email_notifications',
                   'marketing_notifications', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'currency_symbol')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'value', 'points', 'user',
                    'is_active', 'created_at', 'updated_at')
    list_filter = ('type', 'is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('type', 'value')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(CustomDomain)
class CustomDomainAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_domain', 'status', 'is_active', 'ssl_enabled', 'verified_at', 'created_at')
    list_filter = ('status', 'is_active', 'ssl_enabled', 'created_at', 'verified_at')
    search_fields = ('user__username', 'user__email', 'domain', 'subdomain')
    readonly_fields = ('created_at', 'updated_at', 'verified_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Domain Information', {
            'fields': ('user', 'domain', 'subdomain')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'ssl_enabled', 'verified_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(DNSRecord)
class DNSRecordAdmin(admin.ModelAdmin):
    list_display = ('custom_domain', 'record_type', 'name', 'value', 'ttl', 'priority', 'created_at')
    list_filter = ('record_type', 'created_at', 'custom_domain__domain')
    search_fields = ('custom_domain__domain', 'custom_domain__subdomain', 'name', 'value')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('custom_domain', 'record_type', 'name')
    
    fieldsets = (
        ('DNS Record Information', {
            'fields': ('custom_domain', 'record_type', 'name', 'value', 'ttl', 'priority')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(custom_domain__user=request.user)
