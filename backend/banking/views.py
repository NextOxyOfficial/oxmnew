from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from employees.models import Employee
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BankAccount, BankingPlan, Transaction, UserBankingPlan
from .serializers import (
    BankAccountSerializer,
    BankingPlanSerializer,
    TransactionCreateSerializer,
    TransactionSerializer,
)


def has_active_banking_plan(user):
    """Check if user has a pro subscription plan"""
    try:
        from subscription.models import UserSubscription
        user_subscription = UserSubscription.objects.get(user=user, active=True)
        return user_subscription.plan.name == 'pro'
    except UserSubscription.DoesNotExist:
        return False


class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["is_active", "owner"]
    search_fields = ["name", "owner__username", "owner__first_name", "owner__last_name"]
    ordering_fields = ["name", "balance", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return accounts based on user permissions"""
        user = self.request.user

        # Ensure user has a Main account
        self.ensure_main_account(user)

        # If user is staff/admin, they can see all accounts
        if user.is_staff or user.is_superuser:
            queryset = BankAccount.objects.filter(is_active=True)
        else:
            # Regular users can only see their own accounts
            queryset = BankAccount.objects.filter(owner=user, is_active=True)

        # Order by: Main account first, then by creation date (newest first)
        return queryset.extra(
            select={"is_main": "CASE WHEN name = 'Main' THEN 0 ELSE 1 END"}
        ).order_by("is_main", "-created_at")

    def ensure_main_account(self, user):
        """Ensure user has a Main account"""
        if not BankAccount.objects.filter(owner=user, name="Main").exists():
            BankAccount.objects.create(
                name="Main", owner=user, balance=0.00, is_active=True
            )

    def perform_create(self, serializer):
        """Set the current user as the account owner and check for active banking plan"""
        user = self.request.user

        # Allow creation of Main account even without banking plan
        account_name = serializer.validated_data.get("name", "")
        if account_name != "Main":
            # For all other accounts, check if user has active banking plan
            if not has_active_banking_plan(user):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "You need to upgrade to Pro to create additional accounts. "
                    "Free users can only have the Main account."
                )
            
            # Check if user has reached the account limit (5 accounts total)
            existing_accounts_count = BankAccount.objects.filter(
                owner=user, is_active=True
            ).count()
            
            if existing_accounts_count >= 5:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "You have reached the maximum limit of 5 accounts. "
                    "Please delete an existing account before creating a new one."
                )

        serializer.save(owner=user)

    @action(detail=False, methods=["get"])
    def my_accounts(self, request):
        """Get current user's accounts only"""
        accounts = (
            BankAccount.objects.filter(owner=request.user, is_active=True)
            .extra(select={"is_main": "CASE WHEN name = 'Main' THEN 0 ELSE 1 END"})
            .order_by("is_main", "-created_at")
        )
        serializer = self.get_serializer(accounts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get all transactions for a specific account"""
        account = self.get_object()
        transactions = account.transactions.all()

        # Apply filtering
        transaction_type = request.query_params.get("type")
        status_filter = request.query_params.get("status")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        search = request.query_params.get("search")
        verified_by = request.query_params.get("verified_by")

        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        if date_from:
            transactions = transactions.filter(date__gte=date_from)
        if date_to:
            # Include the entire end date by adding time 23:59:59
            from datetime import datetime, time

            try:
                # Parse the date string and combine with end of day time
                end_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                end_datetime = datetime.combine(end_date, time(23, 59, 59))
                transactions = transactions.filter(date__lte=end_datetime)
            except ValueError:
                # Fallback to original behavior if date parsing fails
                transactions = transactions.filter(date__lte=date_to)
        if search:
            transactions = transactions.filter(
                Q(purpose__icontains=search) | Q(reference_number__icontains=search)
            )
        if verified_by:
            transactions = transactions.filter(verified_by=verified_by)

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """Get account summary with totals"""
        account = self.get_object()
        verified_transactions = account.transactions.filter(status="verified")

        total_credits = sum(
            t.amount for t in verified_transactions.filter(type="credit")
        )
        total_debits = sum(t.amount for t in verified_transactions.filter(type="debit"))

        return Response(
            {
                "account_id": account.id,
                "account_name": account.name,
                "current_balance": account.balance,
                "total_credits": total_credits,
                "total_debits": total_debits,
                "transaction_count": verified_transactions.count(),
                "created_at": account.created_at,
            }
        )


class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["account", "type", "status", "verified_by"]
    search_fields = ["purpose", "reference_number"]
    ordering_fields = ["date", "amount", "type"]
    ordering = ["-date"]

    def get_queryset(self):
        """Return transactions based on user permissions"""
        user = self.request.user

        # If user is staff/admin, they can see all transactions
        if user.is_staff or user.is_superuser:
            return Transaction.objects.all()

        # Regular users can only see transactions for their own accounts
        return Transaction.objects.filter(account__owner=user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        """Override to validate account ownership"""
        account = serializer.validated_data["account"]

        # Check if user owns the account (unless they're staff/admin)
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            if account.owner != self.request.user:
                raise PermissionError(
                    "You can only create transactions for your own accounts"
                )

        # Save the transaction - balance will be updated in the model's save method
        transaction = serializer.save()

    @action(detail=False, methods=["get"])
    def my_transactions(self, request):
        """Get current user's transactions only"""
        transactions = Transaction.objects.filter(account__owner=request.user)

        # Apply same filtering as regular endpoint
        transaction_type = request.query_params.get("type")
        status_filter = request.query_params.get("status")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        search = request.query_params.get("search")
        account_id = request.query_params.get("account_id")
        verified_by = request.query_params.get("verified_by")

        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        if date_from:
            transactions = transactions.filter(date__gte=date_from)
        if date_to:
            # Include the entire end date by adding time 23:59:59
            from datetime import datetime, time

            try:
                # Parse the date string and combine with end of day time
                end_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                end_datetime = datetime.combine(end_date, time(23, 59, 59))
                transactions = transactions.filter(date__lte=end_datetime)
            except ValueError:
                # Fallback to original behavior if date parsing fails
                transactions = transactions.filter(date__lte=date_to)
        if search:
            transactions = transactions.filter(
                Q(purpose__icontains=search) | Q(reference_number__icontains=search)
            )
        if account_id:
            transactions = transactions.filter(account_id=account_id)
        if verified_by:
            transactions = transactions.filter(verified_by=verified_by)

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def employees(self, request):
        """Get list of employees who can verify transactions"""
        # Filter employees by current user (store owner)
        employees = (
            Employee.objects.filter(user=request.user, status="active")
            .select_related("user")
            .order_by("name")
        )

        # Add search functionality
        search = request.query_params.get("search", "")
        if search:
            employees = employees.filter(
                Q(name__icontains=search)
                | Q(employee_id__icontains=search)
                | Q(role__icontains=search)
                | Q(department__icontains=search)
            )

        # Convert to the expected format for the frontend
        employee_data = [
            {
                "id": emp.id,  # Use Employee ID for verified_by field
                "first_name": emp.name.split()[0] if emp.name else "",
                "last_name": " ".join(emp.name.split()[1:])
                if len(emp.name.split()) > 1
                else "",
                "username": emp.employee_id,
                "email": emp.email,
                "full_name": emp.name,
                "name": emp.name,  # Add name field for consistency
                "employee_id": emp.employee_id,
                "role": emp.role,
                "department": emp.department,
                "status": emp.status,
            }
            for emp in employees
        ]

        return Response(employee_data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Verify a pending transaction"""
        transaction = self.get_object()

        if transaction.status != "pending":
            return Response(
                {"error": "Transaction is not in pending status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction.status = "verified"
        # Get the employee associated with the current user
        try:
            employee = Employee.objects.get(user=request.user, status="active")
            transaction.verified_by = employee
        except Employee.DoesNotExist:
            return Response(
                {"error": "No active employee found for current user"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transaction.save()  # Balance will be updated in the model's save method

        serializer = self.get_serializer(transaction)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel a transaction"""
        transaction = self.get_object()

        if transaction.status == "cancelled":
            return Response(
                {"error": "Transaction is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If transaction was verified, reverse the balance update
        if transaction.status == "verified":
            reverse_type = "debit" if transaction.type == "credit" else "credit"
            transaction.account.update_balance(transaction.amount, reverse_type)

        transaction.status = "cancelled"
        transaction.save()

        serializer = self.get_serializer(transaction)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        """Get dashboard statistics for transactions"""
        account_id = request.query_params.get("account_id")

        transactions = self.get_queryset()
        if account_id:
            transactions = transactions.filter(account_id=account_id)

        verified_transactions = transactions.filter(status="verified")

        total_credits = sum(
            t.amount for t in verified_transactions.filter(type="credit")
        )
        total_debits = sum(t.amount for t in verified_transactions.filter(type="debit"))

        return Response(
            {
                "total_transactions": transactions.count(),
                "verified_transactions": verified_transactions.count(),
                "pending_transactions": transactions.filter(status="pending").count(),
                "total_credits": total_credits,
                "total_debits": total_debits,
                "net_amount": total_credits - total_debits,
            }
        )


class BankingPlanListView(generics.ListAPIView):
    """List all active banking plans"""

    queryset = BankingPlan.objects.filter(is_active=True)
    serializer_class = BankingPlanSerializer
    permission_classes = [IsAuthenticated]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activate_banking_plan(request):
    """Activate a banking plan for a user's account after successful payment"""
    print("=== ACTIVATE BANKING PLAN CALLED ===")
    print(f"Request method: {request.method}")
    print(f"Request user: {request.user}")
    print(f"Request data: {request.data}")

    account_id = request.data.get("account_id")
    plan_id = request.data.get("plan_id")
    payment_order_id = request.data.get("payment_order_id")
    payment_amount = request.data.get("payment_amount")

    if not all([account_id, plan_id, payment_order_id]):
        print("=== MISSING REQUIRED PARAMETERS ===")
        return Response(
            {
                "success": False,
                "message": "Account ID, Plan ID, and Payment Order ID are required",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    print("=== ALL PARAMETERS PRESENT ===")
    print(
        f"account_id: {account_id}, plan_id: {plan_id}, payment_order_id: {payment_order_id}"
    )

    try:
        print("=== TRYING TO GET ACCOUNT AND PLAN ===")

        # First get the banking plan
        plan = BankingPlan.objects.get(id=plan_id, is_active=True)
        print(f"Found plan: {plan}")

        # Try to get the specific account first
        account = None
        try:
            account = BankAccount.objects.get(id=account_id, owner=request.user)
            print(f"Found existing account: {account}")
        except BankAccount.DoesNotExist:
            print(f"Account with ID {account_id} not found. Creating new account...")

            # Check if user has any existing accounts
            user_accounts = BankAccount.objects.filter(owner=request.user)
            if user_accounts.exists():
                # Use the first available account
                account = user_accounts.first()
                print(f"Using existing user account: {account}")
            else:
                # Create a new account for banking plan activation
                # Use a proper default name
                account_name = f"{request.user.first_name or request.user.username}'s Banking Account"
                account = BankAccount.objects.create(
                    owner=request.user, name=account_name, balance=0.00
                )
                print(f"Created new account: {account}")

        # Calculate expiry date based on plan period
        activated_at = timezone.now()
        if plan.period == "monthly":
            expires_at = activated_at + timedelta(days=30)
        elif plan.period == "yearly":
            expires_at = activated_at + timedelta(days=365)
        else:
            expires_at = None

        print(f"Calculated dates: activated_at={activated_at}, expires_at={expires_at}")

        # Create or update user banking plan
        user_plan, created = UserBankingPlan.objects.get_or_create(
            user=request.user,
            account=account,
            defaults={
                "plan": plan,
                "activated_at": activated_at,
                "expires_at": expires_at,
                "payment_order_id": payment_order_id,
                "payment_amount": payment_amount,
                "payment_status": "completed",
                "is_active": True,
            },
        )

        if not created:
            # Update existing plan
            user_plan.plan = plan
            user_plan.activated_at = activated_at
            user_plan.expires_at = expires_at
            user_plan.payment_order_id = payment_order_id
            user_plan.payment_amount = payment_amount
            user_plan.payment_status = "completed"
            user_plan.is_active = True
            user_plan.save()

        print("=== ABOUT TO RETURN SUCCESS RESPONSE ===")
        response_data = {
            "success": True,
            "message": f"Successfully activated {plan.name} {plan.period} plan for account {account.name}",
            "plan": BankingPlanSerializer(plan).data,
            "expires_at": expires_at,
        }
        print(f"Response data: {response_data}")

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )

    except BankAccount.DoesNotExist:
        print("=== BANK ACCOUNT NOT FOUND ===")
        return Response(
            {
                "success": False,
                "message": "Bank account not found or you do not have permission to access it",
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except BankingPlan.DoesNotExist:
        print("=== BANKING PLAN NOT FOUND ===")
        return Response(
            {"success": False, "message": "Banking plan not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        print(f"=== UNEXPECTED EXCEPTION: {str(e)} ===")
        print(f"Exception type: {type(e)}")
        import traceback

        traceback.print_exc()
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class UserBankingPlanView(generics.RetrieveAPIView):
    """
    Get current user's banking plan
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_plan = UserBankingPlan.objects.get(user=request.user)
            from .serializers import UserBankingPlanSerializer

            return Response(UserBankingPlanSerializer(user_plan).data)
        except UserBankingPlan.DoesNotExist:
            return Response(
                {"message": "No active banking plan found"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def test_banking_endpoint(request):
    """Simple test endpoint to verify URL routing is working"""
    return Response(
        {
            "message": "Banking test endpoint is working",
            "method": request.method,
            "user": str(request.user),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activate_banking_plan_v2(request):
    """Alternative activate banking plan function for testing"""
    print("=== ACTIVATE BANKING PLAN V2 CALLED ===")
    return Response(
        {
            "success": True,
            "message": "Banking plan activation endpoint is working (v2)",
            "data": request.data,
        },
        status=status.HTTP_200_OK,
    )
