from rest_framework import serializers

from .models import Order, OrderItem, OrderPayment


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "variant",
            "variant_name",
            "variant_details",
            "quantity",
            "unit_price",
            "buy_price",
            "total_price",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "variant_name",
            "total_price",
            "created_at",
        ]


class OrderPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderPayment
        fields = [
            "id",
            "amount",
            "method",
            "reference",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = OrderPaymentSerializer(many=True, read_only=True)

    # For backward compatibility with ProductSale API
    product = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    variant = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    buy_price = serializers.SerializerMethodField()
    sale_date = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "customer_name",
            "customer_phone",
            "customer_email",
            "customer_address",
            "customer_company",
            "status",
            "subtotal",
            "discount_amount",
            "vat_amount",
            "total_amount",
            "paid_amount",
            "due_amount",
            "notes",
            "due_date",
            "items",
            "payments",
            "total_buy_price",
            "total_sell_price",
            "gross_profit",
            "net_profit",
            "created_at",
            "updated_at",
            # Backward compatibility fields
            "product",
            "product_name",
            "variant",
            "quantity",
            "unit_price",
            "buy_price",
            "sale_date",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "created_at",
            "updated_at",
        ]

    def get_product(self, obj):
        """Get first item's product for backward compatibility"""
        first_item = obj.items.first()
        return first_item.product.id if first_item else None

    def get_product_name(self, obj):
        """Get first item's product name for backward compatibility"""
        first_item = obj.items.first()
        return first_item.product.name if first_item else None

    def get_variant(self, obj):
        """Get first item's variant for backward compatibility"""
        first_item = obj.items.first()
        if first_item and first_item.variant:
            return {
                "id": first_item.variant.id,
                "color": getattr(first_item.variant, "color", ""),
                "size": getattr(first_item.variant, "size", ""),
                "custom_variant": getattr(first_item.variant, "custom_variant", ""),
            }
        return None

    def get_quantity(self, obj):
        """Get total quantity for backward compatibility"""
        return sum(item.quantity for item in obj.items.all())

    def get_unit_price(self, obj):
        """Get first item's unit price for backward compatibility"""
        first_item = obj.items.first()
        return first_item.unit_price if first_item else 0

    def get_buy_price(self, obj):
        """Get first item's buy price for backward compatibility"""
        first_item = obj.items.first()
        return first_item.buy_price if first_item else 0


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating order items"""

    class Meta:
        model = OrderItem
        fields = [
            "product",
            "variant",
            "quantity",
            "unit_price",
            "buy_price",
        ]

    def validate(self, data):
        """Validate order item data"""
        from products.models import Product, ProductVariant

        # Validate product exists
        try:
            product = Product.objects.get(
                id=data["product"].id
                if hasattr(data["product"], "id")
                else data["product"]
            )
        except (Product.DoesNotExist, AttributeError):
            raise serializers.ValidationError("Product not found")

        # Validate variant if provided
        if data.get("variant"):
            try:
                variant = ProductVariant.objects.get(
                    id=data["variant"].id
                    if hasattr(data["variant"], "id")
                    else data["variant"]
                )
                if variant.product != product:
                    raise serializers.ValidationError(
                        "Variant does not belong to the specified product"
                    )
            except (ProductVariant.DoesNotExist, AttributeError):
                raise serializers.ValidationError("Product variant not found")

        return data


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items"""

    items = OrderItemCreateSerializer(many=True, required=True)
    payments = OrderPaymentSerializer(many=True, required=False)

    # Financial calculation fields
    discount_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    vat_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    due_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_due = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    apply_previous_due_to_total = serializers.BooleanField(default=False)

    # Internal company fields
    employee = serializers.IntegerField(required=False, allow_null=True)
    incentive_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    # For backward compatibility with ProductSale creation
    product = serializers.IntegerField(required=False, write_only=True)
    variant = serializers.IntegerField(required=False, write_only=True)
    quantity = serializers.IntegerField(required=False, write_only=True)
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, write_only=True
    )

    class Meta:
        model = Order
        fields = [
            "customer",
            "customer_name",
            "customer_phone",
            "customer_email",
            "customer_address",
            "customer_company",
            "status",
            "discount_percentage",
            "vat_percentage",
            "due_amount",
            "previous_due",
            "apply_previous_due_to_total",
            "notes",
            "due_date",
            "items",
            "payments",
            "employee",
            "incentive_amount",
            # Backward compatibility fields
            "product",
            "variant",
            "quantity",
            "unit_price",
        ]
        read_only_fields = [
            "subtotal",
            "discount_amount",
            "vat_amount",
            "total_amount",
            "total_buy_price",
            "total_sell_price",
            "gross_profit",
            "net_profit",
        ]

    def create(self, validated_data):
        from customers.models import Customer
        from employees.models import Employee
        from products.models import Product, ProductVariant

        items_data = validated_data.pop("items", [])
        payments_data = validated_data.pop("payments", [])
        employee_id = validated_data.pop("employee", None)

        # Handle backward compatibility - create order from ProductSale-style data
        if "product" in validated_data:
            product_id = validated_data.pop("product")
            variant_id = validated_data.pop("variant", None)
            quantity = validated_data.pop("quantity")
            unit_price = validated_data.pop("unit_price")

            # Validate product exists
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError("Product not found")

            # Get buy price from product or variant
            buy_price = 0
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id)
                    buy_price = variant.buy_price or product.buy_price or 0
                except ProductVariant.DoesNotExist:
                    variant_id = None
                    buy_price = product.buy_price or 0
            else:
                buy_price = product.buy_price or 0

            # Create single item data
            items_data = [
                {
                    "product": product_id,
                    "variant": variant_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "buy_price": buy_price,
                }
            ]

        # Validate that we have items
        if not items_data:
            raise serializers.ValidationError("At least one item is required")

        # Find or create customer if customer info provided
        customer = validated_data.get("customer")
        if not customer and (
            validated_data.get("customer_email") or validated_data.get("customer_phone")
        ):
            customer_email = validated_data.get("customer_email", "")
            customer_phone = validated_data.get("customer_phone", "")
            customer_name = validated_data.get("customer_name", "Anonymous")

            if customer_email:
                try:
                    customer = Customer.objects.get(
                        email=customer_email, user=self.context["request"].user
                    )
                except Customer.DoesNotExist:
                    customer = Customer.objects.create(
                        name=customer_name,
                        email=customer_email,
                        phone=customer_phone,
                        user=self.context["request"].user,
                    )
                validated_data["customer"] = customer

        # Set employee if provided
        if employee_id:
            try:
                employee = Employee.objects.get(
                    id=employee_id, user=self.context["request"].user
                )
                validated_data["employee"] = employee
            except Employee.DoesNotExist:
                pass  # Ignore invalid employee

        # Create order
        order = Order.objects.create(
            user=self.context["request"].user, **validated_data
        )

        # Create order items
        for item_data in items_data:
            # Get product instance
            try:
                # Handle both product ID and product object
                product_id = (
                    item_data["product"].id
                    if hasattr(item_data["product"], "id")
                    else item_data["product"]
                )
                product = Product.objects.get(id=product_id)

                # Get variant instance if provided
                variant = None
                if item_data.get("variant"):
                    try:
                        # Handle both variant ID and variant object
                        variant_id = (
                            item_data["variant"].id
                            if hasattr(item_data["variant"], "id")
                            else item_data["variant"]
                        )
                        variant = ProductVariant.objects.get(id=variant_id)
                    except ProductVariant.DoesNotExist:
                        pass

                # Ensure buy_price is set
                if "buy_price" not in item_data or item_data["buy_price"] is None:
                    if variant and variant.buy_price:
                        item_data["buy_price"] = variant.buy_price
                    else:
                        item_data["buy_price"] = product.buy_price or 0

                # Create order item
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant,
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    buy_price=item_data["buy_price"],
                    total_price=item_data["quantity"] * item_data["unit_price"],
                    product_name=product.name,
                    variant_details=f"{variant.color} - {variant.size}"
                    if variant
                    else None,
                )

                # Update stock
                if variant:
                    if variant.stock >= item_data["quantity"]:
                        variant.stock -= item_data["quantity"]
                        variant.save()
                    else:
                        raise serializers.ValidationError(
                            f"Insufficient stock for {product.name} - {variant}"
                        )
                else:
                    if product.stock >= item_data["quantity"]:
                        product.stock -= item_data["quantity"]
                        product.save()
                    else:
                        raise serializers.ValidationError(
                            f"Insufficient stock for {product.name}"
                        )

            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product with id {product_id} not found"
                )

        # Create payments
        for payment_data in payments_data:
            OrderPayment.objects.create(
                order=order, user=self.context["request"].user, **payment_data
            )

        # Calculate and update totals
        order.calculate_totals()
        order.save()

        # Refresh from database to get updated calculated fields
        order.refresh_from_db()

        return order
