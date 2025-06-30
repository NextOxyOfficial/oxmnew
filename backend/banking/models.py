from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class BankAccount(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='owned_accounts',
        help_text="The user who owns this account"
    )
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - ${self.balance} (Owner: {self.owner.username})"

    def update_balance(self, amount, transaction_type):
        """Update account balance based on transaction type"""
        if transaction_type == 'credit':
            self.balance += Decimal(str(amount))
        elif transaction_type == 'debit':
            self.balance -= Decimal(str(amount))
        self.save()


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('cancelled', 'Cancelled'),
    )

    account = models.ForeignKey(
        BankAccount, 
        on_delete=models.CASCADE, 
        related_name='transactions'
    )
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    purpose = models.CharField(max_length=255)
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_transactions'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='verified')
    date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reference_number = models.CharField(max_length=50, unique=True, blank=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.type.title()} - ${self.amount} - {self.account.name}"

    def save(self, *args, **kwargs):
        # Generate reference number if not provided
        if not self.reference_number:
            import uuid
            self.reference_number = f"TXN-{str(uuid.uuid4())[:8].upper()}"
        
        # Check if this is a new transaction
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Update account balance for new transactions
        if is_new and self.status == 'verified':
            self.account.update_balance(self.amount, self.type)
