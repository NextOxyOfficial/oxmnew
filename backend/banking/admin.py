from django.contrib import admin

from .models import BankAccount, BankingPlan, Transaction, UserBankingPlan


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "balance", "is_active", "created_at"]
    list_filter = ["is_active", "created_at", "owner"]
    search_fields = ["name", "owner__username", "owner__first_name", "owner__last_name"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
    autocomplete_fields = ["owner"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "reference_number",
        "account",
        "type",
        "amount",
        "purpose",
        "status",
        "verified_by",
        "date",
    ]
    list_filter = ["type", "status", "date", "account"]
    search_fields = ["reference_number", "purpose", "account__name"]
    readonly_fields = ["reference_number", "date", "updated_at"]
    ordering = ["-date"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("account", "verified_by")


@admin.register(BankingPlan)
class BankingPlanAdmin(admin.ModelAdmin):
    list_display = ["name", "period", "price", "is_popular", "is_active", "created_at"]
    list_filter = ["period", "is_popular", "is_active", "created_at"]
    search_fields = ["name", "description"]
    ordering = ["period", "price"]


@admin.register(UserBankingPlan)
class UserBankingPlanAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "account",
        "is_active",
        "activated_at",
        "expires_at",
        "payment_status",
    ]
    list_filter = ["is_active", "payment_status", "plan__period", "activated_at"]
    search_fields = [
        "user__username",
        "user__email",
        "account__name",
        "payment_order_id",
    ]
    ordering = ["-activated_at"]
    readonly_fields = ["activated_at", "created_at", "updated_at"]
