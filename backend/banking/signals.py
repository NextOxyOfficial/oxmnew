from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import BankAccount


@receiver(post_save, sender=User)
def create_default_bank_account(sender, instance, created, **kwargs):
    """
    Automatically create a default 'Main' bank account for new users
    """
    if created:
        BankAccount.objects.create(
            name="Main",
            owner=instance,
            balance=0.00,
            is_active=True,
            activation_fee=0.00,
            is_activated=True,
        )


@receiver(post_save, sender=User)
def ensure_main_account_exists(sender, instance, **kwargs):
    """
    Ensure existing users have a Main account
    This can be used for existing users who don't have a Main account yet
    """
    if not BankAccount.objects.filter(owner=instance, name="Main").exists():
        BankAccount.objects.create(
            name="Main",
            owner=instance,
            balance=0.00,
            is_active=True,
            activation_fee=0.00,
            is_activated=True,
        )
