from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/', include('suppliers.urls')),
    path('api/', include('products.urls')),
    path('api/', include('customers.urls')),
    path('api/', include('employees.urls')),
    path('api/', include('banking.urls')),
    path('api/', include('subscription.urls')),  # Added subscription app endpoints
    path('api/online-store/', include('online_store.urls')),  # Added online store app endpoints
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
