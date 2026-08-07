from django.urls import path, include

from . import access_views, payroll
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
    # Role settings — who may sign in, and what they may do.
    path('roles/permissions/', access_views.permission_catalogue,
         name='role-permissions'),
    path('roles/access/', access_views.access_list, name='role-access-list'),
    path('roles/access/<int:employee_id>/', access_views.access_detail,
         name='role-access-detail'),
    # Payroll — advances, balances and who is drawing ahead.
    path('payroll/', payroll.payroll_overview, name='payroll-overview'),
    path('payroll/pay/', payroll.pay_salaries, name='payroll-pay'),
    path('payroll/payments/<int:payment_id>/', payroll.remove_payment,
         name='payroll-remove-payment'),
    path('payroll/<int:employee_id>/', payroll.employee_payroll,
         name='payroll-employee'),
]
