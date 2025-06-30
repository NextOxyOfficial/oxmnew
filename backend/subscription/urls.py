# subscription/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('sms-packages/', views.SMSPackageListView.as_view(), name='sms-packages'),
    path('my-subscription/', views.UserSubscriptionView.as_view(), name='my-subscription'),
    path('my-sms-credits/', views.UserSMSCreditView.as_view(), name='my-sms-credits'),
    path('my-sms-history/', views.SMSSentHistoryListView.as_view(), name='my-sms-history'),
]
