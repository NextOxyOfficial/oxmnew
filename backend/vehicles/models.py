"""Serial-tracked vehicles (bikes, CNGs, cars …).

A normal Product is counted in bulk — "10 pieces in stock". A vehicle can't be:
every unit has its own engine and chassis number, its own papers, and is sold
to exactly one customer. So each Vehicle row is ONE physical unit that points
back at the Product describing its model (name, photos, category, brand).

Selling a vehicle does NOT get its own payment/invoice machinery — the sale
creates a regular Order, so vehicle sales show up in the normal sales list and
reuse OrderPayment for the payment history.
"""

from core.uploads import validate_document

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models


class Vehicle(models.Model):
    """One physical vehicle unit, identified by its engine/chassis number."""

    VEHICLE_TYPES = [
        ("bike", "Bike"),
        ("scooter", "Scooter"),
        ("cng", "CNG / Auto"),
        ("car", "Car"),
        ("truck", "Truck / Pickup"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("in_stock", "In Stock"),
        ("reserved", "Reserved"),
        ("sold", "Sold"),
    ]

    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vehicles")

    # The model this unit is an instance of. Name, photos, category and brand
    # all live on the Product so they are entered once, not once per unit.
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="vehicles",
        help_text="The model this unit belongs to, e.g. 'Honda CB150R'",
    )

    vehicle_type = models.CharField(
        max_length=20, choices=VEHICLE_TYPES, default="bike"
    )
    condition = models.CharField(
        max_length=10, choices=CONDITION_CHOICES, default="new"
    )

    # Identity. Optional on purpose: a shop often books a bike into stock before
    # the paperwork arrives, and forcing a placeholder number would poison the
    # uniqueness check. Stored as "" (never NULL) so the partial unique
    # constraints below have a single value to exclude.
    engine_number = models.CharField(max_length=100, blank=True, default="")
    chassis_number = models.CharField(max_length=100, blank=True, default="")
    registration_number = models.CharField(max_length=50, blank=True, null=True)

    color = models.CharField(max_length=50, blank=True, null=True)
    model_year = models.PositiveIntegerField(blank=True, null=True)
    odometer_km = models.PositiveIntegerField(
        blank=True, null=True, help_text="Only meaningful for used units"
    )

    # Purchase side
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
    )
    buy_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    sell_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Asking price while in stock",
    )
    purchase_date = models.DateField(blank=True, null=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="in_stock", db_index=True
    )
    location = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Sale side — filled in when the unit is sold. The order is the single
    # source of truth for money; sold_price is only a denormalised copy so the
    # list view can show it without joining.
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
    )
    sold_price = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    sold_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Two units can never share an engine or chassis number within one
            # shop. Scoped per user because separate shops are separate books.
            # The condition lets any number of units sit in stock with the field
            # still blank — only real numbers have to be unique.
            models.UniqueConstraint(
                fields=["user", "engine_number"],
                condition=~models.Q(engine_number=""),
                name="unique_engine_number_per_user",
            ),
            models.UniqueConstraint(
                fields=["user", "chassis_number"],
                condition=~models.Q(chassis_number=""),
                name="unique_chassis_number_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["product", "status"]),
        ]

    def __str__(self):
        return f"{self.product.name} — {self.identifier}"

    @property
    def identifier(self):
        """Best available human handle for this unit.

        Chassis is the strongest identifier, then engine, then registration.
        All three can legitimately be blank while the paperwork is pending, so
        fall back to the row id rather than rendering an empty label.
        """
        return (
            self.chassis_number
            or self.engine_number
            or self.registration_number
            or f"#{self.pk}"
        )

    @property
    def is_sold(self):
        return self.status == "sold"

    @property
    def profit(self):
        """Realised profit. Meaningless until the unit is actually sold."""
        if self.sold_price is None:
            return None
        return self.sold_price - self.buy_price

    @property
    def paid_amount(self):
        """How much the buyer has paid so far, straight off the order."""
        return self.order.paid_amount if self.order_id else None

    @property
    def due_amount(self):
        """Outstanding balance on the sale, or None if not sold.

        Uses Order.remaining_balance rather than the stored due_amount column so
        it can never lag behind a payment that was just recorded.
        """
        if not self.order_id:
            return None
        return self.order.remaining_balance


class VehicleDocument(models.Model):
    """A scan/photo of a paper belonging to one vehicle.

    `received_date` is the date the shop actually took delivery of that paper —
    which is the thing a buyer asks about, not the upload timestamp.
    """

    DOC_TYPES = [
        ("papers_receipt", "Papers Receipt"),
        ("registration", "Registration"),
        ("tax_token", "Tax Token"),
        ("fitness", "Fitness Certificate"),
        ("insurance", "Insurance"),
        ("delivery", "Delivery Receipt"),
        ("nid", "Buyer NID"),
        ("other", "Other"),
    ]

    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=30, choices=DOC_TYPES, default="other")
    title = models.CharField(max_length=200, blank=True, null=True)
    file = models.FileField(upload_to="vehicle_documents/%Y/%m/", validators=[validate_document])
    received_date = models.DateField(
        blank=True, null=True, help_text="When the shop received this paper"
    )
    notes = models.TextField(blank=True, null=True)

    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="vehicle_documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.vehicle.chassis_number}"
