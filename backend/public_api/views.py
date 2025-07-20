import time

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from products.models import Product
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .authentication import PublicAPIKeyAuthentication, RateLimitMixin
from .models import APIKeyUsageLog, PublicAPIKey
from .serializers import (
    APIKeyUsageLogSerializer,
    PublicAPIKeySerializer,
    PublicProductSerializer,
)


class PublicProductListView(RateLimitMixin, generics.ListAPIView):
    """
    Public API endpoint to list products for a user using their API key
    """

    serializer_class = PublicProductSerializer
    authentication_classes = [PublicAPIKeyAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category__name", "has_variants", "is_active"]

    def get_queryset(self):
        """
        Return products for the authenticated user (via API key)
        """
        return (
            Product.objects.filter(user=self.request.user, is_active=True)
            .select_related("category", "supplier")
            .prefetch_related("photos", "variants")
        )

    def list(self, request, *args, **kwargs):
        """
        Override list method to add rate limiting and logging
        """
        start_time = time.time()

        # Get the API key object from the auth tuple
        api_key_obj = request.auth

        try:
            # Check rate limit
            self.check_rate_limit(api_key_obj, request)

            # Get the response
            response = super().list(request, *args, **kwargs)

            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)

            # Log the usage
            self.log_api_usage(
                request, api_key_obj, response.status_code, response_time_ms
            )

            return response

        except Exception:
            # Log the error
            response_time_ms = int((time.time() - start_time) * 1000)
            self.log_api_usage(request, api_key_obj, 500, response_time_ms)
            raise


class PublicProductDetailView(RateLimitMixin, generics.RetrieveAPIView):
    """
    Public API endpoint to get a specific product using API key
    """

    serializer_class = PublicProductSerializer
    authentication_classes = [PublicAPIKeyAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        """
        Return products for the authenticated user (via API key)
        """
        return (
            Product.objects.filter(user=self.request.user, is_active=True)
            .select_related("category", "supplier")
            .prefetch_related("photos", "variants")
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve method to add rate limiting and logging
        """
        start_time = time.time()

        # Get the API key object from the auth tuple
        api_key_obj = request.auth

        try:
            # Check rate limit
            self.check_rate_limit(api_key_obj, request)

            # Get the response
            response = super().retrieve(request, *args, **kwargs)

            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)

            # Log the usage
            self.log_api_usage(
                request, api_key_obj, response.status_code, response_time_ms
            )

            return response

        except Exception:
            # Log the error
            response_time_ms = int((time.time() - start_time) * 1000)
            self.log_api_usage(request, api_key_obj, 500, response_time_ms)
            raise


# Management views for authenticated users to manage their API keys
class APIKeyListCreateView(generics.ListCreateAPIView):
    """
    Authenticated endpoint for users to view and create their API keys
    """

    serializer_class = PublicAPIKeySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PublicAPIKey.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Only allow one API key per user
        if PublicAPIKey.objects.filter(user=self.request.user).exists():
            return Response(
                {
                    "error": "You already have an API key. Please regenerate it if needed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save(user=self.request.user)


class APIKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Authenticated endpoint for users to manage their specific API key
    """

    serializer_class = PublicAPIKeySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PublicAPIKey.objects.filter(user=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_api_key(request):
    """
    Regenerate the user's API key
    """
    try:
        api_key_obj = PublicAPIKey.objects.get(user=request.user)
        new_key = api_key_obj.regenerate_key()

        return Response(
            {
                "message": "API key regenerated successfully",
                "new_key": new_key,
                "regenerated_at": api_key_obj.updated_at,
            }
        )

    except PublicAPIKey.DoesNotExist:
        return Response(
            {"error": "No API key found. Please create one first."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_key_usage_stats(request):
    """
    Get usage statistics for the user's API key
    """
    try:
        api_key_obj = PublicAPIKey.objects.get(user=request.user)

        # Get usage logs from the last 30 days
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        usage_logs = APIKeyUsageLog.objects.filter(
            api_key=api_key_obj, timestamp__gte=thirty_days_ago
        )

        # Calculate stats
        total_requests = usage_logs.count()
        successful_requests = usage_logs.filter(response_status__lt=400).count()
        failed_requests = usage_logs.filter(response_status__gte=400).count()

        # Get daily usage for the last 7 days
        seven_days_ago = timezone.now() - timezone.timedelta(days=7)
        daily_usage = []

        for i in range(7):
            date = seven_days_ago.date() + timezone.timedelta(days=i)
            count = usage_logs.filter(timestamp__date=date).count()
            daily_usage.append({"date": date, "requests": count})

        return Response(
            {
                "api_key": api_key_obj.key[:8] + "...",
                "is_active": api_key_obj.is_active,
                "created_at": api_key_obj.created_at,
                "last_used": api_key_obj.last_used,
                "rate_limits": {
                    "requests_per_hour": api_key_obj.requests_per_hour,
                    "requests_per_day": api_key_obj.requests_per_day,
                },
                "stats_last_30_days": {
                    "total_requests": total_requests,
                    "successful_requests": successful_requests,
                    "failed_requests": failed_requests,
                    "success_rate": round(
                        (successful_requests / total_requests * 100), 2
                    )
                    if total_requests > 0
                    else 0,
                },
                "daily_usage_last_7_days": daily_usage,
            }
        )

    except PublicAPIKey.DoesNotExist:
        return Response(
            {"error": "No API key found. Please create one first."},
            status=status.HTTP_404_NOT_FOUND,
        )


class APIUsageLogListView(generics.ListAPIView):
    """
    Authenticated endpoint for users to view their API usage logs
    """

    serializer_class = APIKeyUsageLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            api_key_obj = PublicAPIKey.objects.get(user=self.request.user)
            return APIKeyUsageLog.objects.filter(api_key=api_key_obj).order_by(
                "-timestamp"
            )
        except PublicAPIKey.DoesNotExist:
            return APIKeyUsageLog.objects.none()
