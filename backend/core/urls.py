from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('health/', views.health_check, name='health-check'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/profile/upload-logo/',
         views.upload_store_logo, name='upload-store-logo'),
    path('auth/profile/upload-banner/',
         views.upload_banner_image, name='upload-banner-image'),
    path('auth/profile/remove-logo/',
         views.remove_store_logo, name='remove-store-logo'),
    path('auth/profile/remove-banner/',
         views.remove_banner_image, name='remove-banner-image'),
    path('auth/settings/', views.user_settings, name='user-settings'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('auth/request-password-reset/',
         views.request_password_reset, name='request-password-reset'),
    path('categories/', views.categories, name='categories'),
    path('categories/<int:category_id>/',
         views.category_detail, name='category-detail'),
    path('categories/<int:category_id>/toggle/',
         views.toggle_category, name='toggle-category'),
    path('gifts/', views.gifts, name='gifts'),
    path('gifts/<int:gift_id>/', views.gift_detail, name='gift-detail'),
    path('gifts/<int:gift_id>/toggle/', views.toggle_gift, name='toggle-gift'),
    path('achievements/', views.achievements, name='achievements'),
    path('achievements/<int:achievement_id>/',
         views.achievement_detail, name='achievement-detail'),
    path('achievements/<int:achievement_id>/toggle/',
         views.toggle_achievement, name='toggle-achievement'),
    path('levels/', views.levels, name='levels'),
    path('levels/<int:level_id>/', views.level_detail, name='level-detail'),
    path('levels/<int:level_id>/toggle/',
         views.toggle_level, name='toggle-level'),
    path('brands/', views.brands, name='brands'),
    path('brands/<int:brand_id>/', views.brand_detail, name='brand-detail'),
    path('brands/<int:brand_id>/toggle/',
         views.toggle_brand, name='toggle-brand'),
    path('payment-methods/', views.payment_methods, name='payment-methods'),
    path('payment-methods/<int:payment_method_id>/',
         views.payment_method_detail, name='payment-method-detail'),
    path('payment-methods/<int:payment_method_id>/toggle/',
         views.toggle_payment_method, name='toggle-payment-method'),

    path('send-sms/', views.smsSend, name='sms-send'),

    # Dashboard API endpoints
    path('dashboard/stats/', api_views.dashboard_stats, name='dashboard-stats'),
    path('search/', api_views.search_global, name='search-global'),
     # Notifications endpoint removed
    
    # Custom Domain endpoints
    path('custom-domain/', views.custom_domain_view, name='custom-domain'),
    path('custom-domain/delete/', views.delete_custom_domain, name='delete-custom-domain'),
    path('custom-domain/verify/', views.verify_custom_domain, name='verify-custom-domain'),
    path('dns-records/', views.dns_records_view, name='dns-records'),
    path('dns-records/<int:record_id>/delete/', views.delete_dns_record, name='delete-dns-record'),
    
    # Public store access by domain
    path('store/<str:domain>/', views.get_store_by_domain, name='store-by-domain'),
]
