from django.contrib import admin

from .models import APIKeyUsageLog, PublicAPIKey


@admin.register(PublicAPIKey)
class PublicAPIKeyAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "name",
        "masked_key",
        "is_active",
        "requests_per_hour",
        "requests_per_day",
        "last_used",
        "created_at",
    ]
    list_filter = ["is_active", "created_at", "last_used"]
    search_fields = ["user__username", "user__email", "name", "key"]
    readonly_fields = ["key", "created_at", "updated_at", "last_used"]

    fieldsets = (
        ("Basic Information", {"fields": ("user", "name", "key", "is_active")}),
        ("Rate Limiting", {"fields": ("requests_per_hour", "requests_per_day")}),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at", "last_used"),
                "classes": ("collapse",),
            },
        ),
    )

    def masked_key(self, obj):
        """Display a masked version of the API key"""
        if obj.key:
            return f"{obj.key[:8]}{'*' * 24}"
        return "-"

    masked_key.short_description = "API Key"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Non-superusers can only see their own API keys
        return qs.filter(user=request.user)

    def save_model(self, request, obj, form, change):
        if not change:  # Only for new objects
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(APIKeyUsageLog)
class APIKeyUsageLogAdmin(admin.ModelAdmin):
    list_display = [
        "api_key_user",
        "endpoint",
        "response_status",
        "response_time_ms",
        "ip_address",
        "timestamp",
    ]
    list_filter = ["response_status", "endpoint", "timestamp", "api_key__user"]
    search_fields = [
        "api_key__user__username",
        "api_key__key",
        "endpoint",
        "ip_address",
    ]
    readonly_fields = [
        "api_key",
        "endpoint",
        "ip_address",
        "user_agent",
        "response_status",
        "response_time_ms",
        "timestamp",
    ]
    date_hierarchy = "timestamp"

    def api_key_user(self, obj):
        """Display the user who owns the API key"""
        return obj.api_key.user.username

    api_key_user.short_description = "User"
    api_key_user.admin_order_field = "api_key__user__username"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Non-superusers can only see logs for their own API keys
        return qs.filter(api_key__user=request.user)

    def has_add_permission(self, request):
        # Logs are automatically created, no manual adding
        return False

    def has_change_permission(self, request, obj=None):
        # Logs should be read-only
        return False
