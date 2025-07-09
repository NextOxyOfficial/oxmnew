from rest_framework import serializers
from .models import OnlineProduct, OnlineOrder, OnlineOrderItem, StoreSettings
from products.serializers import ProductListSerializer


class OnlineProductSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = OnlineProduct
        fields = ['id', 'product_id', 'name', 'description', 'price', 'category', 
                 'image_url', 'is_published', 'created_at', 'updated_at', 'product']
        read_only_fields = ['created_at', 'updated_at']


class OnlineOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnlineOrderItem
        fields = ['id', 'product_name', 'quantity', 'price', 'total']


class OnlineOrderSerializer(serializers.ModelSerializer):
    items = OnlineOrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = OnlineOrder
        fields = ['id', 'customer_name', 'customer_email', 'customer_phone', 
                 'customer_address', 'total_amount', 'status', 'order_notes', 
                 'created_at', 'updated_at', 'items']
        read_only_fields = ['created_at', 'updated_at']


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = ['terms_and_conditions', 'privacy_policy', 'store_description', 
                 'contact_email', 'contact_phone', 'store_logo', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PublicOnlineProductSerializer(serializers.ModelSerializer):
    """Simplified serializer for public store access."""
    class Meta:
        model = OnlineProduct
        fields = ['id', 'name', 'description', 'price', 'category', 'image_url']
