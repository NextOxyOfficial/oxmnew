from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('health/', views.health_check, name='health-check'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/profile/upload-logo/', views.upload_store_logo, name='upload-store-logo'),
    path('auth/profile/upload-banner/', views.upload_banner_image, name='upload-banner-image'),
    path('auth/profile/remove-logo/', views.remove_store_logo, name='remove-store-logo'),
    path('auth/profile/remove-banner/', views.remove_banner_image, name='remove-banner-image'),
]
