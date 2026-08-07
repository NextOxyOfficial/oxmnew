from core.scoping import HasPermission, owner_for
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from customers.models import Customer
from orders.models import Order, OrderItem, OrderPayment

from .models import Vehicle, VehicleDocument
from .serializers import (
    VehicleDetailSerializer,
    VehicleDocumentSerializer,
    VehicleListSerializer,
    VehicleSellSerializer,
    VehicleWriteSerializer,
)


class VehicleViewSet(viewsets.ModelViewSet):
    """Serial-tracked vehicle units.

    Everything is scoped to request.user — a shop never sees another shop's
    stock, and that filtering happens in one place (get_queryset) so no action
    can forget it.
    """
    # Staff logins are held to these; owners are unrestricted.
    required_permissions = {
        "GET": "vehicles.view",
        "POST": "vehicles.add",
        "PUT": "vehicles.edit",
        "PATCH": "vehicles.edit",
        "DELETE": "vehicles.delete",
    }


    permission_classes = [IsAuthenticated, HasPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "vehicle_type", "condition", "product", "supplier", "customer"]
    search_fields = [
        "engine_number",
        "chassis_number",
        "registration_number",
        "color",
        "product__name",
        "customer__name",
        "customer__phone",
        "order__order_number",
    ]
    ordering_fields = ["created_at", "sold_at", "sell_price", "buy_price"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Vehicle.objects.filter(user=owner_for(self.request))
            .select_related("product", "supplier", "customer", "order")
            .annotate(document_count=Count("documents", distinct=True))
        )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return VehicleWriteSerializer
        if self.action == "retrieve":
            return VehicleDetailSerializer
        return VehicleListSerializer

    def perform_create(self, serializer):
        serializer.save(user=owner_for(self.request))

    def destroy(self, request, *args, **kwargs):
        vehicle = self.get_object()
        if vehicle.status == "sold":
            return Response(
                {"error": "বিক্রি হয়ে যাওয়া গাড়ি ডিলিট করা যায় না।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Counts for the list header — how many units, how much money."""
        qs = Vehicle.objects.filter(user=owner_for(request))
        in_stock = qs.filter(status="in_stock")
        sold = qs.filter(status="sold")
        return Response(
            {
                "total": qs.count(),
                "in_stock": in_stock.count(),
                "reserved": qs.filter(status="reserved").count(),
                "sold": sold.count(),
                "stock_value": in_stock.aggregate(v=Sum("buy_price"))["v"] or 0,
                "sold_value": sold.aggregate(v=Sum("sold_price"))["v"] or 0,
                "by_type": list(
                    qs.values("vehicle_type").annotate(count=Count("id")).order_by()
                ),
            }
        )

    @action(detail=True, methods=["post"])
    def sell(self, request, pk=None):
        """Sell this unit to a customer.

        Creates a normal Order so the sale appears in the regular sales list and
        reuses OrderPayment for its payment history — vehicles deliberately have
        no parallel invoicing of their own.
        """
        vehicle = self.get_object()

        if vehicle.status == "sold":
            return Response(
                {"error": "এই গাড়িটা আগেই বিক্রি হয়ে গেছে।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VehicleSellSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            customer = Customer.objects.get(id=data["customer"], user=owner_for(request))
        except Customer.DoesNotExist:
            return Response(
                {"error": "কাস্টমার পাওয়া যায়নি।"}, status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            order = Order.objects.create(
                user=owner_for(request),
                customer=customer,
                customer_name=customer.name,
                customer_phone=customer.phone,
                customer_email=customer.email,
                customer_address=getattr(customer, "address", None),
                status="completed",
                notes=data.get("notes") or "",
            )

            OrderItem.objects.create(
                order=order,
                product=vehicle.product,
                quantity=1,
                unit_price=data["sell_price"],
                buy_price=vehicle.buy_price,
                total_price=data["sell_price"],
                product_name=vehicle.product.name,
                variant_details=f"Chassis: {vehicle.chassis_number}",
            )

            order.calculate_totals()
            order.save()

            paid = data.get("paid_amount") or 0
            if paid > 0:
                OrderPayment.objects.create(
                    order=order,
                    user=owner_for(request),
                    method=data.get("payment_method", "cash"),
                    amount=paid,
                    reference=data.get("payment_reference") or None,
                )

            vehicle.status = "sold"
            vehicle.customer = customer
            vehicle.order = order
            vehicle.sold_price = data["sell_price"]
            vehicle.sold_at = timezone.now()
            vehicle.save()

        vehicle = self.get_queryset().get(pk=vehicle.pk)
        return Response(
            {
                "message": "গাড়িটা বিক্রি হয়ে গেছে।",
                "order_id": order.id,
                "order_number": order.order_number,
                "vehicle": VehicleDetailSerializer(
                    vehicle, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def cancel_sale(self, request, pk=None):
        """Undo a sale — puts the unit back in stock and detaches the order.

        The Order itself is left alone rather than deleted, so the sales history
        and any payments already taken stay auditable.
        """
        vehicle = self.get_object()
        if vehicle.status != "sold":
            return Response(
                {"error": "এই গাড়িটা বিক্রি হয়নি।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vehicle.status = "in_stock"
        vehicle.customer = None
        vehicle.order = None
        vehicle.sold_price = None
        vehicle.sold_at = None
        vehicle.save()
        return Response({"message": "বিক্রি বাতিল হয়েছে, গাড়িটা আবার স্টকে আছে।"})

    @action(detail=True, methods=["get", "post"], url_path="documents")
    def documents(self, request, pk=None):
        """GET lists this unit's papers; POST uploads one."""
        vehicle = self.get_object()

        if request.method == "GET":
            serializer = VehicleDocumentSerializer(
                vehicle.documents.all(), many=True, context={"request": request}
            )
            return Response(serializer.data)

        serializer = VehicleDocumentSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(vehicle=vehicle, uploaded_by=owner_for(request))
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"documents/(?P<document_id>\d+)",
    )
    def delete_document(self, request, pk=None, document_id=None):
        vehicle = self.get_object()
        try:
            document = vehicle.documents.get(id=document_id)
        except VehicleDocument.DoesNotExist:
            return Response(
                {"error": "ডকুমেন্ট পাওয়া যায়নি।"}, status=status.HTTP_404_NOT_FOUND
            )
        document.file.delete(save=False)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path=r"by-customer/(?P<customer_id>\d+)")
    def by_customer(self, request, customer_id=None):
        """Every unit this customer has bought — powers the customer profile tab."""
        vehicles = self.get_queryset().filter(customer_id=customer_id)
        serializer = VehicleDetailSerializer(
            vehicles, many=True, context={"request": request}
        )
        return Response(serializer.data)
