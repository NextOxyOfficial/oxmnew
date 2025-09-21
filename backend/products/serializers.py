from rest_framework import serializers

from .models import Product, ProductPhoto, ProductStockMovement, ProductVariant


class ProductPhotoSerializer(serializers.ModelSerializer):
    """Serializer for product photos"""

    class Meta:
        model = ProductPhoto
        fields = ["id", "image", "alt_text", "order", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants"""

    profit = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    weight_display = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "color",
            "size",
            "weight",
            "weight_unit",
            "custom_variant",
            "buy_price",
            "sell_price",
            "stock",
            "profit",
            "profit_margin",
            "weight_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate variant data"""
        if data.get("sell_price", 0) < data.get("buy_price", 0):
            raise serializers.ValidationError(
                "Sell price must be greater than or equal to buy price"
            )
        # Note: For variants, we'll allow 0 stock as well
        if data.get("stock", 0) < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative")
        return data


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product listing"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    total_stock = serializers.ReadOnlyField()
    average_buy_price = serializers.ReadOnlyField()
    average_sell_price = serializers.ReadOnlyField()
    total_buy_price = serializers.ReadOnlyField()
    total_sell_price = serializers.ReadOnlyField()
    total_profit = serializers.ReadOnlyField()
    total_quantity = serializers.ReadOnlyField()
    sold = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    variant_count = serializers.ReadOnlyField()
    main_photo = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "product_code",
            "category_name",
            "supplier_name",
            "location",
            "has_variants",
            "no_stock_required",
            "buy_price",
            "sell_price",
            "stock",
            "total_stock",
            "average_buy_price",
            "average_sell_price",
            "total_buy_price",
            "total_sell_price",
            "total_profit",
            "total_quantity",
            "sold",
            "profit_margin",
            "variant_count",
            "main_photo",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for product CRUD operations"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    photos = ProductPhotoSerializer(many=True, read_only=True)

    # Calculated fields
    total_stock = serializers.ReadOnlyField()
    average_buy_price = serializers.ReadOnlyField()
    average_sell_price = serializers.ReadOnlyField()
    total_buy_price = serializers.ReadOnlyField()
    total_sell_price = serializers.ReadOnlyField()
    total_profit = serializers.ReadOnlyField()
    total_quantity = serializers.ReadOnlyField()
    sold = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    variant_count = serializers.ReadOnlyField()
    main_photo = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "product_code",
            "category",
            "category_name",
            "supplier",
            "supplier_name",
            "location",
            "details",
            "has_variants",
            "no_stock_required",
            "buy_price",
            "sell_price",
            "stock",
            "total_stock",
            "average_buy_price",
            "average_sell_price",
            "total_buy_price",
            "total_sell_price",
            "total_profit",
            "total_quantity",
            "sold",
            "profit_margin",
            "variant_count",
            "main_photo",
            "variants",
            "photos",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate product data"""
        if not data.get("has_variants", False):
            # For single pricing, validate buy and sell prices and stock
            buy_price = data.get("buy_price", 0)
            sell_price = data.get("sell_price", 0)
            stock = data.get("stock")
            no_stock_required = data.get("no_stock_required", False)

            # Only validate prices if stock is required, or if prices are provided
            if not no_stock_required:
                if buy_price < 0:
                    raise serializers.ValidationError("Buy price cannot be negative")
                if sell_price < 0:
                    raise serializers.ValidationError("Sell price cannot be negative")
                if sell_price > 0 and buy_price > 0 and sell_price < buy_price:
                    raise serializers.ValidationError(
                        "Sell price must be greater than or equal to buy price"
                    )
                # Validate stock for stock-tracked products (allow 0 stock)
                if stock is not None and stock < 0:
                    raise serializers.ValidationError(
                        "Stock quantity cannot be negative"
                    )
            else:
                # For no-stock products, only validate price relationship if both are provided
                if buy_price > 0 and sell_price > 0 and sell_price < buy_price:
                    raise serializers.ValidationError(
                        "Sell price must be greater than or equal to buy price"
                    )

        return data

    def validate_category(self, value):
        """Ensure category belongs to the user"""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Category not found")
        return value

    def validate_supplier(self, value):
        """Ensure supplier belongs to the user"""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Supplier not found")
        return value


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products with variants and photos"""

    colorSizeVariants = serializers.JSONField(
        required=False, write_only=True, allow_null=True
    )
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        allow_empty=True,
    )

    class Meta:
        model = Product
        fields = [
            "name",
            "productCode",
            "category",
            "supplier",
            "location",
            "details",
            "hasVariants",
            "noStockRequired",
            "buyPrice",
            "sellPrice",
            "stock",
            "colorSizeVariants",
            "photos",
        ]
        extra_kwargs = {
            "hasVariants": {"source": "has_variants"},
            "noStockRequired": {"source": "no_stock_required"},
            "buyPrice": {"source": "buy_price"},
            "sellPrice": {"source": "sell_price"},
            "productCode": {"source": "product_code"},
        }

    def validate(self, data):
        """Validate product creation data"""
        has_variants = data.get("has_variants", False)
        variants_data = data.get("colorSizeVariants", [])

        print("=== SERIALIZER VALIDATION DEBUG ===")
        print("has_variants:", has_variants)
        print("variants_data type:", type(variants_data))
        print("variants_data content:", variants_data)

        if has_variants:
            if not variants_data:
                raise serializers.ValidationError(
                    "At least one variant is required when hasVariants is True"
                )

            # Validate each variant
            for i, variant_data in enumerate(variants_data):
                print(f"Validating variant {i + 1}:", variant_data)

                buy_price = variant_data.get("buyPrice", 0)
                sell_price = variant_data.get("sellPrice", 0)
                stock = variant_data.get("stock", 0)

                print(
                    f"Variant {i + 1} - buyPrice: {buy_price}, sellPrice: {sell_price}, stock: {stock}"
                )

                # Check if variant has at least one identifying field
                color = variant_data.get("color", "").strip()
                size = variant_data.get("size", "").strip()
                weight = variant_data.get("weight")
                custom_variant = variant_data.get("custom_variant", "").strip()

                has_identifying_field = bool(color or size or weight or custom_variant)
                if not has_identifying_field:
                    raise serializers.ValidationError(
                        f"Variant {i + 1} must have at least one identifying field: color, size, weight, or custom variant"
                    )

                if sell_price < buy_price:
                    raise serializers.ValidationError(
                        "All variant sell prices must be >= buy prices"
                    )
                if buy_price <= 0:
                    raise serializers.ValidationError(
                        "All variant buy prices must be > 0"
                    )
                if sell_price <= 0:
                    raise serializers.ValidationError(
                        "All variant sell prices must be > 0"
                    )
                if stock <= 0:
                    raise serializers.ValidationError(
                        "All variant stock quantities must be > 0"
                    )
        else:
            # Validate single pricing
            buy_price = data.get("buy_price", 0)
            sell_price = data.get("sell_price", 0)
            stock = data.get("stock", 0)
            no_stock_required = data.get("no_stock_required", False)

            # Only validate prices if stock is required, or if prices are provided
            if not no_stock_required:
                if buy_price < 0:
                    raise serializers.ValidationError("Buy price cannot be negative")
                if sell_price < 0:
                    raise serializers.ValidationError("Sell price cannot be negative")
                if sell_price > 0 and buy_price > 0 and sell_price < buy_price:
                    raise serializers.ValidationError("Sell price must be >= buy price")
                # Validate stock for stock-tracked products (allow 0 stock)
                if stock < 0:
                    raise serializers.ValidationError(
                        "Stock quantity cannot be negative"
                    )
            else:
                # For no-stock products, only validate price relationship if both are provided
                if buy_price > 0 and sell_price > 0 and sell_price < buy_price:
                    raise serializers.ValidationError("Sell price must be >= buy price")

        return data

    def validate_colorSizeVariants(self, value):
        """Validate colorSizeVariants JSON field"""
        print("=== VALIDATING colorSizeVariants ===")
        print("Type:", type(value))
        print("Value:", value)

        if value is None:
            return value

        if not isinstance(value, list):
            print("ERROR: colorSizeVariants is not a list")
            raise serializers.ValidationError("colorSizeVariants must be a list")

        # Ensure it's not a nested array
        if value and isinstance(value[0], list):
            print("WARNING: Detected nested array, flattening...")
            value = value[0]

        print("Final validated value:", value)
        return value

    def validate_category(self, value):
        """Ensure category belongs to the user"""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Category not found")
        return value

    def validate_supplier(self, value):
        """Ensure supplier belongs to the user"""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Supplier not found")
        return value

    def create(self, validated_data):
        """Create product with variants and photos"""
        variants_data = validated_data.pop("colorSizeVariants", [])
        photos_data = validated_data.pop("photos", [])

        print("=== SERIALIZER CREATE DEBUG ===")
        print("variants_data type:", type(variants_data))
        print("variants_data content:", variants_data)
        print("photos_data type:", type(photos_data))
        print("validated_data:", validated_data)

        # Set user
        validated_data["user"] = self.context["request"].user

        # For non-variant products, ensure stock is set properly
        if not validated_data.get("has_variants", False):
            # Keep the stock value from validated_data, don't override it
            if "stock" not in validated_data:
                validated_data["stock"] = 0

        # Create product
        product = Product.objects.create(**validated_data)

        # Create variants if provided
        if product.has_variants and variants_data:
            print(f"Creating {len(variants_data)} variants...")
            for i, variant_data in enumerate(variants_data):
                print(f"Processing variant {i + 1}:", variant_data)
                # Map frontend field names to backend field names
                variant_create_data = {
                    "product": product,
                    "color": variant_data.get("color", ""),
                    "size": variant_data.get("size", ""),
                    "weight": variant_data.get("weight"),
                    "weight_unit": variant_data.get("weight_unit"),
                    "custom_variant": variant_data.get("custom_variant"),
                    "buy_price": variant_data.get("buyPrice", 0),
                    "sell_price": variant_data.get("sellPrice", 0),
                    "stock": variant_data.get("stock", 0),
                }

                # Remove None values
                variant_create_data = {
                    k: v for k, v in variant_create_data.items() if v is not None
                }

                print("Creating variant with data:", variant_create_data)
                ProductVariant.objects.create(**variant_create_data)

        # Create photos if provided
        for i, photo in enumerate(photos_data):
            ProductPhoto.objects.create(product=product, image=photo, order=i)

        return product


class ProductStockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movements"""

    product_name = serializers.CharField(source="product.name", read_only=True)
    variant_display = serializers.SerializerMethodField()
    movement_type_display = serializers.CharField(
        source="get_movement_type_display", read_only=True
    )
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    def get_variant_display(self, obj):
        """Get variant display string, handling None case"""
        if obj.variant:
            return str(obj.variant)
        return None

    class Meta:
        model = ProductStockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "variant",
            "variant_display",
            "movement_type",
            "movement_type_display",
            "quantity",
            "previous_stock",
            "new_stock",
            "reason",
            "notes",
            "cost_per_unit",
            "total_cost",
            "user",
            "user_name",
            "username",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
