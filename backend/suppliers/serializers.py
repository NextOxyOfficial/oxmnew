from rest_framework import serializers
from .models import Supplier


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
