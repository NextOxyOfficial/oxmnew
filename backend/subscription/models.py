# subscription/models.py
from django.db import models
from django.conf import settings

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
    ]
    name = models.CharField(max_length=50, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=20, default='month')
    description = models.TextField(blank=True)
    features = models.JSONField(default=list)
    is_popular = models.BooleanField(default=False)

    def __str__(self):
        return self.get_name_display()

class SMSPackage(models.Model):
    sms_count = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_popular = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sms_count} SMS for ৳{self.price}"

class UserSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} - {self.plan}"

class UserSMSCredit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    credits = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.credits} credits"

class SMSSentHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    recipient = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, default='sent')  # e.g., sent, failed
    sent_at = models.DateTimeField(auto_now_add=True)
    sms_count = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.user} to {self.recipient} at {self.sent_at} ({self.status})"
