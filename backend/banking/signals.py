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


# Note: ensure_main_account_exists was removed because it fired on every
# User.save() (including profile updates), causing an unnecessary DB query
# on each request. The BankAccountViewSet.ensure_main_account() method
# handles the case for existing users who may be missing a Main account.
