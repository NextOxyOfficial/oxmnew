from django.urls import path
from . import views

app_name = "customers"

urlpatterns = [
    # Customer URLs
    path(
        "customers/",
        views.CustomerListCreateView.as_view(),
        name="customer-list-create",
    ),
    path(
        "customers/<int:pk>/",
        views.CustomerDetailView.as_view(),
        name="customer-detail",
    ),
    path(
        "customers/<int:customer_id>/summary/",
        views.customer_summary,
        name="customer-summary",
    ),
    path(
        "customers/statistics/", views.customer_statistics, name="customer-statistics"
    ),
    # Customer Gift URLs
    path(
        "customer-gifts/",
        views.CustomerGiftListCreateView.as_view(),
        name="customer-gift-list-create",
    ),
    path(
        "customer-gifts/<int:pk>/",
        views.CustomerGiftDetailView.as_view(),
        name="customer-gift-detail",
    ),
    path("customer-gifts/<int:gift_id>/redeem/", views.redeem_gift, name="redeem-gift"),
    # Customer Achievement URLs
    path(
        "customer-achievements/",
        views.CustomerAchievementListCreateView.as_view(),
        name="customer-achievement-list-create",
    ),
    path(
        "customer-achievements/<int:pk>/",
        views.CustomerAchievementDetailView.as_view(),
        name="customer-achievement-detail",
    ),
    # Customer Level URLs
    path(
        "customer-levels/",
        views.CustomerLevelListCreateView.as_view(),
        name="customer-level-list-create",
    ),
    path(
        "customer-levels/<int:pk>/",
        views.CustomerLevelDetailView.as_view(),
        name="customer-level-detail",
    ),
    # Due Payment URLs
    path(
        "due-payments/",
        views.DuePaymentListCreateView.as_view(),
        name="due-payment-list-create",
    ),
    path(
        "due-payments/<int:pk>/",
        views.DuePaymentDetailView.as_view(),
        name="due-payment-detail",
    ),
    # Transaction URLs
    path(
        "transactions/",
        views.TransactionListCreateView.as_view(),
        name="transaction-list-create",
    ),
    path(
        "transactions/<int:pk>/",
        views.TransactionDetailView.as_view(),
        name="transaction-detail",
    ),
    # Available data for frontend
    path("available-gifts/", views.available_gifts, name="available-gifts"),
    path(
        "available-achievements/",
        views.available_achievements,
        name="available-achievements",
    ),
    path("available-levels/", views.available_levels, name="available-levels"),
    # Actions
    path(
        "customers/<int:customer_id>/redeem-points/",
        views.redeem_points,
        name="redeem-points",
    ),
    path("customers/<int:customer_id>/send-sms/", views.send_sms, name="send-sms"),
    # Duebook
    path("duebook/customers/", views.duebook_customers, name="duebook-customers"),
]
