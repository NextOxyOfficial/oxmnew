from rest_framework import serializers

from products.models import Product

from .models import Vehicle, VehicleDocument


class VehicleDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source="get_doc_type_display", read_only=True)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = VehicleDocument
        fields = [
            "id",
            "vehicle",
            "doc_type",
            "doc_type_display",
            "title",
            "file",
            "file_url",
            "file_name",
            "received_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "vehicle"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_file_name(self, obj):
        return obj.file.name.rsplit("/", 1)[-1] if obj.file else None


class VehicleListSerializer(serializers.ModelSerializer):
    """Trimmed shape for the list screen — no documents, no nested order."""

    product_name = serializers.CharField(source="product.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    vehicle_type_display = serializers.CharField(
        source="get_vehicle_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    document_count = serializers.IntegerField(read_only=True)
    # Best human handle for a unit whose numbers are not filled in yet.
    identifier = serializers.ReadOnlyField()
    due_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "product",
            "product_name",
            "identifier",
            "vehicle_type",
            "vehicle_type_display",
            "condition",
            "engine_number",
            "chassis_number",
            "registration_number",
            "color",
            "model_year",
            "buy_price",
            "sell_price",
            "status",
            "status_display",
            "location",
            "supplier",
            "supplier_name",
            "customer",
            "customer_name",
            "order",
            "order_number",
            "sold_price",
            "sold_at",
            "due_amount",
            "document_count",
            "created_at",
        ]


class VehicleDetailSerializer(VehicleListSerializer):
    documents = VehicleDocumentSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    paid_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta(VehicleListSerializer.Meta):
        fields = VehicleListSerializer.Meta.fields + [
            "odometer_km",
            "purchase_date",
            "notes",
            "documents",
            "payments",
            "paid_amount",
            "profit",
            "updated_at",
        ]

    def get_payments(self, obj):
        """Payment history comes from the sale's Order — vehicles do not keep
        their own payment ledger."""
        if not obj.order_id:
            return []
        return [
            {
                "id": p.id,
                "amount": p.amount,
                "method": p.method,
                "method_display": p.get_method_display(),
                "reference": p.reference,
                "notes": p.notes,
                "created_at": p.created_at,
            }
            for p in obj.order.payments.all()
        ]


class VehicleWriteSerializer(serializers.ModelSerializer):
    """Create/update. Sale fields are read-only here — a unit becomes sold only
    through the `sell` action, never by patching `status`.

    The client types a bike name rather than picking from a dropdown, so
    `product_name` is the normal input and `product` (an existing id) is the
    optional shortcut. The name is matched case-insensitively against the shop's
    products and a Product is created if it's new — that's what makes a newly
    added bike appear in the প্রোডাক্ট list as well as here.
    """

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), required=False, allow_null=True
    )
    product_name = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "product",
            "product_name",
            "identifier",
            "vehicle_type",
            "condition",
            "engine_number",
            "chassis_number",
            "registration_number",
            "color",
            "model_year",
            "odometer_km",
            "supplier",
            "buy_price",
            "sell_price",
            "purchase_date",
            "location",
            "notes",
            "status",
        ]

    def validate_status(self, value):
        if value == "sold":
            raise serializers.ValidationError(
                "একটা গাড়ি বিক্রি করতে হলে বিক্রির অপশন ব্যবহার করুন।"
            )
        if self.instance and self.instance.status == "sold":
            raise serializers.ValidationError(
                "বিক্রি হয়ে যাওয়া গাড়ির স্ট্যাটাস বদলানো যায় না।"
            )
        return value

    def _check_unique(self, field, value):
        """Engine/chassis numbers are unique per shop. Checked here so the user
        gets a readable message instead of a database IntegrityError."""
        user = self.context["request"].user
        qs = Vehicle.objects.filter(user=user, **{f"{field}__iexact": value.strip()})
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        return qs.exists()

    def validate_engine_number(self, value):
        # Blank is allowed — papers often arrive after the bike does. Only a
        # real number has to be unique.
        value = (value or "").strip()
        if value and self._check_unique("engine_number", value):
            raise serializers.ValidationError("এই ইঞ্জিন নম্বরের বাইক আগেই যোগ করা আছে।")
        return value

    def validate_chassis_number(self, value):
        value = (value or "").strip()
        if value and self._check_unique("chassis_number", value):
            raise serializers.ValidationError("এই চেসিস নম্বরের বাইক আগেই যোগ করা আছে।")
        return value

    def validate_product(self, value):
        if value and value.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("প্রোডাক্টটা পাওয়া যায়নি।")
        return value

    def validate(self, attrs):
        """Resolve the typed name into a Product, creating one if needed.

        Done here rather than in validate_product_name because it needs both
        fields at once: an explicit `product` id wins, and on update an existing
        product is kept when the client sends neither.
        """
        name = (attrs.pop("product_name", "") or "").strip()

        if not attrs.get("product"):
            if name:
                user = self.context["request"].user
                product = Product.objects.filter(user=user, name__iexact=name).first()
                if not product:
                    product = Product.objects.create(
                        user=user,
                        name=name,
                        # Units carry their own money and count, so the parent
                        # product stays at zero — it exists to group them and to
                        # appear in the প্রোডাক্ট list.
                        buy_price=0,
                        sell_price=0,
                        stock=0,
                    )
                attrs["product"] = product
            elif not self.instance:
                raise serializers.ValidationError(
                    {"product_name": "বাইকের নাম লিখুন।"}
                )
        return attrs


class VehicleSellSerializer(serializers.Serializer):
    """Input for turning an in-stock unit into a sale."""

    customer = serializers.IntegerField()
    sell_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    paid_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=0, required=False, default=0
    )
    payment_method = serializers.ChoiceField(
        choices=["cash", "cheque", "bkash", "nagad", "bank", "card"],
        required=False,
        default="cash",
    )
    payment_reference = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if attrs.get("paid_amount", 0) > attrs["sell_price"]:
            raise serializers.ValidationError(
                {"paid_amount": "জমা টাকা বিক্রির দামের চেয়ে বেশি হতে পারে না।"}
            )
        return attrs
