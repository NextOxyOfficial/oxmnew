from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order model with backward compatibility for ProductSale API"""

    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        "customer_name",
        "customer_phone",
        "items__product__name",
        "order_number",
        "notes",
    ]
    ordering_fields = ["created_at", "customer_name", "total_amount"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        """Filter orders by user with optimized queries and custom filters"""
        queryset = (
            Order.objects.filter(user=self.request.user)
            .select_related("customer")
            .prefetch_related("items__product", "items__variant", "payments")
            .order_by("-created_at")
        )

        # Handle custom customer filter parameter
        customer_filter = self.request.query_params.get("customer", None)
        if customer_filter == "with_customer":
            queryset = queryset.filter(customer__isnull=False)
        elif customer_filter == "without_customer":
            queryset = queryset.filter(customer__isnull=True)

        # Handle custom ordering parameter
        ordering = self.request.query_params.get("ordering", None)
        if ordering:
            if ordering == "-sale_date":
                queryset = queryset.order_by("-created_at")
            elif ordering == "product_name":
                queryset = queryset.order_by("items__product__name")
            elif ordering == "customer_name":
                queryset = queryset.order_by("customer_name")
            elif ordering == "-total_amount":
                queryset = queryset.order_by("-total_amount")
            elif ordering == "total_amount":
                queryset = queryset.order_by("total_amount")
            elif ordering == "-quantity":
                # For quantity, we need to aggregate
                from django.db.models import Sum

                queryset = queryset.annotate(
                    total_quantity=Sum("items__quantity")
                ).order_by("-total_quantity")
            elif ordering == "quantity":
                from django.db.models import Sum

                queryset = queryset.annotate(
                    total_quantity=Sum("items__quantity")
                ).order_by("total_quantity")

        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new order with items"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Return with read serializer
        read_serializer = OrderSerializer(order, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get overall statistics for all user orders"""
        from datetime import datetime, time

        from django.db.models import Sum
        from django.utils import timezone

        # Get all user orders
        queryset = Order.objects.filter(user=request.user)

        # Basic stats
        total_orders = queryset.count()

        # Revenue and profit calculations
        revenue_data = queryset.aggregate(
            total_revenue=Sum("total_amount"), total_profit=Sum("gross_profit")
        )

        total_revenue = revenue_data["total_revenue"] or 0
        total_profit = revenue_data["total_profit"] or 0

        # Today's stats
        today = timezone.now().date()
        today_start = timezone.make_aware(datetime.combine(today, time.min))
        today_end = timezone.make_aware(datetime.combine(today, time.max))

        today_queryset = queryset.filter(created_at__range=[today_start, today_end])
        todays_orders = today_queryset.count()

        todays_data = today_queryset.aggregate(todays_revenue=Sum("total_amount"))
        todays_revenue = todays_data["todays_revenue"] or 0

        return Response(
            {
                "totalOrders": total_orders,
                "totalRevenue": float(total_revenue),
                "totalProfit": float(total_profit),
                "todaysOrders": todays_orders,
                "todaysRevenue": float(todays_revenue),
            }
        )

    @action(detail=True, methods=["post"])
    def add_payment(self, request, pk=None):
        """Add a payment to an order"""
        order = self.get_object()
        amount = request.data.get("amount", 0)
        method = request.data.get("method", "cash")
        reference = request.data.get("reference", "")
        notes = request.data.get("notes", "")

        from .models import OrderPayment

        OrderPayment.objects.create(
            order=order,
            amount=amount,
            method=method,
            reference=reference,
            notes=notes,
            user=request.user,
        )

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_completed(self, request, pk=None):
        """Mark order as completed"""
        order = self.get_object()
        order.status = "completed"
        order.save()

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel_order(self, request, pk=None):
        """Cancel an order and restore stock"""
        order = self.get_object()

        if order.status == "completed":
            return Response(
                {"error": "Cannot cancel a completed order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore stock for all items
        for item in order.items.all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
                item.product.stock += item.quantity
                item.product.save()

        order.status = "cancelled"
        order.save()

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete an order and restore stock"""
        order = self.get_object()

        # Restore stock for all items before deleting
        for item in order.items.all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
                item.product.stock += item.quantity
                item.product.save()

        # Delete the order
        return super().destroy(request, *args, **kwargs)
        return super().destroy(request, *args, **kwargs)
