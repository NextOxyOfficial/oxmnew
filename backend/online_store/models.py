from django.db import models
from django.contrib.auth.models import User
from products.models import Product


class OnlineProduct(models.Model):
    """Products published to the online store."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    image_url = models.URLField(blank=True, null=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-populate fields from product if this is a new instance
        if not self.pk and self.product:
            self.name = self.product.name
            self.description = self.product.details or ''
            self.price = self.product.sell_price or 0
            self.category = self.product.category.name if self.product.category else 'General'
            self.image_url = self.product.main_photo
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class OnlineOrder(models.Model):
    """Orders placed through the online store."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Store owner
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    order_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"


class OnlineOrderItem(models.Model):
    """Items in an online order."""
    order = models.ForeignKey(OnlineOrder, related_name='items', on_delete=models.CASCADE)
    online_product = models.ForeignKey(OnlineProduct, on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255)  # Snapshot of product name at time of order
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    total = models.DecimalField(max_digits=10, decimal_places=2)  # quantity * price

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class StoreSettings(models.Model):
    """Store-wide settings for the online store."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    terms_and_conditions = models.TextField(blank=True)
    privacy_policy = models.TextField(blank=True)
    store_description = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    store_logo = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Store Settings - {self.user.username}"
