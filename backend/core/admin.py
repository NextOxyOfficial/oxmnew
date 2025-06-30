from django.contrib import admin
from .models import UserProfile, Category, UserSettings, Gift, Achievement, Level, Brand, PaymentMethod


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'phone', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'company', 'phone')
    readonly_fields = ('created_at', 'updated_at')


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
