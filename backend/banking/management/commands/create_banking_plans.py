from decimal import Decimal

from django.core.management.base import BaseCommand

from banking.models import BankingPlan


class Command(BaseCommand):
    help = "Create default banking plans"

    def handle(self, *args, **options):
        # Banking Plans data
        plans_data = [
            {
                "name": "Banking Account",
                "period": "monthly",
                "price": Decimal("99.00"),
                "description": "Monthly banking account with full features",
                "features": [
                    "Unlimited transactions",
                    "Advanced reporting",
                    "24/7 support",
                    "Multi-user access",
                ],
                "is_popular": True,
            },
            {
                "name": "Banking Account",
                "period": "yearly",
                "price": Decimal("1099.00"),
                "description": "Yearly banking account with full features (Save $89)",
                "features": [
                    "Unlimited transactions",
                    "Advanced reporting",
                    "24/7 support",
                    "Multi-user access",
                    "Priority support",
                    "2 months free",
                ],
                "is_popular": False,
            },
        ]

        for plan_data in plans_data:
            plan, created = BankingPlan.objects.get_or_create(
                name=plan_data["name"], period=plan_data["period"], defaults=plan_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created banking plan: {plan.name} - {plan.period}"
                    )
                )
            else:
                self.stdout.write(
                    f"Banking plan already exists: {plan.name} - {plan.period}"
                )

        self.stdout.write(self.style.SUCCESS("Banking plans setup completed!"))
