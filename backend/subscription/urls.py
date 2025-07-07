# subscription/urls.py
from django.urls import path
from . import views
from .pay import makePayment, verifyPayment

urlpatterns = [
    path("plans/", views.SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("sms-packages/", views.SMSPackageListView.as_view(), name="sms-packages"),
    path(
        "my-subscription/", views.UserSubscriptionView.as_view(), name="my-subscription"
    ),
    path("my-sms-credits/", views.UserSMSCreditView.as_view(), name="my-sms-credits"),
    path(
        "my-sms-history/", views.SMSSentHistoryListView.as_view(), name="my-sms-history"
    ),
    path("add-sms-credits/", views.add_sms_credits, name="add-sms-credits"),
    path("subscription/upgrade/", views.upgrade_subscription, name="upgrade-subscription"),
    path("purchase-sms-package/", views.purchase_sms_package, name="purchase-sms-package"),
    path("get-my-subscription/", views.get_my_subscription, name="get-my-subscription"),
    path("pay/", makePayment, name="make-payment"),
    path("verify-payment/", verifyPayment, name="verify-payment"),
]
