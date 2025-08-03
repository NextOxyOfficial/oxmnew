from django.contrib.auth.models import User
from employees.models import Employee
from rest_framework import serializers

from .models import BankAccount, Transaction


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
        # Check if debit transaction would make account balance negative
        if data.get("type") == "debit":
            account = data.get("account")
            amount = data.get("amount")
            if account and account.balance < amount:
                raise serializers.ValidationError(
                    f"Insufficient balance. Account balance: ${account.balance}"
                )
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
        # Check if debit transaction would make account balance negative
        if data.get("type") == "debit":
            account = data.get("account")
            amount = data.get("amount")
            if account and account.balance < amount:
                raise serializers.ValidationError(
                    f"Insufficient balance. Account balance: ${account.balance}"
                )
        return data
