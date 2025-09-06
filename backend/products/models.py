import os
import uuid

from core.models import Category
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Avg, Sum
from suppliers.models import Supplier


def product_photo_upload_path(instance, filename):
    """Generate upload path for product photos"""
    ext = filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join("products", str(instance.product.id), "photos", filename)


class Product(models.Model):
    """Main product model"""

    name = models.CharField(max_length=200)
    product_code = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Product/Parts code (SKU, part number, etc.)",
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="products"
    )
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, related_name="products"
    )
    location = models.CharField(
        max_length=200, blank=True, null=True, help_text="Storage location"
    )
    details = models.TextField(
        blank=True, null=True, help_text="Product description and details"
    )

    # Pricing mode
    has_variants = models.BooleanField(
        default=False, help_text="True if product has color/size variants"
    )
    
    # Stock tracking mode
    no_stock_required = models.BooleanField(
        default=False, 
        help_text="True if product doesn't require stock tracking (e.g., services, digital products)"
    )

    # Single pricing (used when has_variants=False)
    buy_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    sell_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    stock = models.PositiveIntegerField(default=0)

    # Meta fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["name", "user"]

    def __str__(self):
        return self.name

    @property
    def total_stock(self):
        """Calculate total stock across all variants or return single stock"""
        if self.has_variants:
            return self.variants.aggregate(total=Sum("stock"))["total"] or 0
        return self.stock

    @property
    def average_buy_price(self):
        """Calculate average buy price across variants or return single price"""
        if self.has_variants:
            return self.variants.aggregate(avg=Avg("buy_price"))["avg"] or 0
        return self.buy_price

    @property
    def average_sell_price(self):
        """Calculate average sell price across variants or return single price"""
        if self.has_variants:
            return self.variants.aggregate(avg=Avg("sell_price"))["avg"] or 0
        return self.sell_price

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        sell_price = self.average_sell_price
        if sell_price > 0:
            return ((sell_price - self.average_buy_price) / sell_price) * 100
        return 0

    @property
    def total_buy_price(self):
        """Calculate total buy price (buy_price * stock for each variant)"""
        if self.has_variants:
            total = 0
            for variant in self.variants.all():
                total += variant.buy_price * variant.stock
            return total
        return self.buy_price * self.stock

    @property
    def total_sell_price(self):
        """Calculate total sell price (sell_price * stock for each variant)"""
        if self.has_variants:
            total = 0
            for variant in self.variants.all():
                total += variant.sell_price * variant.stock
            return total
        return self.sell_price * self.stock

    @property
    def total_profit(self):
        """Calculate total profit (total_sell_price - total_buy_price)"""
        return self.total_sell_price - self.total_buy_price

    @property
    def total_quantity(self):
        """Calculate total quantity (alias for total_stock for consistency)"""
        return self.total_stock

    @property
    def sold(self):
        """Calculate total sold quantity from sales"""
        from django.db.models import Sum

        total_sold = 0
        if self.has_variants:
            # Sum sales from all variants
            for variant in self.variants.all():
                variant_sold = (
                    variant.orderitem_set.aggregate(total=Sum("quantity"))["total"] or 0
                )
                total_sold += variant_sold
        else:
            # Sum sales from main product
            total_sold = (
                self.orderitem_set.aggregate(total=Sum("quantity"))["total"] or 0
            )
        return total_sold

    @property
    def variant_count(self):
        """Get number of variants for this product"""
        return self.variants.count() if self.has_variants else 0

    @property
    def main_photo(self):
        """Get the first photo as main photo"""
        photo = self.photos.first()
        return photo.image.url if photo else None


class ProductVariant(models.Model):
    """Product variants for color, size, and other attributes"""

    WEIGHT_UNITS = [
        ("g", "Grams"),
        ("kg", "Kilograms"),
        ("lb", "Pounds"),
        ("oz", "Ounces"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    color = models.CharField(max_length=50)
    size = models.CharField(max_length=50)
    weight = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    weight_unit = models.CharField(
        max_length=5, choices=WEIGHT_UNITS, blank=True, null=True
    )
    custom_variant = models.CharField(
        max_length=100, blank=True, null=True, help_text="Custom variant description"
    )

    # Pricing for this variant
    buy_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    sell_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    stock = models.PositiveIntegerField(default=0)

    # Meta fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["color", "size"]
        unique_together = ["product", "color", "size", "custom_variant"]

    def __str__(self):
        variant_name = f"{self.color} - {self.size}"
        if self.custom_variant:
            variant_name += f" ({self.custom_variant})"
        return f"{self.product.name} - {variant_name}"

    @property
    def profit(self):
        """Calculate profit for this variant"""
        return self.sell_price - self.buy_price

    @property
    def profit_margin(self):
        """Calculate profit margin percentage for this variant"""
        if self.sell_price > 0:
            return ((self.sell_price - self.buy_price) / self.sell_price) * 100
        return 0

    @property
    def weight_display(self):
        """Display weight with unit"""
        if self.weight and self.weight_unit:
            return f"{self.weight} {self.get_weight_unit_display()}"
        return None


class ProductPhoto(models.Model):
    """Product photos with support for multiple images"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="photos"
    )
    image = models.ImageField(upload_to=product_photo_upload_path)
    alt_text = models.CharField(max_length=200, blank=True, null=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"Photo for {self.product.name}"

    def delete(self, *args, **kwargs):
        """Delete the file when the photo is deleted"""
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)


class ProductStockMovement(models.Model):
    """Track stock movements for inventory management"""

    MOVEMENT_TYPES = [
        ("in", "Stock In"),
        ("out", "Stock Out"),
        ("adjustment", "Adjustment"),
        ("sale", "Sale"),
        ("return", "Return"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="stock_movements"
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="stock_movements"
    )

    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(
        help_text="Positive for stock in, negative for stock out"
    )
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()

    reason = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    cost_per_unit = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Cost per unit at the time of this stock movement"
    )
    total_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Total cost for this stock movement (quantity * cost_per_unit)"
    )
    # Removed reference_sale field since ProductSale model is moved to orders app

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        variant_info = f" - {self.variant}" if self.variant else ""
        return f"{self.get_movement_type_display()} - {self.product.name}{variant_info} - {self.quantity}"
