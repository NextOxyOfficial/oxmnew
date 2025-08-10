from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import Order
from .serializers import (
    OrderCreateSerializer,
    OrderItemUpdateSerializer,
    OrderSerializer,
    OrderUpdateSerializer,
)


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
        elif self.action in ["update", "partial_update"]:
            return OrderUpdateSerializer
        return OrderSerializer

    def get_queryset(self):
        """Filter orders by user with optimized queries and custom filters"""
        from datetime import datetime, timedelta

        from django.utils import timezone

        queryset = (
            Order.objects.filter(user=self.request.user)
            .select_related("customer")
            .prefetch_related("items__product", "items__variant", "payments")
            .order_by("-created_at")
        )

        # Handle date filtering
        date_filter = self.request.query_params.get("date_filter", None)
        start_date = self.request.query_params.get("start_date", None)
        end_date = self.request.query_params.get("end_date", None)

        if date_filter:
            now = timezone.now()
            today = now.date()

            if date_filter == "today":
                start_datetime = timezone.make_aware(
                    datetime.combine(today, datetime.min.time())
                )
                end_datetime = timezone.make_aware(
                    datetime.combine(today, datetime.max.time())
                )
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

            elif date_filter == "yesterday":
                yesterday = today - timedelta(days=1)
                start_datetime = timezone.make_aware(
                    datetime.combine(yesterday, datetime.min.time())
                )
                end_datetime = timezone.make_aware(
                    datetime.combine(yesterday, datetime.max.time())
                )
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

            elif date_filter == "this_week":
                week_start = today - timedelta(days=today.weekday())
                start_datetime = timezone.make_aware(
                    datetime.combine(week_start, datetime.min.time())
                )
                end_datetime = now
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

            elif date_filter == "last_week":
                week_start = today - timedelta(days=today.weekday() + 7)
                week_end = week_start + timedelta(days=6)
                start_datetime = timezone.make_aware(
                    datetime.combine(week_start, datetime.min.time())
                )
                end_datetime = timezone.make_aware(
                    datetime.combine(week_end, datetime.max.time())
                )
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

            elif date_filter == "this_month":
                month_start = today.replace(day=1)
                start_datetime = timezone.make_aware(
                    datetime.combine(month_start, datetime.min.time())
                )
                end_datetime = now
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

            elif date_filter == "last_month":
                if today.month == 1:
                    last_month_start = today.replace(
                        year=today.year - 1, month=12, day=1
                    )
                else:
                    last_month_start = today.replace(month=today.month - 1, day=1)

                # Get last day of last month
                if today.month == 1:
                    last_month_end = today.replace(
                        year=today.year - 1, month=12, day=31
                    )
                else:
                    import calendar

                    last_month = today.month - 1
                    last_day = calendar.monthrange(today.year, last_month)[1]
                    last_month_end = today.replace(month=last_month, day=last_day)

                start_datetime = timezone.make_aware(
                    datetime.combine(last_month_start, datetime.min.time())
                )
                end_datetime = timezone.make_aware(
                    datetime.combine(last_month_end, datetime.max.time())
                )
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )

        # Handle custom date range
        elif start_date and end_date:
            try:
                start_datetime = timezone.make_aware(
                    datetime.strptime(start_date, "%Y-%m-%d")
                )
                end_datetime = timezone.make_aware(
                    datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
                )
                queryset = queryset.filter(
                    created_at__range=[start_datetime, end_datetime]
                )
            except ValueError:
                pass  # Invalid date format, ignore filter

        # Handle custom customer filter parameter
        customer_filter = self.request.query_params.get("customer", None)
        if customer_filter == "with_customer":
            queryset = queryset.filter(customer__isnull=False)
        elif customer_filter == "without_customer":
            queryset = queryset.filter(customer__isnull=True)
        elif customer_filter and customer_filter.isdigit():
            # Filter by specific customer ID
            queryset = queryset.filter(customer=int(customer_filter))

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
        """
        Create a new order with items.

        For new orders, buy_price is captured from the current product/variant
        buy_price at the time of creation. This ensures that:
        1. New invoices use the current market buy price
        2. Historical invoices maintain their original buy prices
        """
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

    @action(detail=True, methods=["patch"], url_path="items/(?P<item_id>[^/.]+)")
    def update_item(self, request, pk=None, item_id=None):
        """
        Update a specific order item.

        IMPORTANT: This method only allows updating quantity and unit_price.
        The buy_price is intentionally excluded to preserve historical pricing.
        Buy prices are locked at the time of order creation and cannot be modified
        for existing invoices, ensuring price consistency for completed transactions.
        """
        order = self.get_object()

        try:
            item = order.items.get(id=item_id)
        except order.items.model.DoesNotExist:
            return Response(
                {"error": "Order item not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderItemUpdateSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Return updated order with all items
            order_serializer = OrderSerializer(order, context={"request": request})
            return Response(order_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        """
        Add a new item to an existing order.
        """
        order = self.get_object()

        # Prevent adding items to completed or cancelled orders
        if order.status in ["completed", "cancelled"]:
            return Response(
                {"error": f"Cannot add items to {order.status} orders"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the item data with the order reference
        item_data = request.data.copy()
        item_data["order"] = order.id

        from .serializers import OrderItemCreateSerializer

        serializer = OrderItemCreateSerializer(
            data=item_data, context={"request": request}
        )

        if serializer.is_valid():
            # Check stock availability before creating the item
            from products.models import Product

            product_id = item_data.get("product")
            variant_id = item_data.get("variant")
            quantity = int(item_data.get("quantity", 0))

            try:
                product = Product.objects.get(id=product_id, user=request.user)

                # Check stock
                if product.has_variants and variant_id:
                    variant = product.variants.get(id=variant_id)
                    if variant.stock < quantity:
                        return Response(
                            {
                                "error": f"Insufficient stock. Available: {variant.stock}, Requested: {quantity}"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    if product.stock < quantity:
                        return Response(
                            {
                                "error": f"Insufficient stock. Available: {product.stock}, Requested: {quantity}"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                # Create the item
                item = serializer.save()

                # Update stock
                if product.has_variants and variant_id:
                    variant.stock -= quantity
                    variant.save()
                else:
                    product.stock -= quantity
                    product.save()

                # Return updated order with all items
                order_serializer = OrderSerializer(order, context={"request": request})
                return Response(order_serializer.data, status=status.HTTP_201_CREATED)

            except Product.DoesNotExist:
                return Response(
                    {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["delete"], url_path="items/(?P<item_id>[^/.]+)")
    def remove_item(self, request, pk=None, item_id=None):
        """
        Remove an item from an existing order.
        """
        order = self.get_object()

        # Prevent removing items from completed or cancelled orders
        if order.status in ["completed", "cancelled"]:
            return Response(
                {"error": f"Cannot remove items from {order.status} orders"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item = order.items.get(id=item_id)

            # Restore stock before deleting
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
                item.product.stock += item.quantity
                item.product.save()

            # Delete the item
            item.delete()

            # Return updated order with all items
            order_serializer = OrderSerializer(order, context={"request": request})
            return Response(order_serializer.data)

        except order.items.model.DoesNotExist:
            return Response(
                {"error": "Order item not found"}, status=status.HTTP_404_NOT_FOUND
            )
