from core.ownership import OwnedRelationsMixin
from core.scoping import owner_for
from django.db.models import Q
from rest_framework import serializers

from .models import Product, ProductPhoto, ProductStockMovement, ProductVariant


def check_identity_is_free(serializer, attrs):
    """Reject a product that would duplicate one this shop already has.

    A name alone is not an identity here: shops routinely stock several items
    under one name and tell them apart by product code ("Engine Oil" 1L vs 4L,
    the same part from two makers). So the rule mirrors the two constraints on
    Product:

      * with a code    — name + code together must be new;
      * without a code — the name must be new among code-less products, since
                         nothing else distinguishes them.

    Checking here matters because `user` is attached in create() rather than
    arriving with the payload, so DRF cannot build a UniqueTogetherValidator
    on its own; without this the INSERT hit the constraint and the API
    answered a bare "Server Error (500)".

    Matching is exact, like the constraints — refusing "ABC" because "abc"
    exists would reject a row the database itself accepts.
    """
    request = serializer.context.get("request")
    if request is None:
        return attrs
    instance = serializer.instance

    # A PATCH may carry only one of the two; the other keeps its saved value.
    name = attrs.get("name", getattr(instance, "name", None))
    code = attrs.get("product_code", getattr(instance, "product_code", None))
    name = (name or "").strip()
    code = (code or "").strip()
    if "name" in attrs:
        attrs["name"] = name
    if "product_code" in attrs:
        # Blank is stored as NULL, the same way the CSV import stores it.
        attrs["product_code"] = code or None
    if not name:
        return attrs

    clash = Product.objects.filter(user=owner_for(request), name=name)
    if code:
        clash = clash.filter(product_code=code)
    else:
        clash = clash.filter(Q(product_code__isnull=True) | Q(product_code=""))
    if instance is not None:
        # Saving a product without renaming it must not collide with itself.
        clash = clash.exclude(pk=instance.pk)

    if clash.exists():
        raise serializers.ValidationError(
            {
                "name": [
                    "এই নাম আর কোডে একটা প্রোডাক্ট আগে থেকেই আছে। কোড আলাদা দিন।"
                    if code
                    else "এই নামে একটা প্রোডাক্ট আগে থেকেই আছে। আলাদা প্রোডাক্ট কোড দিলে একই নামেও রাখা যাবে।"
                ]
            }
        )
    return attrs


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
    # Serial-tracked units (bikes/CNGs/cars) counted per unit, not in bulk.
    vehicle_stock = serializers.ReadOnlyField()
    vehicle_sold = serializers.ReadOnlyField()
    is_vehicle = serializers.ReadOnlyField()

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
            "vehicle_stock",
            "vehicle_sold",
            "is_vehicle",
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
            "vehicle_stock",
            "vehicle_sold",
            "is_vehicle",
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

        return check_identity_is_free(self, data)

    def validate_category(self, value):
        """Ensure the category belongs to this shop."""
        if value and value.user != owner_for(self.context["request"]):
            raise serializers.ValidationError("Category not found")
        return value

    def validate_supplier(self, value):
        """Ensure the supplier belongs to this shop."""
        if value and value.user != owner_for(self.context["request"]):
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

        if has_variants:
            if not variants_data:
                raise serializers.ValidationError(
                    "At least one variant is required when hasVariants is True"
                )

            # Validate each variant
            for i, variant_data in enumerate(variants_data):
                buy_price = variant_data.get("buyPrice", 0)
                sell_price = variant_data.get("sellPrice", 0)
                stock = variant_data.get("stock", 0)

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

        return check_identity_is_free(self, data)

    def validate_colorSizeVariants(self, value):
        """Validate colorSizeVariants JSON field"""
        if value is None:
            return value

        if not isinstance(value, list):
            raise serializers.ValidationError("colorSizeVariants must be a list")

        # Ensure it's not a nested array
        if value and isinstance(value[0], list):
            value = value[0]

        return value

    def validate_category(self, value):
        """Ensure the category belongs to this shop."""
        # owner_for(), not request.user: a staff login owns no records of its
        # own, so comparing against the login rejected every category its
        # employer owns — i.e. all of them.
        if value and value.user != owner_for(self.context["request"]):
            raise serializers.ValidationError("Category not found")
        return value

    def validate_supplier(self, value):
        """Ensure the supplier belongs to this shop."""
        if value and value.user != owner_for(self.context["request"]):
            raise serializers.ValidationError("Supplier not found")
        return value

    def create(self, validated_data):
        """Create product with variants and photos"""
        variants_data = validated_data.pop("colorSizeVariants", [])
        photos_data = validated_data.pop("photos", [])

        # The shop, not the login. get_queryset() filters on owner_for(), so a
        # product saved under a staff account's own id would vanish from the
        # owner's list the moment it was created.
        validated_data["user"] = owner_for(self.context["request"])

        # For non-variant products, ensure stock is set properly
        if not validated_data.get("has_variants", False):
            # Keep the stock value from validated_data, don't override it
            if "stock" not in validated_data:
                validated_data["stock"] = 0

        # Create product
        product = Product.objects.create(**validated_data)

        # Create variants if provided
        if product.has_variants and variants_data:
            for i, variant_data in enumerate(variants_data):
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

                ProductVariant.objects.create(**variant_create_data)

        # Create photos if provided
        for i, photo in enumerate(photos_data):
            ProductPhoto.objects.create(product=product, image=photo, order=i)

        return product


class ProductSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for fast product search in orders/invoices"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "product_code",
            "category_name",
            "has_variants",
            "no_stock_required",
            "buy_price",
            "sell_price",
            "stock",
            "variants",
            "is_active",
        ]


class ProductStockMovementSerializer(OwnedRelationsMixin, serializers.ModelSerializer):
    owned_relations = ("product", "variant",)

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
        # `user` is never taken from the request body: without this a client
        # could post a stock movement attributed to another shop.
        read_only_fields = ["id", "created_at", "user"]
