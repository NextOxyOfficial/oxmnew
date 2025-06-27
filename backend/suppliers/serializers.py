from rest_framework import serializers
from .models import Supplier, Purchase


class SupplierSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'address', 'phone', 'email', 'website', 
            'contact_person', 'notes', 'is_active', 'total_orders', 
            'total_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_orders', 'total_amount']

    def create(self, validated_data):
        # Get the current user from the request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class SupplierCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['name', 'address', 'phone', 'email', 'website', 'contact_person', 'notes']

    def create(self, validated_data):
        # Get the current user from the request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier', 'supplier_name', 'date', 'amount', 'status', 
            'products', 'notes', 'proof_document', 'proof_url', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'supplier_name', 'proof_url']

    def get_proof_url(self, obj):
        if obj.proof_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.proof_document.url)
        return None

    def create(self, validated_data):
        # Get the current user from the request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class PurchaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = ['supplier', 'date', 'amount', 'status', 'products', 'notes', 'proof_document']

    def create(self, validated_data):
        # Get the current user from the request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
