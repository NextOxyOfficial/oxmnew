from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order
from employees.models import Incentive


@receiver(post_save, sender=Order)
def create_employee_incentive(sender, instance, created, **kwargs):
    """
    Create an incentive record for the employee when an order with incentive amount is saved
    """
    if instance.employee and instance.incentive_amount > 0:
        # Check if incentive already exists for this order to avoid duplicates
        incentive_title = f"Sales Incentive - Order #{instance.order_number}"
        
        # Only create if it doesn't exist
        if not Incentive.objects.filter(
            employee=instance.employee,
            title=incentive_title
        ).exists():
            Incentive.objects.create(
                employee=instance.employee,
                title=incentive_title,
                description=f"Sales incentive for order #{instance.order_number} - {instance.customer_name or 'Customer'}",
                amount=instance.incentive_amount,
                type='commission',
                status='approved'
            )
