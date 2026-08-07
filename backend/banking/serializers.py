from django.contrib.auth.models import User
from employees.models import Employee
from rest_framework import serializers

from .models import (
    BankAccount,
    BankingPlan,
    Loan,
    LoanPayment,
    RecurringCost,
    RecurringCostPayment,
    Transaction,
    UserBankingPlan,
)


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
            "nature",
            "category",
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


class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "account",
            "type",
            "nature",
            "category",
            "amount",
            "purpose",
            "verified_by",
            "status",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, data):
        """Guard against attaching another shop's employee as the verifier.

        This class previously declared `validate` twice; Python kept only the
        second definition, so the ownership check below never ran and any
        employee id was accepted. The two are merged here.
        """
        request = self.context.get("request")
        if request and not (request.user.is_staff or request.user.is_superuser):
            verified_by = data.get("verified_by")
            if verified_by is not None and verified_by.user_id != request.user.id:
                raise serializers.ValidationError(
                    {"verified_by": "Invalid employee selection."}
                )
        # Negative balances are allowed on purpose — a shop can overdraw.
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
        read_only_fields = ["id", "activated_at", "created_at", "updated_at", "user"]


class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = [
            "id",
            "loan",
            "amount",
            "paid_on",
            "transaction",
            "reference",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "loan", "transaction"]


class LoanSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source="account.name", read_only=True)
    # Computed on the model so the list, the detail view and the analytics
    # report all read the same numbers.
    paid_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    paid_count = serializers.IntegerField(read_only=True)
    remaining_count = serializers.IntegerField(read_only=True)
    progress_pct = serializers.FloatField(read_only=True)
    next_due_date = serializers.DateField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    payments = LoanPaymentSerializer(many=True, read_only=True)
    # The month-by-month plan, so the UI can show which installments are
    # settled and when the next one falls due.
    schedule = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "account",
            "account_name",
            "lender",
            "purpose",
            "principal",
            "total_payable",
            "interest_rate",
            "installment_amount",
            "installment_count",
            "payment_day",
            "start_date",
            "status",
            "notes",
            "paid_amount",
            "remaining_amount",
            "paid_count",
            "remaining_count",
            "progress_pct",
            "next_due_date",
            "is_overdue",
            "days_overdue",
            "payments",
            "schedule",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_schedule(self, obj):
        """The plan, with receipt links made absolute for the browser."""
        request = self.context.get("request")
        rows = obj.schedule
        if request is None:
            return rows
        for row in rows:
            if row.get("receipt_url"):
                row["receipt_url"] = request.build_absolute_uri(row["receipt_url"])
        return rows

    def validate_payment_day(self, value):
        if not 1 <= value <= 31:
            raise serializers.ValidationError("তারিখ 1 থেকে 31 এর মধ্যে হতে হবে।")
        return value

    def validate(self, data):
        """Total payable can never be less than the principal.

        Caught here rather than left to the user, because a typo makes the loan
        look already-overpaid and quietly corrupts the cost projection.
        """
        principal = data.get("principal", getattr(self.instance, "principal", None))
        total = data.get("total_payable", getattr(self.instance, "total_payable", None))
        if principal is not None and total is not None and total < principal:
            raise serializers.ValidationError(
                {"total_payable": "মোট ফেরত মূল টাকার চেয়ে কম হতে পারে না।"}
            )
        return data


class RecurringCostPaymentSerializer(serializers.ModelSerializer):
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = RecurringCostPayment
        fields = [
            "id",
            "period",
            "amount",
            "paid_on",
            "receipt",
            "receipt_url",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_receipt_url(self, obj):
        if not obj.receipt:
            return None
        request = self.context.get("request")
        url = obj.receipt.url
        return request.build_absolute_uri(url) if request else url


class RecurringCostSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source="account.name", read_only=True)
    due_date = serializers.DateField(read_only=True)
    paid_this_month = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    paid_total = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    payments = RecurringCostPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = RecurringCost
        fields = [
            "id",
            "account",
            "account_name",
            "title",
            "category",
            "amount",
            "due_day",
            "start_date",
            "is_active",
            "notes",
            "due_date",
            "paid_this_month",
            "is_overdue",
            "days_overdue",
            "paid_total",
            "payments",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_due_day(self, value):
        if not 1 <= value <= 31:
            raise serializers.ValidationError("তারিখ 1 থেকে 31 এর মধ্যে হতে হবে।")
        return value
