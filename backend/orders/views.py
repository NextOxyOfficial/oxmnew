from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order model with backward compatibility for ProductSale API"""

    serializer_class = OrderSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        """Filter orders by user with optimized queries"""
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("customer")
            .prefetch_related("items__product", "items__variant", "payments")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        """Create a new order with items"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Return with read serializer
        read_serializer = OrderSerializer(order, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def add_payment(self, request, pk=None):
        """Add a payment to an order"""
        order = self.get_object()
        amount = request.data.get("amount", 0)
        payment_method = request.data.get("payment_method", "cash")
        payment_reference = request.data.get("payment_reference", "")
        notes = request.data.get("notes", "")

        from .models import OrderPayment

        OrderPayment.objects.create(
            order=order,
            amount=amount,
            payment_method=payment_method,
            payment_reference=payment_reference,
            notes=notes,
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
