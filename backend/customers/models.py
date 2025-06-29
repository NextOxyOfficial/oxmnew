from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator, MinValueValidator
from django.db.models import Sum, Count, F
from django.utils import timezone
from decimal import Decimal
from core.models import Gift, Achievement, Level
from products.models import Product, ProductVariant


class Customer(models.Model):
    """Customer model to store customer information"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blocked', 'Blocked'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(
        validators=[phone_regex], max_length=17, unique=True)
    address = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True, null=True,
                             help_text="Internal notes about the customer")

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['email', 'user']

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def total_orders(self):
        """Calculate total number of orders for this customer"""
        return self.orders.filter(status__in=['completed', 'pending']).count()

    @property
    def total_spent(self):
        """Calculate total amount spent by this customer"""
        total = self.orders.filter(status='completed').aggregate(
            total=Sum('total_amount')
        )['total']
        return total or Decimal('0.00')

    @property
    def last_order_date(self):
        """Get the date of the last order"""
        last_order = self.orders.filter(
            status__in=['completed', 'pending']
        ).order_by('-created_at').first()
        return last_order.created_at if last_order else None

    @property
    def active_gifts_count(self):
        """Count of active gifts for this customer"""
        return self.customer_gifts.filter(status='active').count()

    @property
    def total_points(self):
        """Calculate total achievement points earned"""
        return self.customer_achievements.aggregate(
            total=Sum('achievement__points')
        )['total'] or 0

    @property
    def current_level(self):
        """Get current customer level"""
        return self.customer_levels.filter(is_current=True).first()


class Order(models.Model):
    """Order model to track customer purchases"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    # Order details
    notes = models.TextField(blank=True, null=True)
    delivery_address = models.TextField(blank=True, null=True)
    expected_delivery_date = models.DateField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number} - {self.customer.name}"

    @property
    def items_count(self):
        """Count total items in this order"""
        return self.items.aggregate(total=Sum('quantity'))['total'] or 0

    @property
    def due_amount(self):
        """Calculate remaining due amount"""
        return self.total_amount - self.paid_amount

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number
            import datetime
            today = datetime.date.today()
            count = Order.objects.filter(created_at__date=today).count() + 1
            self.order_number = f"ORD{today.strftime('%Y%m%d')}{count:04d}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Individual items in an order"""
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, blank=True, null=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['order', 'product', 'variant']

    def __str__(self):
        variant_info = f" - {self.variant}" if self.variant else ""
        return f"{self.product.name}{variant_info} x {self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class CustomerGift(models.Model):
    """Track gifts given to customers"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('expired', 'Expired'),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='customer_gifts')
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE)
    value = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='active')
    description = models.TextField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    used_date = models.DateTimeField(blank=True, null=True)
    used_in_order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='customer_gifts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.gift.name} for {self.customer.name} - ${self.value}"


class CustomerAchievement(models.Model):
    """Track achievements earned by customers"""
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='customer_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='customer_achievements')

    class Meta:
        unique_together = ['customer', 'achievement']
        ordering = ['-earned_date']

    def __str__(self):
        return f"{self.customer.name} - {self.achievement.name}"


class CustomerLevel(models.Model):
    """Track level assignments for customers"""
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='customer_levels')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    assigned_date = models.DateTimeField(default=timezone.now)
    is_current = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    # Metadata
    assigned_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='assigned_customer_levels')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']
        unique_together = ['customer', 'level', 'is_current']

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
        ('due', 'Due Payment'),
        ('advance', 'Advance Payment'),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='due_payments')
    order = models.ForeignKey(Order, on_delete=models.CASCADE,
                              related_name='due_payments', blank=True, null=True)
    # Can be negative for advance
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    due_date = models.DateField()
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('overdue', 'Overdue'),
    ])
    notes = models.TextField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='due_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"{self.customer.name} - {self.get_payment_type_display()} - ${self.amount}"


class Transaction(models.Model):
    """Track payment transactions"""
    TRANSACTION_TYPES = [
        ('payment', 'Payment Received'),
        ('refund', 'Refund Given'),
        ('adjustment', 'Adjustment'),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE,
                              related_name='transactions', blank=True, null=True)
    due_payment = models.ForeignKey(
        DuePayment, on_delete=models.CASCADE, related_name='transactions', blank=True, null=True)

    transaction_type = models.CharField(
        max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # SMS notification
    notify_customer = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.name} - {self.get_transaction_type_display()} - ${self.amount}"


class SMSLog(models.Model):
    """Track SMS notifications sent to customers"""
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='sms_logs')
    message = models.TextField()
    phone_number = models.CharField(max_length=17)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ], default='pending')

    # Related objects
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, blank=True, null=True)
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, blank=True, null=True)
    due_payment = models.ForeignKey(
        DuePayment, on_delete=models.CASCADE, blank=True, null=True)

    # SMS service details
    sms_service_response = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sms_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"SMS to {self.customer.name} ({self.phone_number}) - {self.status}"
