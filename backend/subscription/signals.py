# subscription/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserSubscription, SubscriptionPlan

@receiver(post_save, sender=User)
def create_user_subscription(sender, instance, created, **kwargs):
    """Create a free subscription for new users"""
    if created:
        try:
            # Get the free plan
            free_plan = SubscriptionPlan.objects.get(name='free')
            # Create a subscription for the new user
            UserSubscription.objects.create(
                user=instance,
                plan=free_plan,
                active=True
            )
            print(f"Created free subscription for user: {instance.username}")
        except SubscriptionPlan.DoesNotExist:
            print(f"Free plan not found. Could not create subscription for user: {instance.username}")
        except Exception as e:
            print(f"Error creating subscription for user {instance.username}: {e}")
