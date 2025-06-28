from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'sales', views.ProductSaleViewSet, basename='product-sale')
router.register(r'stock-movements',
                views.ProductStockMovementViewSet, basename='stock-movement')

urlpatterns = [
    path('', include(router.urls)),
]
