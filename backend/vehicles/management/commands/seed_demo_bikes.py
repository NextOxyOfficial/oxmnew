"""Seed a handful of demo bikes so the মোটর বাইক screens can be looked at.

Everything it creates is tagged in `notes`, so `--undo` can remove exactly what
this command made and nothing else. Run:

    python manage.py seed_demo_bikes --user alimulislam50
    python manage.py seed_demo_bikes --user alimulislam50 --undo
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from customers.models import Customer
from orders.models import Order, OrderItem, OrderPayment
from products.models import Product
from vehicles.models import Vehicle

MARKER = "[demo-seed]"

MODELS = [
    ("GPX Demon GR165R", "bike", Decimal("285000"), Decimal("335000")),
    ("GPX Demon GR200R", "bike", Decimal("340000"), Decimal("399000")),
    ("GPX Legend 150S", "bike", Decimal("245000"), Decimal("289000")),
]

# (model index, engine, chassis, colour, year, registration, condition)
UNITS = [
    (0, "GPX165E-88120341", "MLHGR165RPK004112", "লাল-কালো", 2025, None, "new"),
    (0, "GPX165E-88120358", "MLHGR165RPK004119", "নীল", 2025, None, "new"),
    (1, "GPX200E-77201884", "MLHGR200RPK009431", "কালো", 2025, None, "new"),
    (1, "GPX200E-77201902", "MLHGR200RPK009448", "সাদা-লাল", 2024, None, "new"),
    (2, "GPX150E-55310277", "MLHLG150SPK002205", "ম্যাট কালো", 2024, None, "new"),
    # Paperwork still pending — this is the case the optional numbers exist for.
    (2, "", "", "সিলভার", 2025, None, "new"),
    # A used trade-in, already registered.
    (0, "GPX165E-88119002", "MLHGR165RPJ003877", "লাল", 2023, "ঢাকা মেট্রো-ল-11-4433", "used"),
]

# Units that get sold, as (unit index, price, amount paid, method).
SALES = [
    (2, Decimal("399000"), Decimal("399000"), "bank"),
    (4, Decimal("289000"), Decimal("150000"), "bkash"),
    (6, Decimal("205000"), Decimal("50000"), "cash"),
]


class Command(BaseCommand):
    help = "Create (or remove) demo GPX Demon bikes for one user."

    def add_arguments(self, parser):
        parser.add_argument("--user", required=True, help="username to seed for")
        parser.add_argument(
            "--undo",
            action="store_true",
            help="delete everything this command previously created",
        )

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options["user"])
        except User.DoesNotExist:
            raise CommandError("No user named %r" % options["user"])

        if options["undo"]:
            return self._undo(user)
        return self._seed(user)

    def _undo(self, user):
        vehicles = Vehicle.objects.filter(user=user, notes__contains=MARKER)
        order_ids = [v.order_id for v in vehicles if v.order_id]
        counts = (vehicles.count(), len(order_ids))
        vehicles.delete()
        Order.objects.filter(id__in=order_ids).delete()
        Product.objects.filter(
            user=user, details__contains=MARKER, vehicles__isnull=True
        ).delete()
        Customer.objects.filter(user=user, notes__contains=MARKER).delete()
        self.stdout.write(
            self.style.SUCCESS(
                "Removed %d demo bikes and %d demo orders." % counts
            )
        )

    @transaction.atomic
    def _seed(self, user):
        if Vehicle.objects.filter(user=user, notes__contains=MARKER).exists():
            raise CommandError(
                "Demo bikes already exist for this user. Run with --undo first."
            )

        products = []
        for name, _type, buy, sell in MODELS:
            product, _ = Product.objects.get_or_create(
                user=user,
                name=name,
                defaults={
                    "details": "GPX মোটর বাইক %s" % MARKER,
                    "buy_price": buy,
                    "sell_price": sell,
                    "stock": 0,
                },
            )
            products.append(product)

        today = date.today()
        vehicles = []
        for index, (model_i, engine, chassis, colour, year, reg, condition) in enumerate(
            UNITS
        ):
            name, vtype, buy, sell = MODELS[model_i]
            vehicles.append(
                Vehicle.objects.create(
                    user=user,
                    product=products[model_i],
                    vehicle_type=vtype,
                    condition=condition,
                    engine_number=engine,
                    chassis_number=chassis,
                    registration_number=reg,
                    color=colour,
                    model_year=year,
                    # Used units are bought in cheaper and sold cheaper.
                    buy_price=buy - Decimal("60000") if condition == "used" else buy,
                    sell_price=sell - Decimal("70000") if condition == "used" else sell,
                    purchase_date=today - timedelta(days=10 + index * 4),
                    location="শোরুম" if index % 2 == 0 else "গোডাউন-1",
                    status="in_stock",
                    notes=MARKER,
                )
            )

        customers = self._demo_customers(user)

        for offset, (unit_i, price, paid, method) in enumerate(SALES):
            vehicle = vehicles[unit_i]
            customer = customers[offset % len(customers)]

            order = Order.objects.create(
                user=user,
                customer=customer,
                customer_name=customer.name,
                customer_phone=customer.phone,
                status="completed",
                notes=MARKER,
            )
            OrderItem.objects.create(
                order=order,
                product=vehicle.product,
                quantity=1,
                unit_price=price,
                buy_price=vehicle.buy_price,
                total_price=price,
                product_name=vehicle.product.name,
                variant_details="Chassis: %s" % (vehicle.chassis_number or "—"),
            )
            order.calculate_totals()
            order.save()

            if paid > 0:
                OrderPayment.objects.create(
                    order=order,
                    user=user,
                    method=method,
                    amount=paid,
                    reference="DEMO-%d" % (offset + 1),
                )

            vehicle.status = "sold"
            vehicle.customer = customer
            vehicle.order = order
            vehicle.sold_price = price
            vehicle.sold_at = timezone.now() - timedelta(days=offset * 3)
            vehicle.save()

        self.stdout.write(
            self.style.SUCCESS(
                "Created %d bikes across %d models, %d of them sold."
                % (len(vehicles), len(products), len(SALES))
            )
        )

    def _demo_customers(self, user):
        """Reuse the shop's real customers; only invent one if there are none."""
        existing = list(Customer.objects.filter(user=user)[:3])
        if existing:
            return existing
        return [
            Customer.objects.create(
                user=user,
                name="রফিকুল ইসলাম",
                phone="01711000001",
                notes=MARKER,
            )
        ]
