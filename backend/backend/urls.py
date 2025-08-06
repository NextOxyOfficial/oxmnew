from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/", include("suppliers.urls")),
    path("api/", include("products.urls")),
    path("api/", include("customers.urls")),
    path("api/", include("employees.urls")),
    path("api/", include("banking.urls")),
    path("api/", include("subscription.urls")),  # Added subscription app endpoints
    path("api/", include("orders.urls")),  # Added orders app endpoints
    path(
        "api/online-store/", include("online_store.urls")
    ),  # Added online store app endpoints
    path(
        "api/public/", include("public_api.urls")
    ),  # Public API endpoints for external access
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # In production, static files are served by WhiteNoise middleware
    # Only add media files serving for production if needed
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
