from core.scoping import HasPermission, owner_for
from core.uploads import document_error
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Supplier, Purchase, Payment
from .serializers import (
    SupplierSerializer, SupplierCreateSerializer, 
    PurchaseSerializer, PurchaseCreateSerializer, PurchaseUpdateSerializer,
    PaymentSerializer, PaymentCreateSerializer, PaymentUpdateSerializer
)


class ProofDocumentMixin:
    """Attach or remove the paper behind a row — an invoice, a money receipt.

    The upload is validated explicitly rather than relying on the model field's
    validators: those only run on `full_clean()`, and assigning a file then
    calling `save()` skips them, which would let any extension through.
    """

    @action(detail=True, methods=["post", "delete"], url_path="proof")
    def proof(self, request, pk=None):
        record = self.get_object()

        if request.method == "DELETE":
            if not record.proof_document:
                return Response(
                    {"error": "এই এন্ট্রিতে কোনো কাগজ নেই।"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            record.proof_document.delete(save=False)
            record.proof_document = None
            record.save(update_fields=["proof_document", "updated_at"])
            return Response(self.get_serializer(record).data)

        upload = request.FILES.get("proof_document") or request.FILES.get("file")
        if upload is None:
            return Response(
                {"error": "কোনো ফাইল পাঠানো হয়নি।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        problem = document_error(upload)
        if problem:
            return Response({"error": problem}, status=status.HTTP_400_BAD_REQUEST)

        # Replacing rather than stacking: one row, one paper. The old file is
        # removed so the media directory does not fill with orphans.
        if record.proof_document:
            record.proof_document.delete(save=False)
        record.proof_document = upload
        record.save(update_fields=["proof_document", "updated_at"])
        return Response(self.get_serializer(record).data)


class SupplierViewSet(viewsets.ModelViewSet):
    # Staff logins are held to these; owners are unrestricted.
    required_permissions = {
        "GET": "suppliers.view",
        "POST": "suppliers.manage",
        "PUT": "suppliers.manage",
        "PATCH": "suppliers.manage",
        "DELETE": "suppliers.manage",
    }

    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]

    def get_queryset(self):
        """Return suppliers for the current user only"""
        return Supplier.objects.filter(user=owner_for(self.request), is_active=True)

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return SupplierCreateSerializer
        return SupplierSerializer

    def perform_create(self, serializer):
        """Assign the current user to the supplier when creating"""
        serializer.save(user=owner_for(self.request))

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a deactivated supplier"""
        supplier = get_object_or_404(Supplier, pk=pk, user=owner_for(request))
        supplier.is_active = True
        supplier.save()
        serializer = self.get_serializer(supplier)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a supplier"""
        supplier = get_object_or_404(Supplier, pk=pk, user=owner_for(request))
        supplier.is_active = False
        supplier.save()
        serializer = self.get_serializer(supplier)
        return Response(serializer.data)


class PurchaseViewSet(ProofDocumentMixin, viewsets.ModelViewSet):
    # Staff logins are held to these; owners are unrestricted.
    required_permissions = {
        "GET": "suppliers.view",
        "POST": "suppliers.manage",
        "PUT": "suppliers.manage",
        "PATCH": "suppliers.manage",
        "DELETE": "suppliers.manage",
    }

    serializer_class = PurchaseSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]

    def get_queryset(self):
        """Return purchases for the current user only"""
        queryset = Purchase.objects.filter(user=owner_for(self.request), is_active=True)
        
        # Filter by supplier if provided
        supplier_id = self.request.query_params.get('supplier', None)
        if supplier_id and supplier_id != 'all':
            queryset = queryset.filter(supplier_id=supplier_id)
            
        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return PurchaseCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PurchaseUpdateSerializer
        return PurchaseSerializer

    def perform_create(self, serializer):
        """Assign the current user to the purchase when creating"""
        serializer.save(user=owner_for(self.request))

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        """Override destroy to handle soft deletion with proper response"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PaymentViewSet(ProofDocumentMixin, viewsets.ModelViewSet):
    # Staff logins are held to these; owners are unrestricted.
    required_permissions = {
        "GET": "suppliers.view",
        "POST": "suppliers.manage",
        "PUT": "suppliers.manage",
        "PATCH": "suppliers.manage",
        "DELETE": "suppliers.manage",
    }

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]

    def get_queryset(self):
        """Return payments for the current user only"""
        queryset = Payment.objects.filter(user=owner_for(self.request), is_active=True)
        
        # Filter by supplier if provided
        supplier_id = self.request.query_params.get('supplier', None)
        if supplier_id and supplier_id != 'all':
            queryset = queryset.filter(supplier_id=supplier_id)
            
        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PaymentUpdateSerializer
        return PaymentSerializer

    def perform_create(self, serializer):
        """Assign the current user to the payment when creating"""
        serializer.save(user=owner_for(self.request))

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        """Override destroy to handle soft deletion with proper response"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
