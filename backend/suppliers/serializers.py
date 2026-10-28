from core.scoping import owner_for
from rest_framework import serializers
from .models import Supplier, Purchase, Payment

TAKEN = "এই নামে একটা সাপ্লায়ার আগে থেকেই আছে। অন্য নাম দিন।"


def supplier_name_clash(serializer, value):
    """The supplier already holding this name in this shop, if any.

    Supplier has unique_together ("name", "user") and the user is attached on
    save, so DRF cannot check it — a duplicate reached the INSERT and came back
    as a bare 500. Deleting a supplier only flips is_active, so a deleted one
    still holds its name; callers decide what that means for them.
    """
    request = serializer.context.get("request")
    name = (value or "").strip()
    if request is None or not name:
        return name, None
    clash = Supplier.objects.filter(user=owner_for(request), name=name)
    if serializer.instance is not None:
        clash = clash.exclude(pk=serializer.instance.pk)
    return name, clash.first()


class SupplierSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    #: Signed: positive = still owed to the supplier, negative = paid ahead.
    balance = serializers.ReadOnlyField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'address', 'phone', 'email', 'website',
            'contact_person', 'notes', 'is_active', 'total_orders',
            'total_amount', 'total_paid', 'balance', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'total_orders', 'total_amount',
            'total_paid', 'balance',
        ]

    def validate_name(self, value):
        name, clash = supplier_name_clash(self, value)
        if clash is not None:
            raise serializers.ValidationError(
                TAKEN if clash.is_active
                else "এই নামে আগে একটা সাপ্লায়ার ছিল, সেটা মুছে ফেলা হয়েছে। অন্য নাম দিন।"
            )
        return name

    def create(self, validated_data):
        # The shop, not the login — and never overwrite a user the caller
        # already passed to save(), which is how the viewset attaches it.
        validated_data.setdefault('user', owner_for(self.context['request']))
        return super().create(validated_data)


class SupplierCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['name', 'address', 'phone', 'email', 'website', 'contact_person', 'notes']

    def validate_name(self, value):
        # A deleted supplier with this name is not an error here: the viewset
        # brings that one back instead of refusing a name the user cannot see.
        name, clash = supplier_name_clash(self, value)
        if clash is not None and clash.is_active:
            raise serializers.ValidationError(TAKEN)
        return name

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
        
    def validate(self, data):
        return super().validate(data)

    def validate_status(self, value):
        valid_statuses = ['pending', 'completed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {valid_statuses}")
        return value

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


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
