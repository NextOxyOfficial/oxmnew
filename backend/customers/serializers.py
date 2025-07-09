from rest_framework import serializers
from .models import (
    Customer,
    CustomerGift,
    CustomerAchievement,
    CustomerLevel,
    DuePayment,
    Transaction,
    SMSLog,
)
from core.models import Gift, Achievement, Level


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_spent = serializers.ReadOnlyField()
    last_order_date = serializers.ReadOnlyField()
    active_gifts_count = serializers.ReadOnlyField()
    total_points = serializers.ReadOnlyField()
    current_level = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "address",
            "status",
            "notes",
            "total_orders",
            "total_spent",
            "last_order_date",
            "active_gifts_count",
            "total_points",
            "current_level",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_current_level(self, obj):
        current_level = obj.current_level
        if current_level:
            return {
                "id": current_level.id,
                "level": {
                    "id": current_level.level.id,
                    "name": current_level.level.name,
                    "is_active": current_level.level.is_active,
                    "created_at": current_level.level.created_at,
                },
                "assigned_date": current_level.assigned_date,
                "notes": current_level.notes,
            }
        return None


class CustomerGiftSerializer(serializers.ModelSerializer):
    gift_name = serializers.CharField(source="gift.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = CustomerGift
        fields = [
            "id",
            "customer",
            "customer_name",
            "gift",
            "gift_name",
            "value",
            "status",
            "description",
            "expiry_date",
            "used_date",
            "used_in_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CustomerAchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source="achievement.name", read_only=True)
    achievement_type = serializers.CharField(source="achievement.type", read_only=True)
    achievement_points = serializers.IntegerField(
        source="achievement.points", read_only=True
    )
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = CustomerAchievement
        fields = [
            "id",
            "customer",
            "customer_name",
            "achievement",
            "achievement_name",
            "achievement_type",
            "achievement_points",
            "earned_date",
            "notes",
        ]
        read_only_fields = ["earned_date"]


class CustomerLevelSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source="level.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    assigned_by_name = serializers.CharField(
        source="assigned_by.username", read_only=True
    )

    class Meta:
        model = CustomerLevel
        fields = [
            "id",
            "customer",
            "customer_name",
            "level",
            "level_name",
            "assigned_date",
            "is_current",
            "notes",
            "assigned_by",
            "assigned_by_name",
        ]
        read_only_fields = ["assigned_date", "assigned_by", "assigned_by_name"]


class DuePaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = DuePayment
        fields = [
            "id",
            "customer",
            "customer_name",
            "order",
            "order_number",
            "amount",
            "payment_type",
            "due_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TransactionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "customer",
            "customer_name",
            "order",
            "order_number",
            "due_payment",
            "transaction_type",
            "amount",
            "payment_method",
            "reference_number",
            "notes",
            "notify_customer",
            "sms_sent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SMSLogSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = SMSLog
        fields = [
            "id",
            "customer",
            "customer_name",
            "message",
            "phone_number",
            "status",
            "order",
            "transaction",
            "due_payment",
            "sms_service_response",
            "sent_at",
            "created_at",
        ]
        read_only_fields = ["created_at", "sent_at"]


# Serializers for available data (for dropdowns, etc.)
class GiftForCustomerSerializer(serializers.ModelSerializer):
    """Serializer for gifts available for assignment to customers"""

    class Meta:
        model = Gift
        fields = ["id", "name", "is_active", "created_at", "updated_at"]


class AchievementForCustomerSerializer(serializers.ModelSerializer):
    """Serializer for achievements available for assignment to customers"""

    class Meta:
        model = Achievement
        fields = [
            "id",
            "name",
            "type",
            "value",
            "points",
            "is_active",
            "created_at",
            "updated_at",
        ]


class LevelForCustomerSerializer(serializers.ModelSerializer):
    """Serializer for levels available for assignment to customers"""

    class Meta:
        model = Level
        fields = ["id", "name", "is_active", "created_at", "updated_at"]


# Detailed customer serializer for individual customer page
class CustomerDetailSerializer(CustomerSerializer):
    """Detailed customer serializer including related data"""

    customer_gifts = CustomerGiftSerializer(many=True, read_only=True)
    customer_achievements = CustomerAchievementSerializer(many=True, read_only=True)
    customer_levels = CustomerLevelSerializer(many=True, read_only=True)
    due_payments = DuePaymentSerializer(many=True, read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + [
            "customer_gifts",
            "customer_achievements",
            "customer_levels",
            "due_payments",
            "transactions",
        ]


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating customers"""

    class Meta:
        model = Customer
        fields = ["name", "email", "phone", "address", "status", "notes"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


# Statistics and analytics serializers
class TopCustomerSerializer(serializers.ModelSerializer):
    """Simplified serializer for top customers in statistics"""

    total_spent = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = ["id", "name", "email", "phone", "total_spent"]


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics"""

    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_customers = TopCustomerSerializer(many=True)
