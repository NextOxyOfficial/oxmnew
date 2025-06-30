# subscription/admin.py
from django.contrib import admin
from .models import SubscriptionPlan, SMSPackage, UserSubscription, UserSMSCredit, SMSSentHistory

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "period", "is_popular")
    search_fields = ("name",)

@admin.register(SMSPackage)
class SMSPackageAdmin(admin.ModelAdmin):
    list_display = ("sms_count", "price", "is_popular")
    search_fields = ("sms_count",)

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "start_date", "end_date", "active")
    search_fields = ("user__username",)

@admin.register(UserSMSCredit)
class UserSMSCreditAdmin(admin.ModelAdmin):
    list_display = ("user", "credits", "last_updated")
    search_fields = ("user__username",)

@admin.register(SMSSentHistory)
class SMSSentHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "recipient", "status", "sent_at", "sms_count")
    search_fields = ("user__username", "recipient", "message")
