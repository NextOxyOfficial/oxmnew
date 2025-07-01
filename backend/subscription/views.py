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
        try:
            return UserSMSCredit.objects.get(user=self.request.user)
        except UserSMSCredit.DoesNotExist:
            # Return a dummy object with 0 credits if not found
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return UserSMSCredit(user=self.request.user, credits=0)

class SMSSentHistoryListView(generics.ListAPIView):
    serializer_class = SMSSentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SMSSentHistory.objects.filter(user=self.request.user).order_by('-sent_at')

# Add credits endpoint for testing/purchasing
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_sms_credits(request):
    """Add SMS credits to user account"""
    credits_to_add = request.data.get('credits', 0)
    
    if not isinstance(credits_to_add, int) or credits_to_add <= 0:
        return Response({
            'success': False,
            'message': 'Credits must be a positive integer'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_sms_credit, created = UserSMSCredit.objects.get_or_create(
            user=request.user,
            defaults={'credits': 0}
        )
        user_sms_credit.credits += credits_to_add
        user_sms_credit.save()
        
        return Response({
            'success': True,
            'message': f'Successfully added {credits_to_add} SMS credits',
            'total_credits': user_sms_credit.credits
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
