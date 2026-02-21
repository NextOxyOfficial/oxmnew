from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from employees.models import Employee


class BankAccount(models.Model):
    name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=10, unique=True, null=True, blank=True, help_text="10-digit unique account number")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_accounts",
        help_text="The user who owns this account",
    )
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    activation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_activated = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - ${self.balance} (Owner: {self.owner.username})"

    def update_balance(self, amount, transaction_type):
        """Update account balance based on transaction type"""
        if transaction_type == "credit":
            self.balance += Decimal(str(amount))
        elif transaction_type == "debit":
            self.balance -= Decimal(str(amount))
        self.save()


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ("credit", "Credit"),
        ("debit", "Debit"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("cancelled", "Cancelled"),
    )

    account = models.ForeignKey(
        BankAccount, on_delete=models.CASCADE, related_name="transactions"
    )
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    purpose = models.CharField(max_length=255)
    verified_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_transactions",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="verified")
    date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reference_number = models.CharField(max_length=50, unique=True, blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.type.title()} - ${self.amount} - {self.account.name}"

    def save(self, *args, **kwargs):
        # Generate reference number if not provided
        if not self.reference_number:
            import uuid

            self.reference_number = f"TXN-{str(uuid.uuid4())[:8].upper()}"

        # Check if this is a new transaction or status is changing to verified
        is_new = self.pk is None
        old_status = None

        if not is_new:
            # Get the old status before saving
            try:
                old_instance = Transaction.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Transaction.DoesNotExist:
                old_status = None

        super().save(*args, **kwargs)

        # Update account balance for new verified transactions or when status changes to verified
        if self.status == "verified" and (
            is_new or (old_status and old_status != "verified")
        ):
            self.account.update_balance(self.amount, self.type)


class BankingPlan(models.Model):
    """Banking account plans (monthly/yearly)"""

    PERIOD_CHOICES = [
        ("monthly", "Monthly"),
        ("yearly", "Yearly"),
    ]

    name = models.CharField(max_length=50)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    description = models.TextField(blank=True)
    features = models.JSONField(default=list)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("name", "period")
        ordering = ["price"]

    def __str__(self):
        return f"{self.name} - {self.get_period_display()}"


class UserBankingPlan(models.Model):
    """Track user banking plan subscriptions"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(BankingPlan, on_delete=models.CASCADE)
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE)

    activated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Payment tracking
    payment_order_id = models.CharField(max_length=200, blank=True)
    payment_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    payment_status = models.CharField(max_length=50, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.plan} - {self.account.name}"

    def is_plan_active(self):
        """Check if the plan is currently active"""
        if not self.is_active:
            return False

        if self.expires_at:
            from django.utils import timezone

            return timezone.now() <= self.expires_at

        return True
