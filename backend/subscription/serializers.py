# subscription/serializers.py
from rest_framework import serializers
from .models import SubscriptionPlan, SMSPackage, UserSubscription, UserSMSCredit, SMSSentHistory

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SMSPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSPackage
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
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
