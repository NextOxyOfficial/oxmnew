from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Avg, Count
from django.db import transaction
import json
from .models import Product, ProductVariant, ProductPhoto, ProductSale, ProductStockMovement
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, ProductCreateSerializer,
    ProductVariantSerializer, ProductPhotoSerializer, ProductSaleSerializer,
    ProductStockMovementSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier', 'has_variants', 'is_active']
    search_fields = ['name', 'details', 'location']
    ordering_fields = ['name', 'created_at',
                       'updated_at', 'buy_price', 'sell_price']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return products for the authenticated user"""
        return Product.objects.filter(user=self.request.user).select_related(
            'category', 'supplier'
        ).prefetch_related('variants', 'photos')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'create':
            return ProductCreateSerializer
        else:
            return ProductDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new product with custom handling for FormData"""
        data = request.data.copy()

        # Handle photos from FormData
        photos = []
        for key in request.FILES:
            if key.startswith('photos'):
                photos.append(request.FILES[key])

        # Handle colorSizeVariants JSON string
        if 'colorSizeVariants' in data and isinstance(data['colorSizeVariants'], str):
            try:
                data['colorSizeVariants'] = json.loads(
                    data['colorSizeVariants'])
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Invalid colorSizeVariants JSON'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Add photos to data
        if photos:
            data['photos'] = photos

        # Convert string boolean values
        if 'hasVariants' in data:
            data['hasVariants'] = data['hasVariants'] in ['true', 'True', True]

        # Convert numeric fields
        numeric_fields = ['buyPrice', 'sellPrice']
        for field in numeric_fields:
            if field in data and data[field]:
                try:
                    data[field] = float(data[field])
                except (ValueError, TypeError):
                    data[field] = 0

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            product = serializer.save()
            response_serializer = ProductDetailSerializer(
                product, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_variant(self, request, pk=None):
        """Add a new variant to an existing product"""
        product = self.get_object()

        if not product.has_variants:
            return Response(
                {'error': 'This product does not support variants'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ProductVariantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'delete'], url_path='variants/(?P<variant_id>[^/.]+)')
    def manage_variant(self, request, pk=None, variant_id=None):
        """Update or delete a specific variant"""
        product = self.get_object()

        try:
            variant = product.variants.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return Response(
                {'error': 'Variant not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'PATCH':
            serializer = ProductVariantSerializer(
                variant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def add_photos(self, request, pk=None):
        """Add photos to a product"""
        product = self.get_object()
        photos = request.FILES.getlist('photos')

        if not photos:
            return Response(
                {'error': 'No photos provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_photos = []
        for i, photo in enumerate(photos):
            # Get the current max order
            max_order = product.photos.aggregate(max_order=Sum('order'))[
                'max_order'] or 0

            photo_obj = ProductPhoto.objects.create(
                product=product,
                image=photo,
                order=max_order + i + 1
            )
            created_photos.append(photo_obj)

        serializer = ProductPhotoSerializer(created_photos, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='photos/(?P<photo_id>[^/.]+)')
    def delete_photo(self, request, pk=None, photo_id=None):
        """Delete a specific photo"""
        product = self.get_object()

        try:
            photo = product.photos.get(id=photo_id)
        except ProductPhoto.DoesNotExist:
            return Response(
                {'error': 'Photo not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Adjust product stock"""
        product = self.get_object()
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity')
        reason = request.data.get('reason', 'Manual adjustment')
        notes = request.data.get('notes', '')

        if quantity is None:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if variant_id:
                try:
                    variant = product.variants.get(id=variant_id)
                except ProductVariant.DoesNotExist:
                    return Response(
                        {'error': 'Variant not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                previous_stock = variant.stock
                new_stock = max(0, previous_stock + quantity)
                variant.stock = new_stock
                variant.save()

                # Record stock movement
                ProductStockMovement.objects.create(
                    product=product,
                    variant=variant,
                    user=request.user,
                    movement_type='adjustment',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    notes=notes
                )

                return Response({
                    'message': 'Stock adjusted successfully',
                    'previous_stock': previous_stock,
                    'new_stock': new_stock,
                    'variant_id': variant.id
                })
            else:
                previous_stock = product.stock
                new_stock = max(0, previous_stock + quantity)
                product.stock = new_stock
                product.save()

                # Record stock movement
                ProductStockMovement.objects.create(
                    product=product,
                    user=request.user,
                    movement_type='adjustment',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    notes=notes
                )

                return Response({
                    'message': 'Stock adjusted successfully',
                    'previous_stock': previous_stock,
                    'new_stock': new_stock
                })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get product statistics"""
        queryset = self.get_queryset()

        total_products = queryset.count()
        active_products = queryset.filter(is_active=True).count()
        products_with_variants = queryset.filter(has_variants=True).count()
        total_stock = sum(product.total_stock for product in queryset)

        # Calculate total inventory value
        total_value = 0
        for product in queryset:
            if product.has_variants:
                for variant in product.variants.all():
                    total_value += variant.stock * variant.buy_price
            else:
                total_value += product.stock * product.buy_price

        # Low stock products (less than 10 items)
        low_stock_products = []
        for product in queryset:
            if product.has_variants:
                for variant in product.variants.all():
                    if variant.stock < 10:
                        low_stock_products.append({
                            'product': product.name,
                            'variant': str(variant),
                            'stock': variant.stock
                        })
            else:
                if product.stock < 10:
                    low_stock_products.append({
                        'product': product.name,
                        'variant': None,
                        'stock': product.stock
                    })

        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'products_with_variants': products_with_variants,
            'total_stock': total_stock,
            'total_inventory_value': total_value,
            'low_stock_count': len(low_stock_products),
            'low_stock_products': low_stock_products[:10]  # Limit to first 10
        })


class ProductSaleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing product sales"""
    serializer_class = ProductSaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'variant']
    search_fields = ['customer_name',
                     'customer_phone', 'customer_email', 'notes']
    ordering_fields = ['sale_date', 'total_amount', 'quantity']
    ordering = ['-sale_date']

    def get_queryset(self):
        """Return sales for the authenticated user"""
        return ProductSale.objects.filter(user=self.request.user).select_related(
            'product', 'variant'
        )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get sales statistics"""
        queryset = self.get_queryset()

        total_sales = queryset.count()
        total_revenue = queryset.aggregate(
            total=Sum('total_amount'))['total'] or 0
        total_quantity = queryset.aggregate(
            total=Sum('quantity'))['total'] or 0

        # Top selling products
        top_products = queryset.values('product__name').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount')
        ).order_by('-total_quantity')[:10]

        return Response({
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_quantity_sold': total_quantity,
            'top_products': list(top_products)
        })


class ProductStockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock movements"""
    serializer_class = ProductStockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'variant', 'movement_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return stock movements for the authenticated user"""
        return ProductStockMovement.objects.filter(user=self.request.user).select_related(
            'product', 'variant', 'reference_sale'
        )
