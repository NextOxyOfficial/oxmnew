from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import TokenAuthentication


class CSRFExemptTokenAuthentication(TokenAuthentication):
    """
    Token authentication that exempts views from CSRF protection.
    This is suitable for API endpoints that use token authentication.
    """
    
    def authenticate(self, request):
        # First, try to authenticate with token
        result = super().authenticate(request)
        if result:
            # If token authentication succeeded, mark the view as CSRF exempt
            if hasattr(request, '_dont_enforce_csrf_checks'):
                request._dont_enforce_csrf_checks = True
        return result
