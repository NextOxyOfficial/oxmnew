from django.db import models
from django.contrib.auth.models import User
from django.core.validators import EmailValidator, URLValidator


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
        # This will be implemented when we add purchase orders
        return 0

    @property
    def total_amount(self):
        """Calculate total amount spent with this supplier"""
        # This will be implemented when we add purchase orders
        return 0
