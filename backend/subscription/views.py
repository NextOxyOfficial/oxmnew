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
        try:
            return UserSubscription.objects.get(user=self.request.user, active=True)
        except UserSubscription.DoesNotExist:
            # Create a default free subscription if none exists
            free_plan = SubscriptionPlan.objects.get(name='free')
            return UserSubscription.objects.create(
                user=self.request.user,
                plan=free_plan,
                active=True
            )

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

# Add credits endpoint for admin use only
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser

@api_view(['POST'])
@permission_classes([IsAdminUser])  # Only admin users can add credits
def add_sms_credits(request):
    """Add SMS credits to user account - ADMIN ONLY"""
    user_id = request.data.get('user_id')
    credits_to_add = request.data.get('credits', 0)
    
    if not user_id:
        return Response({
            'success': False,
            'message': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not isinstance(credits_to_add, int) or credits_to_add <= 0:
        return Response({
            'success': False,
            'message': 'Credits must be a positive integer'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)
        
        user_sms_credit, created = UserSMSCredit.objects.get_or_create(
            user=user,
            defaults={'credits': 0}
        )
        user_sms_credit.credits += credits_to_add
        user_sms_credit.save()
        
        return Response({
            'success': True,
            'message': f'Successfully added {credits_to_add} SMS credits to user {user.username}',
            'total_credits': user_sms_credit.credits
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upgrade_subscription(request):
    """Upgrade user subscription plan"""
    plan_id = request.data.get('plan_id')
    
    if not plan_id:
        return Response({
            'success': False,
            'message': 'Plan ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get the plan
        plan = SubscriptionPlan.objects.get(name=plan_id)
        
        # Get or create user subscription
        user_subscription, created = UserSubscription.objects.get_or_create(
            user=request.user,
            defaults={
                'plan': plan,
                'active': True
            }
        )
        
        if not created:
            # Update existing subscription
            user_subscription.plan = plan
            user_subscription.active = True
            user_subscription.save()
        
        return Response({
            'success': True,
            'message': f'Successfully upgraded to {plan.get_name_display()} plan',
            'plan': plan.name
        }, status=status.HTTP_200_OK)
        
    except SubscriptionPlan.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Plan not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def purchase_sms_package(request):
    """Purchase SMS package and add credits to user account"""
    package_id = request.data.get('package_id')
    
    if not package_id:
        return Response({
            'success': False,
            'message': 'Package ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get the SMS package
        sms_package = SMSPackage.objects.get(id=package_id)
        
        # Get or create user SMS credits
        user_sms_credit, created = UserSMSCredit.objects.get_or_create(
            user=request.user,
            defaults={'credits': 0}
        )
        
        # Add credits from the package
        user_sms_credit.credits += sms_package.sms_count
        user_sms_credit.save()
        
        return Response({
            'success': True,
            'message': f'Successfully purchased {sms_package.sms_count} SMS credits',
            'credits_added': sms_package.sms_count,
            'total_credits': user_sms_credit.credits
        }, status=status.HTTP_200_OK)
        
    except SMSPackage.DoesNotExist:
        return Response({
            'success': False,
            'message': 'SMS package not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_subscription(request):
    """Get current user's subscription"""
    try:
        user_subscription = UserSubscription.objects.filter(
            user=request.user,
            active=True
        ).first()
        
        if user_subscription:
            serializer = UserSubscriptionSerializer(user_subscription)
            return Response({
                'success': True,
                'subscription': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # User has no subscription, default to free plan
            try:
                free_plan = SubscriptionPlan.objects.get(name='free')
                return Response({
                    'success': True,
                    'subscription': {
                        'plan': {
                            'name': 'free',
                            'price': 0,
                            'description': free_plan.description
                        },
                        'active': True
                    }
                }, status=status.HTTP_200_OK)
            except SubscriptionPlan.DoesNotExist:
                return Response({
                    'success': True,
                    'subscription': {
                        'plan': {
                            'name': 'free',
                            'price': 0,
                            'description': 'Free plan'
                        },
                        'active': True
                    }
                }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
