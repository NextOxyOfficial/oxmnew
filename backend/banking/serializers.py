from django.contrib.auth.models import User
from employees.models import Employee
from rest_framework import serializers

from .models import BankAccount, BankingPlan, Transaction, UserBankingPlan


class BankAccountSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    total_credits = serializers.SerializerMethodField()
    total_debits = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            "id",
            "name",
            "account_number",
            "owner",
            "owner_name",
            "owner_username",
            "balance",
            "created_at",
            "updated_at",
            "is_active",
            "transaction_count",
            "total_credits",
            "total_debits",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "owner"]

    def get_transaction_count(self, obj):
        return obj.transactions.count()

    def get_total_credits(self, obj):
        return (
            obj.transactions.filter(type="credit", status="verified").aggregate(
                total=serializers.models.Sum("amount")
            )["total"]
            or 0
        )

    def get_total_debits(self, obj):
        return (
            obj.transactions.filter(type="debit", status="verified").aggregate(
                total=serializers.models.Sum("amount")
            )["total"]
            or 0
        )


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["id", "name", "employee_id", "email", "role", "department"]


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class TransactionSerializer(serializers.ModelSerializer):
    verified_by_details = EmployeeSerializer(source="verified_by", read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "account",
            "type",
            "amount",
            "purpose",
            "verified_by",
            "status",
            "date",
            "updated_at",
            "reference_number",
            "verified_by_details",
            "account_name",
        ]
        read_only_fields = ["id", "date", "updated_at", "reference_number"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, data):
        # Allow negative balances - no balance check required
        return data


class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["account", "type", "amount", "purpose", "verified_by", "status"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, data):
        # Allow negative balances - no balance check required
        return data


class BankingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankingPlan
        fields = [
            "id",
            "name",
            "period",
            "price",
            "description",
            "features",
            "is_popular",
            "is_active",
        ]


class UserBankingPlanSerializer(serializers.ModelSerializer):
    plan = BankingPlanSerializer(read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = UserBankingPlan
        fields = [
            "id",
            "user",
            "user_name",
            "plan",
            "account",
            "account_name",
            "activated_at",
            "expires_at",
            "is_active",
            "payment_order_id",
            "payment_amount",
            "payment_status",
        ]
        read_only_fields = ["id", "activated_at", "created_at", "updated_at"]
