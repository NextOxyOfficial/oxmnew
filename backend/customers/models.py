from decimal import Decimal

from core.models import Achievement, Gift, Level
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Sum
from django.utils import timezone


class Customer(models.Model):
    """Customer model to store customer information"""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("blocked", "Blocked"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
    )
    phone = models.CharField(
        validators=[phone_regex], max_length=17, blank=True, null=True
    )
    address = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    notes = models.TextField(
        blank=True, null=True, help_text="Internal notes about the customer"
    )

    # Metadata
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="customers")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # Note: No unique constraints on email/phone since they're optional
        # Uniqueness will be handled at the application level if needed

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def total_orders(self):
        """Calculate total number of orders for this customer"""
        from orders.models import Order

        return Order.objects.filter(user=self.user, customer=self).count()

    @property
    def total_spent(self):
        """Calculate total amount spent by this customer"""
        from orders.models import Order

        total = Order.objects.filter(user=self.user, customer=self).aggregate(
            total=Sum("total_amount")
        )["total"]
        return total or Decimal("0.00")

    @property
    def last_order_date(self):
        """Get the date of the last order"""
        from orders.models import Order

        last_order = (
            Order.objects.filter(user=self.user, customer=self)
            .order_by("-created_at")
            .first()
        )
        return last_order.created_at if last_order else None

    @property
    def active_gifts_count(self):
        """Count of active gifts for this customer"""
        return self.customer_gifts.filter(status="active").count()

    @property
    def total_points(self):
        """Calculate total achievement points earned"""
        return (
            self.customer_achievements.aggregate(total=Sum("achievement__points"))[
                "total"
            ]
            or 0
        )

    @property
    def current_level(self):
        """Get current customer level"""
        return self.customer_levels.filter(is_current=True).first()


class CustomerGift(models.Model):
    """Track gifts given to customers"""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("used", "Used"),
        ("expired", "Expired"),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="customer_gifts"
    )
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE)
    value = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    description = models.TextField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    used_date = models.DateTimeField(blank=True, null=True)
    # Removed used_in_order field since Order model is moved to orders app

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="customer_gifts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.gift.name} for {self.customer.name} - ${self.value}"


class CustomerAchievement(models.Model):
    """Track achievements earned by customers"""

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="customer_achievements"
    )
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="customer_achievements"
    )

    class Meta:
        unique_together = ["customer", "achievement"]
        ordering = ["-earned_date"]

    def __str__(self):
        return f"{self.customer.name} - {self.achievement.name}"


class CustomerLevel(models.Model):
    """Track level assignments for customers"""

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="customer_levels"
    )
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    assigned_date = models.DateTimeField(default=timezone.now)
    is_current = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    # Metadata
    assigned_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="assigned_customer_levels"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-assigned_date"]
        unique_together = ["customer", "level", "is_current"]

    def __str__(self):
        return f"{self.customer.name} - {self.level.name}"

    def save(self, *args, **kwargs):
        # Ensure only one current level per customer
        if self.is_current:
            CustomerLevel.objects.filter(
                customer=self.customer, is_current=True
            ).update(is_current=False)
        super().save(*args, **kwargs)


class DuePayment(models.Model):
    """Track due payments and advances"""

    PAYMENT_TYPES = [
        ("due", "Due Payment"),
        ("advance", "Advance Payment"),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="due_payments"
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="due_payments",
        blank=True,
        null=True,
    )
    # Can be negative for advance
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    due_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        default="pending",
        choices=[
            ("pending", "Pending"),
            ("paid", "Paid"),
            ("partially_paid", "Partially Paid"),
            ("overdue", "Overdue"),
        ],
    )
    notes = models.TextField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="due_payments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        return (
            f"{self.customer.name} - {self.get_payment_type_display()} - ${self.amount}"
        )


class Transaction(models.Model):
    """Track payment transactions"""

    TRANSACTION_TYPES = [
        ("payment", "Payment Received"),
        ("refund", "Refund Given"),
        ("adjustment", "Adjustment"),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="transactions"
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="transactions",
        blank=True,
        null=True,
    )
    due_payment = models.ForeignKey(
        DuePayment,
        on_delete=models.CASCADE,
        related_name="transactions",
        blank=True,
        null=True,
    )

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # SMS notification
    notify_customer = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="transactions"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer.name} - {self.get_transaction_type_display()} - ${self.amount}"


class SMSLog(models.Model):
    """Track SMS notifications sent to customers"""

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="sms_logs"
    )
    message = models.TextField()
    phone_number = models.CharField(max_length=17)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("sent", "Sent"),
            ("failed", "Failed"),
        ],
        default="pending",
    )

    # Related objects
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, blank=True, null=True
    )
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, blank=True, null=True
    )
    due_payment = models.ForeignKey(
        DuePayment, on_delete=models.CASCADE, blank=True, null=True
    )

    # SMS service details
    sms_service_response = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sms_logs")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SMS to {self.customer.name} ({self.phone_number}) - {self.status}"
        return f"SMS to {self.customer.name} ({self.phone_number}) - {self.status}"
