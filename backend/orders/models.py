import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum


class Order(models.Model):
    """Main order model to track customer purchases"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    # Order identification
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Customer information (stored directly for guest orders and reference)
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_address = models.TextField(blank=True, null=True)
    customer_company = models.CharField(max_length=200, blank=True, null=True)

    # Optional reference to customer record (for registered customers)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    # Financial details
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    discount_type = models.CharField(
        max_length=20, choices=[("percentage", "Percentage"), ("flat", "Flat Amount")], default="percentage"
    )
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    discount_flat_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    vat_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    vat_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    # Payment tracking
    paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    apply_previous_due_to_total = models.BooleanField(default=False)

    # Order details
    notes = models.TextField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)

    # Internal company fields
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    incentive_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    # Calculated fields (computed properties)
    total_buy_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    total_sell_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    gross_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Metadata
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["order_number"]),
        ]

    def __str__(self):
        customer_name = self.customer_name or (
            self.customer.name if self.customer else "Guest"
        )
        return f"Order #{self.order_number} - {customer_name}"

    @property
    def remaining_balance(self):
        """Calculate remaining balance after payments"""
        return self.total_amount - self.paid_amount

    @property
    def items_count(self):
        """Count total items in this order"""
        return self.items.aggregate(total=Sum("quantity"))["total"] or 0

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.total_sell_price > 0:
            return (self.gross_profit / self.total_sell_price) * 100
        return 0

    def calculate_totals(self):
        """Calculate all totals based on order items"""
        # Calculate subtotal and cost totals from items
        items_data = self.items.aggregate(
            subtotal=Sum("total_price"),
            total_buy=Sum(models.F("quantity") * models.F("buy_price")),
            total_sell=Sum(models.F("quantity") * models.F("unit_price")),
        )

        self.subtotal = items_data["subtotal"] or Decimal("0")
        self.total_buy_price = items_data["total_buy"] or Decimal("0")
        self.total_sell_price = items_data["total_sell"] or Decimal("0")

        # Calculate discount and VAT
        if self.discount_type == "flat":
            self.discount_amount = self.discount_flat_amount
        else:
            self.discount_amount = (self.subtotal * self.discount_percentage) / 100
        after_discount = self.subtotal - self.discount_amount
        self.vat_amount = (after_discount * self.vat_percentage) / 100

        # Calculate final total
        self.total_amount = after_discount + self.vat_amount

        # Due amount is just a note and not subtracted from total
        # It's tracked separately in DuePayment model

        # Add previous due if applicable (this is debt from previous orders)
        if self.apply_previous_due_to_total:
            self.total_amount += self.previous_due

        # Calculate profits based on actual item values (excluding previous due)
        # Gross profit = Actual sale value (after discount + vat) - Buy price
        actual_sale_value = after_discount + self.vat_amount  # This excludes previous due
        self.gross_profit = actual_sale_value - self.total_buy_price
        self.net_profit = self.gross_profit - self.incentive_amount

    def save(self, *args, **kwargs):
        # Generate order number if not exists
        if not self.order_number:
            self.order_number = self.generate_order_number()

        # For new orders, set total_amount to 0 if not provided
        if not self.pk and self.total_amount is None:
            self.total_amount = Decimal("0")

        # Calculate totals if order has items (for existing orders or when explicitly requested)
        if self.pk and hasattr(self, "_recalculate_totals"):
            self.calculate_totals()
        elif self.pk:  # Only recalculate for existing orders by default
            self.calculate_totals()

        super().save(*args, **kwargs)

    def generate_order_number(self):
        """Generate a unique order number with proper race condition handling.

        Uses SELECT FOR UPDATE on the highest existing order number for today
        to prevent two concurrent transactions from generating the same number.
        """
        from django.db import transaction

        today = datetime.date.today()
        date_str = today.strftime('%Y%m%d')
        prefix = f"ORD{date_str}"

        with transaction.atomic():
            # Lock all existing orders with today's prefix so concurrent
            # transactions must wait, preventing duplicate number generation.
            existing = (
                Order.objects.select_for_update()
                .filter(order_number__startswith=prefix)
                .order_by("-order_number")
                .values_list("order_number", flat=True)
                .first()
            )

            if existing:
                try:
                    last_count = int(existing[len(prefix):])
                except (ValueError, IndexError):
                    last_count = 0
                count = last_count + 1
            else:
                count = 1

            if count > 9999:
                import time
                timestamp = str(int(time.time()))[-4:]
                return f"{prefix}{timestamp}"

            return f"{prefix}{count:04d}"


class OrderItem(models.Model):
    """Individual items in an order"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    variant = models.ForeignKey(
        "products.ProductVariant", on_delete=models.CASCADE, null=True, blank=True
    )

    # Item details
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    buy_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )

    # Cached product info for historical reference
    product_name = models.CharField(max_length=200)
    variant_details = models.CharField(max_length=200, blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["order", "product", "variant"]
        indexes = [
            models.Index(fields=["order", "product"]),
        ]

    def __str__(self):
        variant_info = f" - {self.variant_details}" if self.variant_details else ""
        return f"{self.product_name}{variant_info} x {self.quantity}"

    @property
    def profit(self):
        """Calculate profit for this item"""
        return (self.unit_price - self.buy_price) * self.quantity

    @property
    def profit_margin(self):
        """Calculate profit margin percentage for this item"""
        if self.unit_price > 0:
            return ((self.unit_price - self.buy_price) / self.unit_price) * 100
        return 0

    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.quantity * self.unit_price

        # Cache product info for historical reference
        if self.product:
            self.product_name = self.product.name
            if self.variant:
                self.variant_details = str(self.variant)

        # Note: buy_price is intentionally NOT updated here to preserve historical pricing
        # Buy prices are set only at order creation time and should not change for existing orders

        super().save(*args, **kwargs)
        # Order totals are recalculated explicitly by the caller (serializer/view)
        # to avoid N+1 saves when creating multiple items at once.


class OrderPayment(models.Model):
    """Track payments made for orders"""

    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("cheque", "Cheque"),
        ("bkash", "Bkash"),
        ("nagad", "Nagad"),
        ("bank", "Bank Transfer"),
        ("card", "Credit/Debit Card"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Metadata
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="order_payments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_method_display()} - ${self.amount} for Order #{self.order.order_number}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Update order paid amount
        if self.order_id:
            total_paid = self.order.payments.aggregate(total=Sum("amount"))[
                "total"
            ] or Decimal("0")
            self.order.paid_amount = total_paid
            self.order.save()


class OrderStockMovement(models.Model):
    """Track stock movements related to orders"""

    MOVEMENT_TYPES = [
        ("sale", "Sale"),
        ("return", "Return"),
        ("cancel", "Cancellation"),
    ]

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="stock_movements"
    )
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    variant = models.ForeignKey(
        "products.ProductVariant", on_delete=models.CASCADE, null=True, blank=True
    )

    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(
        help_text="Positive for stock out, negative for stock in"
    )
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()

    # Metadata
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        variant_info = f" - {self.variant}" if self.variant else ""
        return f"{self.get_movement_type_display()} - {self.product.name}{variant_info} - {self.quantity}"
