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


class OrderItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order items - buy_price cannot be modified"""

    class Meta:
        model = OrderItem
        fields = [
            "quantity",
            "unit_price",
        ]
        # Explicitly exclude buy_price to prevent modification of existing order items
        
    def validate(self, data):
        """Ensure buy_price is not being modified"""
        if 'buy_price' in data:
            raise serializers.ValidationError(
                "Cannot modify buy_price for existing order items. "
                "Buy price is locked at the time of order creation."
            )
        return data

    def update(self, instance, validated_data):
        """Update order item and recalculate total price - buy_price remains unchanged"""
        instance.quantity = validated_data.get("quantity", instance.quantity)
        instance.unit_price = validated_data.get("unit_price", instance.unit_price)
        instance.total_price = instance.quantity * instance.unit_price
        instance.save()

        # Recalculate order totals once after the item is saved
        order = instance.order
        order.calculate_totals()
        order.save(update_fields=[
            "subtotal", "discount_amount", "vat_amount", "total_amount",
            "total_buy_price", "total_sell_price", "gross_profit", "net_profit",
        ])

        return instance


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
    
    # Employee details for frontend display
    employee = serializers.SerializerMethodField()

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
            "discount_type",
            "discount_percentage",
            "discount_flat_amount",
            "discount_amount",
            "vat_percentage",
            "vat_amount",
            "total_amount",
            "paid_amount",
            "due_amount",
            "previous_due",
            "apply_previous_due_to_total",
            "notes",
            "due_date",
            "employee",
            "incentive_amount",
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
    
    def get_employee(self, obj):
        """Get employee details for frontend display"""
        if obj.employee:
            return {
                "id": obj.employee.id,
                "name": obj.employee.name,
                "email": obj.employee.email,
                "role": getattr(obj.employee, "role", None),
                "department": getattr(obj.employee, "department", None),
                "employee_id": getattr(obj.employee, "employee_id", None),
            }
        return None


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating order items"""
    
    variant = serializers.IntegerField(required=False, allow_null=True)
    order = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = OrderItem
        fields = [
            "order",
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

        # Check if product has variants and validate accordingly
        if product.has_variants:
            variant_id = data.get("variant")
            if variant_id is not None:
                # Validate the variant belongs to this product
                try:
                    variant = ProductVariant.objects.get(
                        id=variant_id.id if hasattr(variant_id, "id") else variant_id
                    )
                    if variant.product != product:
                        raise serializers.ValidationError(
                            "Variant does not belong to the specified product"
                        )
                except (ProductVariant.DoesNotExist, AttributeError):
                    raise serializers.ValidationError("Product variant not found")
            # If variant is None/null, we'll use the first available variant in the create method
        else:
            # For products without variants, variant should be None
            if data.get("variant"):
                raise serializers.ValidationError(
                    "Variant should not be provided for products without variants"
                )

        return data

    def create(self, validated_data):
        """Create order item, handling auto-selection of first variant if needed"""
        from products.models import Product, ProductVariant

        # For adding items to existing orders, ensure we have an order
        # For new order creation, order will be set by the parent OrderCreateSerializer
        order_id = validated_data.get('order')
        if order_id and not hasattr(validated_data.get('order'), 'id'):
            # If order_id is just an integer, convert it to Order instance
            from .models import Order
            try:
                validated_data['order'] = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                raise serializers.ValidationError("Order not found")

        # Get the product
        product_id = validated_data["product"].id if hasattr(validated_data["product"], "id") else validated_data["product"]
        product = Product.objects.get(id=product_id)

        # If product has variants but no variant was specified, use the first available variant
        if product.has_variants and not validated_data.get("variant"):
            first_variant = product.variants.first()
            if first_variant:
                validated_data["variant"] = first_variant
            else:
                raise serializers.ValidationError("Product has no available variants")

        # Add product name for reference
        validated_data["product_name"] = product.name
        
        # Add variant details if variant exists
        if validated_data.get("variant"):
            variant = validated_data["variant"]
            if hasattr(variant, 'color') and hasattr(variant, 'size'):
                validated_data["variant_details"] = f"{variant.color} - {variant.size}"

        # Calculate total price
        validated_data["total_price"] = validated_data["quantity"] * validated_data["unit_price"]

        return super().create(validated_data)


class OrderItemNestedSerializer(serializers.ModelSerializer):
    """Serializer for creating order items as nested items during order creation"""
    
    variant = serializers.IntegerField(required=False, allow_null=True)

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

        # Check if product has variants and validate accordingly
        if product.has_variants:
            variant_id = data.get("variant")
            if variant_id is not None:
                # Validate the variant belongs to this product
                try:
                    variant = ProductVariant.objects.get(
                        id=variant_id.id if hasattr(variant_id, "id") else variant_id
                    )
                    if variant.product != product:
                        raise serializers.ValidationError(
                            "Variant does not belong to the specified product"
                        )
                except (ProductVariant.DoesNotExist, AttributeError):
                    raise serializers.ValidationError("Product variant not found")
            # If variant is None/null, we'll use the first available variant in the create method
        else:
            # For products without variants, variant should be None
            if data.get("variant"):
                raise serializers.ValidationError(
                    "Variant should not be provided for products without variants"
                )

        return data


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items"""

    items = OrderItemNestedSerializer(many=True, required=True)
    payments = OrderPaymentSerializer(many=True, required=False)

    # Financial calculation fields
    discount_type = serializers.ChoiceField(
        choices=[("percentage", "Percentage"), ("flat", "Flat Amount")], default="percentage"
    )
    discount_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    discount_flat_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=0
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
            "discount_type",
            "discount_percentage",
            "discount_flat_amount",
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
        from django.db import transaction as db_transaction
        from customers.models import Customer
        from employees.models import Employee
        from products.models import Product, ProductVariant

        items_data = validated_data.pop("items", [])
        payments_data = validated_data.pop("payments", [])
        employee_id = validated_data.pop("employee", None)

        with db_transaction.atomic():
            # Handle backward compatibility - create order from ProductSale-style data
            if "product" in validated_data:
                product_id = validated_data.pop("product")
                variant_id = validated_data.pop("variant", None)
                quantity = validated_data.pop("quantity")
                unit_price = validated_data.pop("unit_price")

                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    raise serializers.ValidationError("Product not found")

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

                items_data = [
                    {
                        "product": product_id,
                        "variant": variant_id,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "buy_price": buy_price,
                    }
                ]

            if not items_data:
                raise serializers.ValidationError("At least one item is required")

            request_user = self.context["request"].user

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
                            email=customer_email, user=request_user
                        )
                    except Customer.DoesNotExist:
                        customer = Customer.objects.create(
                            name=customer_name,
                            email=customer_email,
                            phone=customer_phone,
                            user=request_user,
                        )
                    validated_data["customer"] = customer
                elif customer_phone:
                    # Phone-only: look up or create customer
                    try:
                        customer = Customer.objects.get(
                            phone=customer_phone, user=request_user
                        )
                    except Customer.DoesNotExist:
                        customer = Customer.objects.create(
                            name=customer_name,
                            phone=customer_phone,
                            user=request_user,
                        )
                    validated_data["customer"] = customer

            # Set employee if provided
            if employee_id:
                try:
                    if request_user.is_staff or request_user.is_superuser:
                        employee = Employee.objects.get(id=employee_id)
                    else:
                        employee = Employee.objects.get(id=employee_id, user=request_user)
                    validated_data["employee"] = employee
                except Employee.DoesNotExist:
                    raise serializers.ValidationError({"employee": "Invalid employee selection."})

            # Create order
            order = Order.objects.create(user=request_user, **validated_data)

            # Create order items — lock product/variant rows to prevent stock race conditions
            for item_data in items_data:
                try:
                    product_id = (
                        item_data["product"].id
                        if hasattr(item_data["product"], "id")
                        else item_data["product"]
                    )
                    product = Product.objects.select_for_update().get(id=product_id)

                    variant = None
                    if item_data.get("variant"):
                        try:
                            variant_id = (
                                item_data["variant"].id
                                if hasattr(item_data["variant"], "id")
                                else item_data["variant"]
                            )
                            variant = product.variants.select_for_update().get(id=variant_id)
                        except ProductVariant.DoesNotExist:
                            pass

                    if "buy_price" not in item_data or item_data["buy_price"] is None:
                        if variant and variant.buy_price:
                            item_data["buy_price"] = variant.buy_price
                        else:
                            item_data["buy_price"] = product.buy_price or 0

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
                            variant.save(update_fields=["stock"])
                        else:
                            raise serializers.ValidationError(
                                f"Insufficient stock for {product.name} - {variant}"
                            )
                    else:
                        if not getattr(product, "no_stock_required", False):
                            if product.stock >= item_data["quantity"]:
                                product.stock -= item_data["quantity"]
                                product.save(update_fields=["stock"])
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
                    order=order, user=request_user, **payment_data
                )

            # Create due payment record if order has due amount
            if validated_data.get("due_amount", 0) > 0:
                from customers.models import DuePayment

                due_customer = order.customer
                if not due_customer and order.customer_name and (
                    order.customer_email or order.customer_phone
                ):
                    due_customer = None
                    if order.customer_email:
                        try:
                            due_customer = Customer.objects.get(
                                email=order.customer_email, user=request_user
                            )
                        except Customer.DoesNotExist:
                            pass
                    if not due_customer and order.customer_phone:
                        try:
                            due_customer = Customer.objects.get(
                                phone=order.customer_phone, user=request_user
                            )
                        except Customer.DoesNotExist:
                            pass
                    if not due_customer:
                        due_customer = Customer.objects.create(
                            name=order.customer_name,
                            email=order.customer_email,
                            phone=order.customer_phone,
                            address=order.customer_address,
                            user=request_user,
                        )
                        order.customer = due_customer
                        order.save(update_fields=["customer"])

                if due_customer:
                    DuePayment.objects.create(
                        customer=due_customer,
                        order=order,
                        amount=validated_data["due_amount"],
                        payment_type="due",
                        due_date=validated_data.get("due_date"),
                        notes=f"Due amount from order #{order.order_number}",
                        user=request_user,
                    )

            # Calculate and update totals once after all items are created
            order.calculate_totals()
            order.save()
            order.refresh_from_db()
            return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating orders"""

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
            "discount_type",
            "discount_percentage",
            "discount_flat_amount",
            "vat_percentage",
            "notes",
            "subtotal",
            "discount_amount",
            "vat_amount",
            "total_amount",
            "due_amount",
            "due_date",
            "employee",
            "incentive_amount",
        ]

    def update(self, instance, validated_data):
        """Update order with recalculated totals and handle due payments"""
        from customers.models import DuePayment, Customer
        
        # Get the old due amount for comparison
        old_due_amount = instance.due_amount or 0
        new_due_amount = validated_data.get('due_amount', old_due_amount)
        
        # Update the instance with validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # If discount or vat percentage changed, recalculate totals
        if (
            "discount_type" in validated_data
            or "discount_percentage" in validated_data
            or "discount_flat_amount" in validated_data
            or "vat_percentage" in validated_data
        ):
            instance.calculate_totals()

        instance.save()
        
        # Handle due payment changes
        if old_due_amount != new_due_amount:
            # Find or create customer for due payment
            customer = instance.customer
            if not customer and instance.customer_name and (instance.customer_email or instance.customer_phone):
                # Try to find existing customer or create new one
                # Try to find by email first
                if instance.customer_email:
                    try:
                        customer = Customer.objects.get(
                            email=instance.customer_email, 
                            user=self.context["request"].user
                        )
                    except Customer.DoesNotExist:
                        pass
                
                # Try to find by phone if not found by email
                if not customer and instance.customer_phone:
                    try:
                        customer = Customer.objects.get(
                            phone=instance.customer_phone, 
                            user=self.context["request"].user
                        )
                    except Customer.DoesNotExist:
                        pass
                
                # Create new customer if not found
                if not customer:
                    customer = Customer.objects.create(
                        name=instance.customer_name,
                        email=instance.customer_email,
                        phone=instance.customer_phone,
                        address=instance.customer_address,
                        user=self.context["request"].user,
                    )
                    instance.customer = customer
                    instance.save()
            
            if customer:
                # Remove old due payment record for this order
                DuePayment.objects.filter(
                    order=instance, 
                    customer=customer,
                    payment_type="due"
                ).delete()
                
                # Create new due payment record if new amount > 0
                if new_due_amount > 0:
                    DuePayment.objects.create(
                        customer=customer,
                        order=instance,
                        amount=new_due_amount,
                        payment_type="due",
                        due_date=validated_data.get("due_date", instance.due_date),
                        notes=f"Due amount from order #{instance.order_number}",
                        user=self.context["request"].user,
                    )
        
        return instance
