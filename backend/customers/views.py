from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    Customer, Order, OrderItem, CustomerGift, CustomerAchievement,
    CustomerLevel, DuePayment, Transaction, SMSLog
)
from .serializers import (
    CustomerSerializer, CustomerDetailSerializer, CustomerCreateUpdateSerializer,
    OrderSerializer, CustomerGiftSerializer, CustomerAchievementSerializer,
    CustomerLevelSerializer, DuePaymentSerializer, TransactionSerializer,
    SMSLogSerializer, GiftForCustomerSerializer, AchievementForCustomerSerializer,
    LevelForCustomerSerializer, CustomerStatsSerializer
)
from core.models import Gift, Achievement, Level


class CustomerListCreateView(generics.ListCreateAPIView):
    """List all customers or create a new customer"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'total_spent']
    ordering = ['-created_at']

    def get_queryset(self):
        return Customer.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CustomerCreateUpdateSerializer
        return CustomerSerializer


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a customer"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerDetailSerializer

    def get_queryset(self):
        return Customer.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    """List all orders or create a new order"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'customer']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an order"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class CustomerGiftListCreateView(generics.ListCreateAPIView):
    """List all customer gifts or create a new gift for a customer"""
    serializer_class = CustomerGiftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'gift']
    ordering = ['-created_at']

    def get_queryset(self):
        return CustomerGift.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CustomerGiftDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a customer gift"""
    serializer_class = CustomerGiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerGift.objects.filter(user=self.request.user)


class CustomerAchievementListCreateView(generics.ListCreateAPIView):
    """List all customer achievements or create a new achievement for a customer"""
    serializer_class = CustomerAchievementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'achievement']
    ordering = ['-earned_date']

    def get_queryset(self):
        return CustomerAchievement.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CustomerAchievementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a customer achievement"""
    serializer_class = CustomerAchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerAchievement.objects.filter(user=self.request.user)


class CustomerLevelListCreateView(generics.ListCreateAPIView):
    """List all customer levels or assign a new level to a customer"""
    serializer_class = CustomerLevelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'level', 'is_current']
    ordering = ['-assigned_date']

    def get_queryset(self):
        return CustomerLevel.objects.filter(assigned_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class CustomerLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a customer level"""
    serializer_class = CustomerLevelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerLevel.objects.filter(assigned_by=self.request.user)


class DuePaymentListCreateView(generics.ListCreateAPIView):
    """List all due payments or create a new due payment"""
    serializer_class = DuePaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'payment_type', 'status']
    ordering = ['due_date']

    def get_queryset(self):
        return DuePayment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DuePaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a due payment"""
    serializer_class = DuePaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DuePayment.objects.filter(user=self.request.user)


class TransactionListCreateView(generics.ListCreateAPIView):
    """List all transactions or create a new transaction"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'transaction_type']
    ordering = ['-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a transaction"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


# API views for frontend data requirements
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_gifts(request):
    """Get all available gifts that can be assigned to customers"""
    gifts = Gift.objects.filter(is_active=True).order_by('name')
    serializer = GiftForCustomerSerializer(gifts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_achievements(request):
    """Get all available achievements that can be earned by customers"""
    achievements = Achievement.objects.filter(
        is_active=True).order_by('name')
    serializer = AchievementForCustomerSerializer(achievements, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_levels(request):
    """Get all available levels that can be assigned to customers"""
    levels = Level.objects.filter(is_active=True).order_by('name')
    serializer = LevelForCustomerSerializer(levels, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def redeem_gift(request, gift_id):
    """Redeem a customer gift"""
    try:
        gift = CustomerGift.objects.get(
            id=gift_id,
            user=request.user,
            status='active'
        )
        gift.status = 'used'
        gift.used_date = timezone.now()
        gift.save()

        serializer = CustomerGiftSerializer(gift)
        return Response({
            'success': True,
            'message': 'Gift redeemed successfully',
            'gift': serializer.data
        })
    except CustomerGift.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Gift not found or already used'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def redeem_points(request, customer_id):
    """Redeem customer achievement points"""
    try:
        customer = Customer.objects.get(id=customer_id, user=request.user)
        amount = request.data.get('amount', 0)

        if amount <= 0:
            return Response({
                'success': False,
                'message': 'Invalid amount'
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount > customer.total_points:
            return Response({
                'success': False,
                'message': 'Insufficient points'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create a transaction for the redemption
        transaction = Transaction.objects.create(
            customer=customer,
            transaction_type='adjustment',
            amount=-amount,  # Negative for points deduction
            notes=f'Points redemption: {amount} points',
            user=request.user
        )

        return Response({
            'success': True,
            'message': f'Successfully redeemed {amount} points',
            'remaining_points': customer.total_points - amount
        })

    except Customer.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Customer not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_sms(request, customer_id):
    """Send SMS to customer"""
    try:
        customer = Customer.objects.get(id=customer_id, user=request.user)
        message = request.data.get('message', '')

        if not message:
            return Response({
                'success': False,
                'message': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create SMS log
        sms_log = SMSLog.objects.create(
            customer=customer,
            message=message,
            phone_number=customer.phone,
            user=request.user
        )

        # Here you would integrate with an actual SMS service
        # For now, we'll simulate it
        try:
            # Simulate SMS sending
            sms_log.status = 'sent'
            sms_log.sent_at = timezone.now()
            sms_log.sms_service_response = 'SMS sent successfully (simulated)'
            sms_log.save()

            return Response({
                'success': True,
                'message': 'SMS sent successfully'
            })
        except Exception as e:
            sms_log.status = 'failed'
            sms_log.sms_service_response = str(e)
            sms_log.save()

            return Response({
                'success': False,
                'message': 'Failed to send SMS'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Customer.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Customer not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_statistics(request):
    """Get customer statistics for dashboard"""
    user = request.user

    # Basic statistics
    total_customers = Customer.objects.filter(user=user).count()
    active_customers = Customer.objects.filter(
        user=user, status='active').count()
    total_orders = Order.objects.filter(user=user).count()

    # Revenue statistics
    revenue_stats = Order.objects.filter(
        user=user,
        status='completed'
    ).aggregate(
        total_revenue=Sum('total_amount'),
        average_order_value=Avg('total_amount')
    )

    # Top customers by spending
    top_customers = Customer.objects.filter(user=user).annotate(
        total_spent_calc=Sum('orders__total_amount')
    ).order_by('-total_spent_calc')[:5]

    stats_data = {
        'total_customers': total_customers,
        'active_customers': active_customers,
        'total_orders': total_orders,
        'total_revenue': revenue_stats['total_revenue'] or 0,
        'average_order_value': revenue_stats['average_order_value'] or 0,
        'top_customers': CustomerSerializer(top_customers, many=True).data
    }

    serializer = CustomerStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_summary(request, customer_id):
    """Get a summary of customer data for the detail page"""
    try:
        customer = Customer.objects.get(id=customer_id, user=request.user)

        # Get recent orders
        recent_orders = customer.orders.order_by('-created_at')[:10]

        # Get active gifts
        active_gifts = customer.customer_gifts.filter(status='active')

        # Get achievements
        achievements = customer.customer_achievements.all()

        # Get due payments
        due_payments = customer.due_payments.filter(status='pending')

        # Calculate due amounts
        total_due = due_payments.filter(payment_type='due').aggregate(
            total=Sum('amount')
        )['total'] or 0

        total_advance = due_payments.filter(payment_type='advance').aggregate(
            total=Sum('amount')
        )['total'] or 0

        data = {
            'customer': CustomerDetailSerializer(customer).data,
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
            'active_gifts': CustomerGiftSerializer(active_gifts, many=True).data,
            'achievements': CustomerAchievementSerializer(achievements, many=True).data,
            'due_payments': DuePaymentSerializer(due_payments, many=True).data,
            'financial_summary': {
                'total_due': total_due,
                'total_advance': abs(total_advance),
                'net_amount': total_due - abs(total_advance)
            }
        }

        return Response(data)

    except Customer.DoesNotExist:
        return Response({
            'error': 'Customer not found'
        }, status=status.HTTP_404_NOT_FOUND)
