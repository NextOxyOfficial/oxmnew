from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import OnlineProduct, OnlineOrder, OnlineOrderItem, StoreSettings
from .serializers import (
    OnlineProductSerializer, OnlineOrderSerializer, StoreSettingsSerializer,
    PublicOnlineProductSerializer
)
from products.models import Product


class OnlineProductListCreateView(generics.ListCreateAPIView):
    serializer_class = OnlineProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OnlineProduct.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Create online product from existing product
        product_id = self.request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id, user=self.request.user)
        
        # Get the category name safely
        category_name = product.category.name if product.category else 'General'
        
        serializer.save(
            user=self.request.user,
            product=product,
            name=product.name,
            description=product.details or '',
            price=product.sell_price,
            category=category_name,
            image_url=product.main_photo
        )


class OnlineProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OnlineProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OnlineProduct.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_product_publication(request, product_id):
    """Toggle publication status of a product."""
    try:
        product = get_object_or_404(Product, id=product_id, user=request.user)
        
        # Check if already published
        online_product, created = OnlineProduct.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={
                'name': product.name,
                'description': product.details or '',
                'price': product.sell_price,
                'category': product.category.name if product.category else 'General',
                'image_url': product.main_photo,
                'is_published': True
            }
        )
        
        if not created:
            # Toggle publication status
            online_product.is_published = not online_product.is_published
            online_product.save()
        
        return Response({
            'success': True,
            'is_published': online_product.is_published,
            'message': f"Product {'published' if online_product.is_published else 'unpublished'} successfully"
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class OnlineOrderListView(generics.ListAPIView):
    serializer_class = OnlineOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OnlineOrder.objects.filter(user=self.request.user)


class OnlineOrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OnlineOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OnlineOrder.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_public_order(request, domain):
    """Create an order from the public store."""
    from core.models import CustomDomain
    
    try:
        # Find the store owner by domain
        custom_domain = get_object_or_404(CustomDomain, domain=domain, is_active=True)
        store_owner = custom_domain.user
        
        # Extract order data
        customer_data = request.data.get('customer', {})
        items_data = request.data.get('items', [])
        
        if not items_data:
            return Response({'error': 'No items in order'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total and create order
        total_amount = 0
        order_items = []
        
        with transaction.atomic():
            for item_data in items_data:
                online_product = get_object_or_404(
                    OnlineProduct, 
                    id=item_data['product_id'], 
                    user=store_owner,
                    is_published=True
                )
                
                quantity = int(item_data['quantity'])
                item_total = online_product.price * quantity
                total_amount += item_total
                
                order_items.append({
                    'online_product': online_product,
                    'quantity': quantity,
                    'price': online_product.price,
                    'total': item_total,
                    'product_name': online_product.name
                })
            
            # Create the order
            order = OnlineOrder.objects.create(
                user=store_owner,
                customer_name=customer_data.get('name', ''),
                customer_email=customer_data.get('email', ''),
                customer_phone=customer_data.get('phone', ''),
                customer_address=customer_data.get('address', ''),
                total_amount=total_amount,
                order_notes=request.data.get('notes', '')
            )
            
            # Create order items
            for item_data in order_items:
                OnlineOrderItem.objects.create(
                    order=order,
                    online_product=item_data['online_product'],
                    product_name=item_data['product_name'],
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                    total=item_data['total']
                )
        
        return Response({
            'success': True,
            'order_id': order.id,
            'message': 'Order created successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class StoreSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = StoreSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        settings, created = StoreSettings.objects.get_or_create(user=self.request.user)
        return settings


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_store_terms(request):
    """Get store terms and conditions."""
    settings, created = StoreSettings.objects.get_or_create(user=request.user)
    return Response({'content': settings.terms_and_conditions})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_store_terms(request):
    """Update store terms and conditions."""
    settings, created = StoreSettings.objects.get_or_create(user=request.user)
    settings.terms_and_conditions = request.data.get('content', '')
    settings.save()
    return Response({'success': True, 'message': 'Terms updated successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_store_privacy(request):
    """Get store privacy policy."""
    settings, created = StoreSettings.objects.get_or_create(user=request.user)
    return Response({'content': settings.privacy_policy})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_store_privacy(request):
    """Update store privacy policy."""
    settings, created = StoreSettings.objects.get_or_create(user=request.user)
    settings.privacy_policy = request.data.get('content', '')
    settings.save()
    return Response({'success': True, 'message': 'Privacy policy updated successfully'})
