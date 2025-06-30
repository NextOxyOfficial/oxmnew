from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'accounts', views.BankAccountViewSet, basename='bankaccount')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')

urlpatterns = [
    path('banking/', include(router.urls)),
]
