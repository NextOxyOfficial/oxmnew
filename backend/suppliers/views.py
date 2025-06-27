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


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return suppliers for the current user only"""
        return Supplier.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return SupplierCreateSerializer
        return SupplierSerializer

    def perform_create(self, serializer):
        """Assign the current user to the supplier when creating"""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a deactivated supplier"""
        supplier = get_object_or_404(Supplier, pk=pk, user=request.user)
        supplier.is_active = True
        supplier.save()
        serializer = self.get_serializer(supplier)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a supplier"""
        supplier = get_object_or_404(Supplier, pk=pk, user=request.user)
        supplier.is_active = False
        supplier.save()
        serializer = self.get_serializer(supplier)
        return Response(serializer.data)


class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return purchases for the current user only"""
        queryset = Purchase.objects.filter(user=self.request.user, is_active=True)
        
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
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return payments for the current user only"""
        queryset = Payment.objects.filter(user=self.request.user, is_active=True)
        
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
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actually deleting"""
        instance.is_active = False
        instance.save()
