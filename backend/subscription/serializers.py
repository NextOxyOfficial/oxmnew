# subscription/serializers.py
from rest_framework import serializers
from .models import (
    PaymentTransaction,
    SMSPackage,
    SMSSentHistory,
    SubscriptionPlan,
    UserSMSCredit,
    UserSubscription,
)

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SMSPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSPackage
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = '__all__'

class UserSMSCreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSMSCredit
        fields = '__all__'

class SMSSentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSSentHistory
        fields = '__all__'


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "sp_order_id",
            "customer_order_id",
            "payment_type",
            "amount",
            "currency",
            "is_successful",
            "is_applied",
            "applied_at",
            "created_at",
            "updated_at",
        ]
