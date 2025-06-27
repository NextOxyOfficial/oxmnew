from django.db import models
from django.contrib.auth.models import User
from django.core.validators import EmailValidator, URLValidator
from django.db.models import Sum


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(validators=[EmailValidator()], blank=True, null=True)
    website = models.URLField(validators=[URLValidator()], blank=True, null=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suppliers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name

    @property
    def total_orders(self):
        """Calculate total number of orders from this supplier"""
        return self.purchases.filter(is_active=True).count()

    @property
    def total_amount(self):
        """Calculate total amount spent with this supplier"""
        return self.purchases.filter(is_active=True).aggregate(
            total=Sum('amount')
        )['total'] or 0


class Purchase(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    products = models.TextField(help_text="Products purchased (comma-separated)")
    notes = models.TextField(blank=True, null=True)
    proof_document = models.FileField(upload_to='purchase_proofs/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Purchase from {self.supplier.name} - {self.date} - ${self.amount}"
