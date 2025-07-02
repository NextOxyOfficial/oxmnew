from django.core.management.base import BaseCommand
from subscription.models import SMSPackage, SubscriptionPlan
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create sample subscription data including SMS packages and plans'

    def handle(self, *args, **options):
        # Create subscription plans
        plans_data = [
            {
                'name': 'free',
                'price': Decimal('0.00'),
                'period': 'lifetime',
                'description': 'Perfect for getting started with basic features',
                'features': [
                    'Basic dashboard access',
                    'Up to 5 products',
                    'Limited customer support',
                    'Basic reporting'
                ],
                'is_popular': False
            },
            {
                'name': 'pro',
                'price': Decimal('2999.00'),
                'period': 'month',
                'description': 'Ideal for growing businesses with advanced features',
                'features': [
                    'Advanced dashboard',
                    'Unlimited products',
                    'Priority customer support',
                    'Advanced analytics',
                    'SMS marketing',
                    'Custom integrations',
                    'Multi-user access'
                ],
                'is_popular': True
            }
        ]

        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created subscription plan: {plan.name}')
                )
            else:
                self.stdout.write(f'Subscription plan already exists: {plan.name}')

        # Create SMS packages
        sms_packages_data = [
            {'sms_count': 1000, 'price': Decimal('200.00'), 'is_popular': False},
            {'sms_count': 5000, 'price': Decimal('900.00'), 'is_popular': True},
            {'sms_count': 10000, 'price': Decimal('1500.00'), 'is_popular': False},
            {'sms_count': 25000, 'price': Decimal('3500.00'), 'is_popular': False},
        ]

        for pkg_data in sms_packages_data:
            package, created = SMSPackage.objects.get_or_create(
                sms_count=pkg_data['sms_count'],
                defaults=pkg_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created SMS package: {package.sms_count} SMS for ৳{package.price}')
                )
            else:
                self.stdout.write(f'SMS package already exists: {package.sms_count} SMS')

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample subscription data!')
        )
