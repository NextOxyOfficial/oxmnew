# subscription/views.py
from rest_framework import generics, permissions
from .models import SubscriptionPlan, SMSPackage, UserSubscription, UserSMSCredit, SMSSentHistory
from .serializers import (
    SubscriptionPlanSerializer, SMSPackageSerializer, 
    UserSubscriptionSerializer, UserSMSCreditSerializer, SMSSentHistorySerializer
)

class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

class SMSPackageListView(generics.ListAPIView):
    queryset = SMSPackage.objects.all()
    serializer_class = SMSPackageSerializer
    permission_classes = [permissions.AllowAny]

class UserSubscriptionView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return UserSubscription.objects.get(user=self.request.user)

class UserSMSCreditView(generics.RetrieveAPIView):
    serializer_class = UserSMSCreditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return UserSMSCredit.objects.get(user=self.request.user)

class SMSSentHistoryListView(generics.ListAPIView):
    serializer_class = SMSSentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SMSSentHistory.objects.filter(user=self.request.user).order_by('-sent_at')
