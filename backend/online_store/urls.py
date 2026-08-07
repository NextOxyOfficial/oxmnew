from django.urls import path
from . import views

urlpatterns = [
    # Online products
    path('products/', views.OnlineProductListCreateView.as_view(), name='online-products-list'),
    path('products/<int:pk>/', views.OnlineProductDetailView.as_view(), name='online-product-detail'),
    path('products/toggle/<int:product_id>/', views.toggle_product_publication, name='toggle-product-publication'),
    
    # Orders
    path('orders/', views.OnlineOrderListView.as_view(), name='online-orders-list'),
    path('orders/<int:pk>/', views.OnlineOrderDetailView.as_view(), name='online-order-detail'),
    path('orders/create/<str:domain>/', views.create_public_order, name='create-public-order'),
    
    # Store settings
    path('settings/', views.StoreSettingsView.as_view(), name='store-settings'),
    # One route each, handling GET (read) and POST (save). Registering the
    # same path twice made the POST view unreachable.
    path('terms/', views.store_terms, name='store-terms'),
    path('privacy/', views.store_privacy, name='store-privacy'),
]
