from django.core.cache import cache
from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import APIKeyUsageLog, PublicAPIKey


class PublicAPIKeyAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for public API keys
    """

    keyword = "Bearer"

    def authenticate(self, request):
        """
        Authenticate the request using a public API key
        """
        auth = authentication.get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) == 1:
            msg = "Invalid API key header. No credentials provided."
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = "Invalid API key header. API key string should not contain spaces."
            raise exceptions.AuthenticationFailed(msg)

        try:
            api_key = auth[1].decode()
        except UnicodeError:
            msg = "Invalid API key header. API key string should not contain invalid characters."
            raise exceptions.AuthenticationFailed(msg)

        return self.authenticate_credentials(api_key)

    def authenticate_credentials(self, key):
        """
        Authenticate the API key
        """
        try:
            api_key_obj = PublicAPIKey.objects.select_related("user").get(
                key=key, is_active=True
            )
        except PublicAPIKey.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or inactive API key.")

        # Update last used timestamp
        api_key_obj.last_used = timezone.now()
        api_key_obj.save(update_fields=["last_used"])

        return (api_key_obj.user, api_key_obj)

    def authenticate_header(self, request):
        """
        Return the authentication header
        """
        return self.keyword


class RateLimitMixin:
    """
    Mixin to add rate limiting functionality to API views
    """

    def check_rate_limit(self, api_key_obj, request):
        """
        Check if the API key has exceeded rate limits
        """
        now = timezone.now()
        user_id = api_key_obj.user.id

        # Check hourly rate limit
        hourly_key = f"api_rate_limit_hourly_{user_id}_{now.hour}"
        hourly_count = cache.get(hourly_key, 0)

        if hourly_count >= api_key_obj.requests_per_hour:
            raise exceptions.Throttled(
                detail=f"Rate limit exceeded. Maximum {api_key_obj.requests_per_hour} requests per hour."
            )

        # Check daily rate limit
        daily_key = f"api_rate_limit_daily_{user_id}_{now.date()}"
        daily_count = cache.get(daily_key, 0)

        if daily_count >= api_key_obj.requests_per_day:
            raise exceptions.Throttled(
                detail=f"Rate limit exceeded. Maximum {api_key_obj.requests_per_day} requests per day."
            )

        # Increment counters
        cache.set(hourly_key, hourly_count + 1, timeout=3600)  # 1 hour
        cache.set(daily_key, daily_count + 1, timeout=86400)  # 24 hours

    def log_api_usage(
        self, request, api_key_obj, response_status, response_time_ms=None
    ):
        """
        Log API key usage
        """
        try:
            # Get client IP
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0]
            else:
                ip_address = request.META.get("REMOTE_ADDR", "")

            # Log the usage
            APIKeyUsageLog.objects.create(
                api_key=api_key_obj,
                endpoint=request.path,
                ip_address=ip_address,
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                response_status=response_status,
                response_time_ms=response_time_ms,
            )
        except Exception:
            # Don't let logging errors break the API
            pass
