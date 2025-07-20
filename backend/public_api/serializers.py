from products.models import Product, ProductPhoto, ProductVariant
from rest_framework import serializers

from .models import APIKeyUsageLog, PublicAPIKey


class PublicProductPhotoSerializer(serializers.ModelSerializer):
    """Serializer for product photos in public API"""

    class Meta:
        model = ProductPhoto
        fields = ["id", "image", "alt_text", "order"]


class PublicProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants in public API"""

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "color",
            "size",
            "custom_variant",
            "buy_price",
            "sell_price",
            "stock",
            "created_at",
            "updated_at",
        ]


class PublicProductSerializer(serializers.ModelSerializer):
    """Serializer for products in public API"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    photos = PublicProductPhotoSerializer(many=True, read_only=True)
    variants = PublicProductVariantSerializer(many=True, read_only=True)
    main_photo = serializers.SerializerMethodField()
    profit_margin = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "details",
            "location",
            "category_name",
            "supplier_name",
            "has_variants",
            "buy_price",
            "sell_price",
            "stock",
            "profit_margin",
            "total_stock",
            "main_photo",
            "photos",
            "variants",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_main_photo(self, obj):
        """Get the main photo URL"""
        if obj.photos.exists():
            return obj.photos.first().image.url if obj.photos.first().image else None
        return None

    def get_profit_margin(self, obj):
        """Calculate profit margin"""
        if obj.buy_price and obj.sell_price and obj.buy_price > 0:
            return round(((obj.sell_price - obj.buy_price) / obj.buy_price) * 100, 2)
        return 0

    def get_total_stock(self, obj):
        """Get total stock including variants"""
        if obj.has_variants:
            return sum(variant.stock for variant in obj.variants.all())
        return obj.stock


class PublicAPIKeySerializer(serializers.ModelSerializer):
    """Serializer for PublicAPIKey model"""

    class Meta:
        model = PublicAPIKey
        fields = [
            "id",
            "key",
            "name",
            "is_active",
            "created_at",
            "updated_at",
            "last_used",
            "requests_per_hour",
            "requests_per_day",
        ]
        read_only_fields = ["key", "created_at", "updated_at", "last_used"]


class APIKeyUsageLogSerializer(serializers.ModelSerializer):
    """Serializer for APIKeyUsageLog model"""

    class Meta:
        model = APIKeyUsageLog
        fields = [
            "id",
            "endpoint",
            "ip_address",
            "user_agent",
            "response_status",
            "response_time_ms",
            "timestamp",
        ]
        read_only_fields = ["timestamp"]
