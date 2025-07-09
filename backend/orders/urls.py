from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"orders", views.OrderViewSet, basename="order")
# Backward compatibility: map 'sales' to orders for frontend compatibility
router.register(r"sales", views.OrderViewSet, basename="product-sale")

urlpatterns = [
    path("", include(router.urls)),
]
