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
            "payment_method",
            "payment_reference",
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


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items"""

    items = OrderItemSerializer(many=True, required=False)
    payments = OrderPaymentSerializer(many=True, required=False)

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
            "subtotal",
            "discount_amount",
            "vat_amount",
            "total_amount",
            "notes",
            "due_date",
            "items",
            "payments",
            # Backward compatibility fields
            "product",
            "variant",
            "quantity",
            "unit_price",
        ]
        read_only_fields = [
            "subtotal",
            "total_amount",
        ]

    def create(self, validated_data):
        import uuid

        from customers.models import Customer
        from products.models import Product, ProductVariant

        items_data = validated_data.pop("items", [])
        payments_data = validated_data.pop("payments", [])

        # Handle backward compatibility - create order from ProductSale-style data
        if "product" in validated_data:
            product_id = validated_data.pop("product")
            variant_id = validated_data.pop("variant", None)
            quantity = validated_data.pop("quantity")
            unit_price = validated_data.pop("unit_price")

            # Validate product exists
            try:
                Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError("Product not found")

            # Validate variant exists if provided
            if variant_id:
                try:
                    ProductVariant.objects.get(id=variant_id)
                except ProductVariant.DoesNotExist:
                    variant_id = None

            # Find or create customer if customer info provided
            customer = validated_data.get("customer")
            if not customer and (
                validated_data.get("customer_email")
                or validated_data.get("customer_phone")
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

            # Calculate totals
            total_price = quantity * unit_price
            validated_data["subtotal"] = total_price
            validated_data["total_amount"] = total_price

            # Create single item data
            items_data = [
                {
                    "product": product_id,
                    "variant": variant_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                }
            ]

        # Generate order number if not provided
        if "order_number" not in validated_data:
            validated_data["order_number"] = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        # Create order
        order = Order.objects.create(
            user=self.context["request"].user, **validated_data
        )

        # Create order items
        for item_data in items_data:
            # Get product instance instead of just ID
            product_id = item_data.pop("product")
            variant_id = item_data.pop("variant", None)

            try:
                product = Product.objects.get(id=product_id)
                item_data["product"] = product  # Assign the instance, not the ID
                item_data["product_name"] = product.name

                # Ensure buy_price is always saved from product at order creation time
                # This preserves the buy_price even if product price changes later
                product_buy_price = getattr(product, "buy_price", None)
                item_data["buy_price"] = (
                    product_buy_price if product_buy_price is not None else 0
                )

                item_data["total_price"] = (
                    item_data["quantity"] * item_data["unit_price"]
                )

                # Get variant instance if present
                if variant_id:
                    try:
                        variant = ProductVariant.objects.get(id=variant_id)
                        item_data["variant"] = (
                            variant  # Assign the instance, not the ID
                        )
                        item_data["variant_details"] = (
                            f"{variant.color} - {variant.size}"
                        )
                        # Use variant's buy_price if available and not None/0, otherwise keep product's buy_price
                        variant_buy_price = getattr(variant, "buy_price", None)
                        if variant_buy_price is not None and variant_buy_price > 0:
                            item_data["buy_price"] = variant_buy_price
                    except ProductVariant.DoesNotExist:
                        item_data["variant"] = None

            except Product.DoesNotExist:
                continue  # Skip invalid products

            OrderItem.objects.create(order=order, **item_data)

        # Create payments
        for payment_data in payments_data:
            OrderPayment.objects.create(order=order, **payment_data)

        # Update calculated fields
        order.calculate_totals()
        order.save()

        return order
