from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, IncentiveViewSet, IncentiveWithdrawalViewSet, SalaryRecordViewSet,
    TaskViewSet, DocumentViewSet, PaymentInformationViewSet
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'incentives', IncentiveViewSet)
router.register(r'incentive-withdrawals', IncentiveWithdrawalViewSet)
router.register(r'salary-records', SalaryRecordViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'payment-info', PaymentInformationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
