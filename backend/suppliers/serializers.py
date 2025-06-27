from rest_framework import serializers
from .models import Supplier, Purchase, Payment


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
    supplier = serializers.SerializerMethodField()
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier', 'date', 'amount', 'status', 
            'products', 'notes', 'proof_document', 'proof_url', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'supplier', 'proof_url']

    def get_supplier(self, obj):
        return {
            'id': obj.supplier.id,
            'name': obj.supplier.name
        }

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


class PurchaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = ['date', 'amount', 'status', 'products', 'notes', 'proof_document']


class PaymentSerializer(serializers.ModelSerializer):
    supplier = serializers.SerializerMethodField()
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'supplier', 'date', 'amount', 'method', 'status', 
            'reference', 'notes', 'proof_document', 'proof_url', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'supplier', 'proof_url']

    def get_supplier(self, obj):
        return {
            'id': obj.supplier.id,
            'name': obj.supplier.name
        }

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


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['supplier', 'date', 'amount', 'method', 'status', 'reference', 'notes', 'proof_document']

    def create(self, validated_data):
        # Get the current user from the request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class PaymentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['date', 'amount', 'method', 'status', 'reference', 'notes', 'proof_document']
        
    def update(self, instance, validated_data):
        # Update only the fields that are provided
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
