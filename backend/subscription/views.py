# subscription/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
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
        # Get or create user subscription (only one per user)
        user_subscription, created = UserSubscription.objects.get_or_create(
            user=self.request.user,
            defaults={
                'plan': SubscriptionPlan.objects.get(name='free'),
                'active': True
            }
        )
        return user_subscription

class UserSMSCreditView(generics.RetrieveAPIView):
    serializer_class = UserSMSCreditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Get or create user SMS credit record
        user_sms_credit, created = UserSMSCredit.objects.get_or_create(
            user=self.request.user,
            defaults={'credits': 0}
        )
        return user_sms_credit

class SMSSentHistoryListView(generics.ListAPIView):
    serializer_class = SMSSentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SMSSentHistory.objects.filter(user=self.request.user).order_by('-sent_at')
    
    def list(self, request, *args, **kwargs):
        # Get page number from query params, default to 1
        page = int(request.GET.get('page', 1))
        page_size = 10  # 10 results per page
        
        queryset = self.get_queryset()
        total_count = queryset.count()
        
        # Calculate pagination
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        # Get paginated results
        paginated_queryset = queryset[start_index:end_index]
        serializer = self.get_serializer(paginated_queryset, many=True)
        
        # Calculate total pages
        total_pages = (total_count + page_size - 1) // page_size
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'current_page': page,
            'total_pages': total_pages,
            'page_size': page_size,
            'has_next': page < total_pages,
            'has_previous': page > 1
        })

# Add credits endpoint for admin use only
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_sms_credits(request):
    """Get current user's SMS credits count"""
    try:
        user_sms_credit = UserSMSCredit.objects.get(user=request.user)
        return Response({'credits': user_sms_credit.credits}, status=status.HTTP_200_OK)
    except UserSMSCredit.DoesNotExist:
        # Create a new record with 0 credits if it doesn't exist
        user_sms_credit = UserSMSCredit.objects.create(user=request.user, credits=0)
        return Response({'credits': 0}, status=status.HTTP_200_OK)

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
        # Get the plan (case-insensitive lookup)
        plan = SubscriptionPlan.objects.get(name__iexact=plan_id)
        
        # Get or create user subscription (only one subscription per user)
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
            'message': f'Successfully upgraded to {plan.name} plan',
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
        # Get or create user subscription (only one per user)
        user_subscription, created = UserSubscription.objects.get_or_create(
            user=request.user,
            defaults={
                'plan': SubscriptionPlan.objects.get(name='free'),
                'active': True
            }
        )
        
        serializer = UserSubscriptionSerializer(user_subscription)
        return Response({
            'success': True,
            'subscription': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_auth(request):
    """Debug endpoint to check authentication"""
    return Response({
        'authenticated': request.user.is_authenticated,
        'user': request.user.username if request.user.is_authenticated else None,
        'token_header': request.META.get('HTTP_AUTHORIZATION', 'Not found'),
        'success': True
    })
