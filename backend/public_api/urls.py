from django.urls import path

from . import views

app_name = "public_api"

urlpatterns = [
    # Public API endpoints (require API key authentication)
    path(
        "products/", views.PublicProductListView.as_view(), name="public-products-list"
    ),
    path(
        "products/<int:id>/",
        views.PublicProductDetailView.as_view(),
        name="public-product-detail",
    ),
    # Management endpoints for authenticated users
    path(
        "manage/api-keys/",
        views.APIKeyListCreateView.as_view(),
        name="api-keys-list-create",
    ),
    path(
        "manage/api-keys/<int:pk>/",
        views.APIKeyDetailView.as_view(),
        name="api-key-detail",
    ),
    path(
        "manage/api-keys/regenerate/",
        views.regenerate_api_key,
        name="regenerate-api-key",
    ),
    path(
        "manage/api-keys/usage-stats/",
        views.api_key_usage_stats,
        name="api-key-usage-stats",
    ),
    path(
        "manage/usage-logs/", views.APIUsageLogListView.as_view(), name="api-usage-logs"
    ),
]
