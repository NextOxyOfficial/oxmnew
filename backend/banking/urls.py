from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"accounts", views.BankAccountViewSet, basename="bankaccount")
router.register(r"transactions", views.TransactionViewSet, basename="transaction")

urlpatterns = [
    path("banking/", include(router.urls)),
    path("banking/plans/", views.BankingPlanListView.as_view(), name="banking-plans"),
    path(
        "banking/user-plan/",
        views.UserBankingPlanView.as_view(),
        name="user-banking-plan",
    ),
    path(
        "banking/activate-plan/",
        views.activate_banking_plan,
        name="activate-banking-plan",
    ),
]
