from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth.models import User
from .models import BankAccount, Transaction
from .serializers import (
    BankAccountSerializer, 
    TransactionSerializer, 
    TransactionCreateSerializer,
    UserSerializer
)


class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'owner']
    search_fields = ['name', 'owner__username', 'owner__first_name', 'owner__last_name']
    ordering_fields = ['name', 'balance', 'created_at']
    ordering = ['-created_at']

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
            select={'is_main': "CASE WHEN name = 'Main' THEN 0 ELSE 1 END"}
        ).order_by('is_main', '-created_at')

    def ensure_main_account(self, user):
        """Ensure user has a Main account"""
        if not BankAccount.objects.filter(owner=user, name="Main").exists():
            BankAccount.objects.create(
                name="Main",
                owner=user,
                balance=0.00,
                is_active=True
            )

    def perform_create(self, serializer):
        """Set the current user as the account owner"""
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def my_accounts(self, request):
        """Get current user's accounts only"""
        accounts = BankAccount.objects.filter(owner=request.user, is_active=True).extra(
            select={'is_main': "CASE WHEN name = 'Main' THEN 0 ELSE 1 END"}
        ).order_by('is_main', '-created_at')
        serializer = self.get_serializer(accounts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get all transactions for a specific account"""
        account = self.get_object()
        transactions = account.transactions.all()
        
        # Apply filtering
        transaction_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        search = request.query_params.get('search')

        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        if date_from:
            transactions = transactions.filter(date__gte=date_from)
        if date_to:
            transactions = transactions.filter(date__lte=date_to)
        if search:
            transactions = transactions.filter(
                Q(purpose__icontains=search) |
                Q(reference_number__icontains=search)
            )

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get account summary with totals"""
        account = self.get_object()
        verified_transactions = account.transactions.filter(status='verified')
        
        total_credits = sum(
            t.amount for t in verified_transactions.filter(type='credit')
        )
        total_debits = sum(
            t.amount for t in verified_transactions.filter(type='debit')
        )
        
        return Response({
            'account_id': account.id,
            'account_name': account.name,
            'current_balance': account.balance,
            'total_credits': total_credits,
            'total_debits': total_debits,
            'transaction_count': verified_transactions.count(),
            'created_at': account.created_at,
        })


class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['account', 'type', 'status', 'verified_by']
    search_fields = ['purpose', 'reference_number']
    ordering_fields = ['date', 'amount', 'type']
    ordering = ['-date']

    def get_queryset(self):
        """Return transactions based on user permissions"""
        user = self.request.user
        
        # If user is staff/admin, they can see all transactions
        if user.is_staff or user.is_superuser:
            return Transaction.objects.all()
        
        # Regular users can only see transactions for their own accounts
        return Transaction.objects.filter(account__owner=user)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        """Override to validate account ownership"""
        account = serializer.validated_data['account']
        
        # Check if user owns the account (unless they're staff/admin)
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            if account.owner != self.request.user:
                raise PermissionError("You can only create transactions for your own accounts")
        
        # Save the transaction - balance will be updated in the model's save method
        transaction = serializer.save()

    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        """Get current user's transactions only"""
        transactions = Transaction.objects.filter(account__owner=request.user)
        
        # Apply same filtering as regular endpoint
        transaction_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        search = request.query_params.get('search')
        account_id = request.query_params.get('account_id')

        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        if date_from:
            transactions = transactions.filter(date__gte=date_from)
        if date_to:
            transactions = transactions.filter(date__lte=date_to)
        if search:
            transactions = transactions.filter(
                Q(purpose__icontains=search) |
                Q(reference_number__icontains=search)
            )
        if account_id:
            transactions = transactions.filter(account_id=account_id)

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def employees(self, request):
        """Get list of employees who can verify transactions"""
        employees = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
        serializer = UserSerializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a pending transaction"""
        transaction = self.get_object()
        
        if transaction.status != 'pending':
            return Response(
                {'error': 'Transaction is not in pending status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaction.status = 'verified'
        transaction.verified_by = request.user
        transaction.save()  # Balance will be updated in the model's save method
        
        serializer = self.get_serializer(transaction)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a transaction"""
        transaction = self.get_object()
        
        if transaction.status == 'cancelled':
            return Response(
                {'error': 'Transaction is already cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If transaction was verified, reverse the balance update
        if transaction.status == 'verified':
            reverse_type = 'debit' if transaction.type == 'credit' else 'credit'
            transaction.account.update_balance(transaction.amount, reverse_type)
        
        transaction.status = 'cancelled'
        transaction.save()
        
        serializer = self.get_serializer(transaction)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for transactions"""
        account_id = request.query_params.get('account_id')
        
        transactions = self.get_queryset()
        if account_id:
            transactions = transactions.filter(account_id=account_id)
        
        verified_transactions = transactions.filter(status='verified')
        
        total_credits = sum(
            t.amount for t in verified_transactions.filter(type='credit')
        )
        total_debits = sum(
            t.amount for t in verified_transactions.filter(type='debit')
        )
        
        return Response({
            'total_transactions': transactions.count(),
            'verified_transactions': verified_transactions.count(),
            'pending_transactions': transactions.filter(status='pending').count(),
            'total_credits': total_credits,
            'total_debits': total_debits,
            'net_amount': total_credits - total_debits,
        })
