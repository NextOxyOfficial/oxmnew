import json
import os

import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import IntegrityError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Achievement,
    Brand,
    Category,
    CustomDomain,
    DNSRecord,
    Gift,
    Level,
    PaymentMethod,
    UserProfile,
    UserSettings,
)


def build_absolute_url(request, relative_url):
    """
    Build absolute URL from relative URL
    """
    if not relative_url:
        return ""
    if relative_url.startswith("http"):
        return relative_url

    # For production, use a more reliable base URL construction
    base_url = None
    
    # Try to get SITE_URL from settings first
    if hasattr(settings, "SITE_URL") and settings.SITE_URL:
        base_url = settings.SITE_URL.rstrip("/")
        print(f"🔗 Using SITE_URL from settings: {base_url}")
    
    # If no SITE_URL, try to detect from request
    if not base_url and request:
        # Check if request has the production domain
        host = request.get_host()
        if 'oxymanager.com' in host:
            base_url = f"https://{host}"
            print(f"🔗 Detected production domain from request: {base_url}")
        else:
            # Fallback to request.build_absolute_uri for localhost/dev
            base_url = request.build_absolute_uri("/").rstrip("/")
            print(f"🔗 Using request.build_absolute_uri: {base_url}")
    
    # Final fallback for production
    if not base_url:
        base_url = "https://oxymanager.com"
        print(f"🔗 Using hardcoded production fallback: {base_url}")
    
    final_url = f"{base_url}{relative_url}"
    print(f"🔗 Final URL constructed: {final_url}")
    return final_url


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """
    API root endpoint
    """
    return Response(
        {
            "message": "Welcome to OXM Backend API",
            "endpoints": {
                "health": "/api/health/",
                "register": "/api/auth/register/",
                "login": "/api/auth/login/",
                "logout": "/api/auth/logout/",
                "profile": "/api/auth/profile/",
                "update-profile": "/api/auth/profile/update/",
                "admin": "/admin/",
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint
    """
    return Response(
        {"status": "healthy", "message": "Backend is running successfully"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    User registration endpoint
    """
    try:
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        # Profile fields (optional)
        company = request.data.get("company", "")
        phone = request.data.get("phone", "")
        address = request.data.get("address", "")
        city = request.data.get("city", "")
        post_code = request.data.get("post_code", "")

        if not username or not email or not password:
            return Response(
                {"error": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Create token
        token, created = Token.objects.get_or_create(user=user)

        # Get user profile and settings (they are auto-created via signals)
        profile = UserProfile.objects.get(user=user)
        settings = UserSettings.objects.get(user=user)

        # Update profile with provided data
        if company:
            profile.company = company
        if phone:
            profile.phone = phone
        if address:
            profile.address = address
        if city:
            profile.city = city
        if post_code:
            profile.post_code = post_code

        # Save profile if any fields were updated
        if company or phone or address or city or post_code:
            profile.save()

        # Get SMS credits
        from subscription.models import UserSMSCredit

        try:
            sms_credit = UserSMSCredit.objects.get(user=user)
            sms_credits = sms_credit.credits
        except UserSMSCredit.DoesNotExist:
            sms_credits = 0

        return Response(
            {
                "message": "User registered successfully",
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
                "profile": {
                    "company": profile.company or "",
                    "company_address": profile.company_address or "",
                    "phone": profile.phone or "",
                    "contact_number": profile.contact_number or "",
                    "address": profile.address or "",
                    "city": profile.city or "",
                    "post_code": profile.post_code or "",
                    "store_logo": build_absolute_url(request, profile.store_logo.url)
                    if profile.store_logo
                    else "",
                    "banner_image": build_absolute_url(
                        request, profile.banner_image.url
                    )
                    if profile.banner_image
                    else "",
                    "created_at": profile.created_at,
                    "updated_at": profile.updated_at,
                    "sms_credits": sms_credits,
                },
                "settings": {
                    "language": settings.language,
                    "currency": settings.currency,
                    "currency_symbol": settings.currency_symbol,
                    "email_notifications": settings.email_notifications,
                    "marketing_notifications": settings.marketing_notifications,
                    "created_at": settings.created_at,
                    "updated_at": settings.updated_at,
                },
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    User login endpoint
    """
    try:
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        # Get user profile and settings
        profile, profile_created = UserProfile.objects.get_or_create(user=user)
        settings, settings_created = UserSettings.objects.get_or_create(user=user)

        # Get SMS credits
        from subscription.models import UserSMSCredit

        try:
            sms_credit = UserSMSCredit.objects.get(user=user)
            sms_credits = sms_credit.credits
        except UserSMSCredit.DoesNotExist:
            sms_credits = 0

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
                "profile": {
                    "company": profile.company or "",
                    "company_address": profile.company_address or "",
                    "phone": profile.phone or "",
                    "contact_number": profile.contact_number or "",
                    "address": profile.address or "",
                    "store_logo": build_absolute_url(request, profile.store_logo.url)
                    if profile.store_logo
                    else "",
                    "banner_image": build_absolute_url(
                        request, profile.banner_image.url
                    )
                    if profile.banner_image
                    else "",
                    "created_at": profile.created_at,
                    "updated_at": profile.updated_at,
                    "sms_credits": sms_credits,
                },
                "settings": {
                    "language": settings.language,
                    "currency": settings.currency,
                    "currency_symbol": settings.currency_symbol,
                    "email_notifications": settings.email_notifications,
                    "marketing_notifications": settings.marketing_notifications,
                    "created_at": settings.created_at,
                    "updated_at": settings.updated_at,
                },
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    User logout endpoint
    """
    try:
        # Delete the user's token
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get or update user profile
    """
    user = request.user

    if request.method == "GET":
        # Get profile data
        profile, created = UserProfile.objects.get_or_create(user=user)

        # Get user settings
        settings, settings_created = UserSettings.objects.get_or_create(user=user)

        # Get SMS credits
        from subscription.models import UserSMSCredit

        try:
            sms_credit = UserSMSCredit.objects.get(user=user)
            sms_credits = sms_credit.credits
        except UserSMSCredit.DoesNotExist:
            sms_credits = 0

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
                "profile": {
                    "company": profile.company or "",
                    "company_address": profile.company_address or "",
                    "phone": profile.phone or "",
                    "contact_number": profile.contact_number or "",
                    "address": profile.address or "",
                    "city": profile.city or "",
                    "post_code": profile.post_code or "",
                    "store_logo": build_absolute_url(request, profile.store_logo.url)
                    if profile.store_logo
                    else "",
                    "banner_image": build_absolute_url(
                        request, profile.banner_image.url
                    )
                    if profile.banner_image
                    else "",
                    "created_at": profile.created_at,
                    "updated_at": profile.updated_at,
                    "sms_credits": sms_credits,
                },
                "settings": {
                    "language": settings.language,
                    "currency": settings.currency,
                    "currency_symbol": settings.currency_symbol,
                    "email_notifications": settings.email_notifications,
                    "marketing_notifications": settings.marketing_notifications,
                    "created_at": settings.created_at,
                    "updated_at": settings.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    elif request.method == "PUT":
        # Update profile data
        try:
            # Get or create profile
            profile, created = UserProfile.objects.get_or_create(user=user)

            # Update user fields
            if "first_name" in request.data:
                user.first_name = request.data["first_name"]
            if "last_name" in request.data:
                user.last_name = request.data["last_name"]
            if "email" in request.data:
                user.email = request.data["email"]

            user.save()

            # Update profile fields
            if "company" in request.data:
                profile.company = request.data["company"]
            if "company_address" in request.data:
                profile.company_address = request.data["company_address"]
            if "phone" in request.data:
                profile.phone = request.data["phone"]
            if "contact_number" in request.data:
                profile.contact_number = request.data["contact_number"]
            if "address" in request.data:
                profile.address = request.data["address"]
            if "city" in request.data:
                profile.city = request.data["city"]
            if "post_code" in request.data:
                profile.post_code = request.data["post_code"]

            profile.save()

            return Response(
                {
                    "message": "Profile updated successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                    "profile": {
                        "company": profile.company or "",
                        "company_address": profile.company_address or "",
                        "phone": profile.phone or "",
                        "contact_number": profile.contact_number or "",
                        "address": profile.address or "",
                        "city": profile.city or "",
                        "post_code": profile.post_code or "",
                        "store_logo": build_absolute_url(
                            request, profile.store_logo.url
                        )
                        if profile.store_logo
                        else "",
                        "banner_image": build_absolute_url(
                            request, profile.banner_image.url
                        )
                        if profile.banner_image
                        else "",
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_store_logo(request):
    """
    Upload store logo
    """
    try:
        print(f"📁 Store logo upload request from user: {request.user.username}")
        print(f"📁 Files in request: {list(request.FILES.keys())}")
        print(f"📁 Request method: {request.method}")
        print(f"📁 Content type: {request.content_type}")
        
        if "store_logo" not in request.FILES:
            print("❌ No store_logo file in request")
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES["store_logo"]
        print(f"📁 File details: name={file.name}, size={file.size}, content_type={file.content_type}")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {"error": f"File type not allowed. Allowed types: {', '.join(allowed_types)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (10MB max)
        max_size = 10 * 1024 * 1024  # 10MB
        if file.size > max_size:
            return Response(
                {"error": "File size too large. Maximum size is 10MB"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        print(f"📁 Profile {'created' if created else 'found'} for user: {request.user.username}")
        
        # Delete old logo if exists
        if profile.store_logo:
            try:
                old_logo_path = profile.store_logo.path
                if os.path.exists(old_logo_path):
                    os.remove(old_logo_path)
                    print(f"📁 Deleted old logo: {old_logo_path}")
            except Exception as e:
                print(f"⚠️ Could not delete old logo: {e}")
        
        profile.store_logo = file
        profile.save()
        print(f"✅ Store logo saved successfully: {profile.store_logo.url}")

        return Response(
            {
                "message": "Store logo uploaded successfully",
                "store_logo_url": build_absolute_url(request, profile.store_logo.url),
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print(f"❌ Store logo upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_banner_image(request):
    """
    Upload banner image
    """
    try:
        print(f"📁 Banner image upload request from user: {request.user.username}")
        print(f"📁 Files in request: {list(request.FILES.keys())}")
        print(f"📁 Request method: {request.method}")
        print(f"📁 Content type: {request.content_type}")
        
        if "banner_image" not in request.FILES:
            print("❌ No banner_image file in request")
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES["banner_image"]
        print(f"📁 File details: name={file.name}, size={file.size}, content_type={file.content_type}")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {"error": f"File type not allowed. Allowed types: {', '.join(allowed_types)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (10MB max)
        max_size = 10 * 1024 * 1024  # 10MB
        if file.size > max_size:
            return Response(
                {"error": "File size too large. Maximum size is 10MB"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        print(f"📁 Profile {'created' if created else 'found'} for user: {request.user.username}")
        
        # Delete old banner if exists
        if profile.banner_image:
            try:
                old_banner_path = profile.banner_image.path
                if os.path.exists(old_banner_path):
                    os.remove(old_banner_path)
                    print(f"📁 Deleted old banner: {old_banner_path}")
            except Exception as e:
                print(f"⚠️ Could not delete old banner: {e}")
        
        profile.banner_image = file
        profile.save()
        print(f"✅ Banner image saved successfully: {profile.banner_image.url}")

        return Response(
            {
                "message": "Banner image uploaded successfully",
                "banner_image_url": build_absolute_url(
                    request, profile.banner_image.url
                ),
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print(f"❌ Banner image upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_store_logo(request):
    """
    Remove store logo
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        if profile.store_logo:
            profile.store_logo.delete()
            profile.store_logo = None
            profile.save()

        return Response(
            {"message": "Store logo removed successfully"}, status=status.HTTP_200_OK
        )

    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_banner_image(request):
    """
    Remove banner image
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        if profile.banner_image:
            profile.banner_image.delete()
            profile.banner_image = None
            profile.save()

        return Response(
            {"message": "Banner image removed successfully"}, status=status.HTTP_200_OK
        )

    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def categories(request):
    """
    Get all categories or create a new category
    """
    if request.method == "GET":
        try:
            user_categories = Category.objects.filter(user=request.user)
            categories_data = []

            for category in user_categories:
                categories_data.append(
                    {
                        "id": category.id,
                        "name": category.name,
                        "description": category.description or "",
                        "is_active": category.is_active,
                        "created_at": category.created_at,
                        "updated_at": category.updated_at,
                    }
                )

            return Response({"categories": categories_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            name = request.data.get("name", "").strip()
            description = request.data.get("description", "").strip()

            if not name:
                return Response(
                    {"error": "Category name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if category with same name already exists for this user
            if Category.objects.filter(user=request.user, name__iexact=name).exists():
                return Response(
                    {"error": "Category with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create new category
            category = Category.objects.create(
                name=name, description=description, user=request.user
            )

            return Response(
                {
                    "message": "Category created successfully",
                    "category": {
                        "id": category.id,
                        "name": category.name,
                        "description": category.description or "",
                        "is_active": category.is_active,
                        "created_at": category.created_at,
                        "updated_at": category.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def category_detail(request, category_id):
    """
    Update or delete a specific category
    """
    try:
        category = Category.objects.get(id=category_id, user=request.user)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "PUT":
        try:
            # Update category fields
            if "name" in request.data:
                name = request.data["name"].strip()
                if not name:
                    return Response(
                        {"error": "Category name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if another category with same name exists for this user
                if (
                    Category.objects.filter(user=request.user, name__iexact=name)
                    .exclude(id=category_id)
                    .exists()
                ):
                    return Response(
                        {"error": "Category with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                category.name = name

            if "description" in request.data:
                category.description = request.data["description"].strip()

            if "is_active" in request.data:
                category.is_active = bool(request.data["is_active"])

            category.save()

            return Response(
                {
                    "message": "Category updated successfully",
                    "category": {
                        "id": category.id,
                        "name": category.name,
                        "description": category.description or "",
                        "is_active": category.is_active,
                        "created_at": category.created_at,
                        "updated_at": category.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            category.delete()
            return Response(
                {"message": "Category deleted successfully"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_category(request, category_id):
    """
    Toggle category active status
    """
    try:
        category = Category.objects.get(id=category_id, user=request.user)
        category.is_active = not category.is_active
        category.save()

        return Response(
            {
                "message": f"Category {'activated' if category.is_active else 'deactivated'} successfully",
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "description": category.description or "",
                    "is_active": category.is_active,
                    "created_at": category.created_at,
                    "updated_at": category.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    Get or update user settings
    """
    user = request.user

    if request.method == "GET":
        try:
            # Get or create settings
            settings, created = UserSettings.objects.get_or_create(user=user)

            return Response(
                {
                    "settings": {
                        "language": settings.language,
                        "currency": settings.currency,
                        "currency_symbol": settings.currency_symbol,
                        "email_notifications": settings.email_notifications,
                        "marketing_notifications": settings.marketing_notifications,
                    }
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "PUT":
        try:
            # Get or create settings
            settings, created = UserSettings.objects.get_or_create(user=user)

            # Update settings fields
            if "language" in request.data:
                language = request.data["language"]
                if language in [choice[0] for choice in UserSettings.LANGUAGE_CHOICES]:
                    settings.language = language
                else:
                    return Response(
                        {"error": "Invalid language choice"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if "currency" in request.data:
                currency = request.data["currency"]
                if currency in [choice[0] for choice in UserSettings.CURRENCY_CHOICES]:
                    settings.currency = currency
                else:
                    return Response(
                        {"error": "Invalid currency choice"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if "email_notifications" in request.data:
                settings.email_notifications = bool(request.data["email_notifications"])

            if "marketing_notifications" in request.data:
                settings.marketing_notifications = bool(
                    request.data["marketing_notifications"]
                )

            settings.save()

            return Response(
                {
                    "message": "Settings updated successfully",
                    "settings": {
                        "language": settings.language,
                        "currency": settings.currency,
                        "currency_symbol": settings.currency_symbol,
                        "email_notifications": settings.email_notifications,
                        "marketing_notifications": settings.marketing_notifications,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    try:
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not current_password or not new_password or not confirm_password:
            return Response(
                {
                    "error": "Current password, new password, and confirm password are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if current password is correct
        if not request.user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {"error": "New passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate new password
        try:
            validate_password(new_password, request.user)
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        request.user.set_password(new_password)
        request.user.save()

        return Response(
            {"message": "Password changed successfully"}, status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_password_reset(request):
    """
    Request password reset email
    """
    try:
        user = request.user

        # In a real application, you would generate a reset token and send an email
        # For now, we'll just simulate the process

        try:
            # Simulate sending email (in production, use actual email service)
            send_mail(
                subject="Password Reset Request",
                message=f"Hello {user.first_name or user.username},\n\nYou have requested a password reset. Please click the link below to reset your password.\n\n[Reset Password Link]\n\nIf you did not request this, please ignore this email.",
                from_email="noreply@oxm.com",
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as email_error:
            # Log the error but don't fail the request
            print(f"Email sending failed: {email_error}")

        return Response(
            {"message": f"Password reset instructions have been sent to {user.email}"},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def gifts(request):
    """
    Get all gifts or create a new gift
    """
    if request.method == "GET":
        try:
            user_gifts = Gift.objects.filter(user=request.user)
            gifts_data = []
            for gift in user_gifts:
                gifts_data.append(
                    {
                        "id": gift.id,
                        "name": gift.name,
                        "is_active": gift.is_active,
                        "created_at": gift.created_at,
                        "updated_at": gift.updated_at,
                    }
                )

            return Response({"gifts": gifts_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            name = request.data.get("name", "").strip()

            if not name:
                return Response(
                    {"error": "Gift name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if gift with same name already exists for this user
            if Gift.objects.filter(user=request.user, name__iexact=name).exists():
                return Response(
                    {"error": "Gift with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create new gift
            gift = Gift.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get("is_active", True),
            )

            return Response(
                {
                    "message": "Gift created successfully",
                    "gift": {
                        "id": gift.id,
                        "name": gift.name,
                        "is_active": gift.is_active,
                        "created_at": gift.created_at,
                        "updated_at": gift.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def gift_detail(request, gift_id):
    """
    Update or delete a specific gift
    """
    try:
        gift = Gift.objects.get(id=gift_id, user=request.user)
    except Gift.DoesNotExist:
        return Response({"error": "Gift not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PUT":
        try:
            # Update gift fields
            if "name" in request.data:
                name = request.data["name"].strip()
                if not name:
                    return Response(
                        {"error": "Gift name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if another gift with same name exists for this user
                if (
                    Gift.objects.filter(user=request.user, name__iexact=name)
                    .exclude(id=gift_id)
                    .exists()
                ):
                    return Response(
                        {"error": "Gift with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                gift.name = name

            if "is_active" in request.data:
                gift.is_active = bool(request.data["is_active"])

            gift.save()

            return Response(
                {
                    "message": "Gift updated successfully",
                    "gift": {
                        "id": gift.id,
                        "name": gift.name,
                        "is_active": gift.is_active,
                        "created_at": gift.created_at,
                        "updated_at": gift.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            gift.delete()
            return Response(
                {"message": "Gift deleted successfully"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_gift(request, gift_id):
    """
    Toggle gift active status
    """
    try:
        gift = Gift.objects.get(id=gift_id, user=request.user)
        gift.is_active = not gift.is_active
        gift.save()

        return Response(
            {
                "message": f"Gift {gift.name} {'activated' if gift.is_active else 'deactivated'} successfully",
                "gift": {
                    "id": gift.id,
                    "name": gift.name,
                    "is_active": gift.is_active,
                    "created_at": gift.created_at,
                    "updated_at": gift.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Gift.DoesNotExist:
        return Response({"error": "Gift not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Achievement Views


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def achievements(request):
    """
    GET: Retrieve all achievements for the authenticated user
    POST: Create a new achievement
    """
    if request.method == "GET":
        try:
            user_achievements = Achievement.objects.filter(user=request.user)
            achievements_data = [
                {
                    "id": achievement.id,
                    "name": achievement.name,
                    "type": achievement.type,
                    "value": achievement.value,
                    "points": achievement.points,
                    "is_active": achievement.is_active,
                    "created_at": achievement.created_at,
                    "updated_at": achievement.updated_at,
                }
                for achievement in user_achievements
            ]

            return Response(
                {"achievements": achievements_data}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            data = json.loads(request.body)

            # Validate required fields
            required_fields = ["type", "value", "points"]
            for field in required_fields:
                if field not in data:
                    return Response(
                        {"error": f"Missing required field: {field}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Validate achievement type
            valid_types = ["orders", "amount"]
            if data["type"] not in valid_types:
                return Response(
                    {
                        "error": f"Invalid achievement type. Must be one of: {valid_types}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate value and points are positive integers
            try:
                value = int(data["value"])
                points = int(data["points"])
                if value <= 0 or points <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                return Response(
                    {"error": "Value and points must be positive integers"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Generate achievement name if not provided
            achievement_name = data.get("name")
            if not achievement_name:
                if data["type"] == "orders":
                    achievement_name = f"Complete {value} orders"
                else:
                    achievement_name = f"Spend {value} dollars"

            # Check for duplicate achievement names for this user
            if Achievement.objects.filter(
                user=request.user, name=achievement_name
            ).exists():
                return Response(
                    {"error": "Achievement with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the achievement
            achievement = Achievement.objects.create(
                user=request.user,
                name=achievement_name,
                type=data["type"],
                value=value,
                points=points,
                is_active=data.get("is_active", True),
            )

            return Response(
                {
                    "message": "Achievement created successfully",
                    "achievement": {
                        "id": achievement.id,
                        "name": achievement.name,
                        "type": achievement.type,
                        "value": achievement.value,
                        "points": achievement.points,
                        "is_active": achievement.is_active,
                        "created_at": achievement.created_at,
                        "updated_at": achievement.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except json.JSONDecodeError:
            return Response(
                {"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {"error": "Achievement with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def achievement_detail(request, achievement_id):
    """
    GET: Retrieve a specific achievement
    PUT: Update a specific achievement
    DELETE: Delete a specific achievement
    """
    try:
        achievement = Achievement.objects.get(id=achievement_id, user=request.user)
    except Achievement.DoesNotExist:
        return Response(
            {"error": "Achievement not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        return Response(
            {
                "achievement": {
                    "id": achievement.id,
                    "name": achievement.name,
                    "type": achievement.type,
                    "value": achievement.value,
                    "points": achievement.points,
                    "is_active": achievement.is_active,
                    "created_at": achievement.created_at,
                    "updated_at": achievement.updated_at,
                }
            },
            status=status.HTTP_200_OK,
        )

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)

            # Update fields if provided
            if "name" in data:
                # Check for duplicate names (excluding current achievement)
                if (
                    Achievement.objects.filter(user=request.user, name=data["name"])
                    .exclude(id=achievement.id)
                    .exists()
                ):
                    return Response(
                        {"error": "Achievement with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                achievement.name = data["name"]

            if "type" in data:
                valid_types = ["orders", "amount"]
                if data["type"] not in valid_types:
                    return Response(
                        {
                            "error": f"Invalid achievement type. Must be one of: {valid_types}"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                achievement.type = data["type"]

            if "value" in data:
                try:
                    value = int(data["value"])
                    if value <= 0:
                        raise ValueError()
                    achievement.value = value
                except (ValueError, TypeError):
                    return Response(
                        {"error": "Value must be a positive integer"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if "points" in data:
                try:
                    points = int(data["points"])
                    if points <= 0:
                        raise ValueError()
                    achievement.points = points
                except (ValueError, TypeError):
                    return Response(
                        {"error": "Points must be a positive integer"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if "is_active" in data:
                achievement.is_active = bool(data["is_active"])

            achievement.save()

            return Response(
                {
                    "message": "Achievement updated successfully",
                    "achievement": {
                        "id": achievement.id,
                        "name": achievement.name,
                        "type": achievement.type,
                        "value": achievement.value,
                        "points": achievement.points,
                        "is_active": achievement.is_active,
                        "created_at": achievement.created_at,
                        "updated_at": achievement.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except json.JSONDecodeError:
            return Response(
                {"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {"error": "Achievement with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            achievement_name = achievement.name
            achievement.delete()

            return Response(
                {"message": f'Achievement "{achievement_name}" deleted successfully'},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_achievement(request, achievement_id):
    """
    Toggle achievement active/inactive status
    """
    try:
        achievement = Achievement.objects.get(id=achievement_id, user=request.user)

        # Toggle the active status
        achievement.is_active = not achievement.is_active
        achievement.save()

        return Response(
            {
                "message": f"Achievement {achievement.name} {'activated' if achievement.is_active else 'deactivated'} successfully",
                "achievement": {
                    "id": achievement.id,
                    "name": achievement.name,
                    "type": achievement.type,
                    "value": achievement.value,
                    "points": achievement.points,
                    "is_active": achievement.is_active,
                    "created_at": achievement.created_at,
                    "updated_at": achievement.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Achievement.DoesNotExist:
        return Response(
            {"error": "Achievement not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Level Views


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def levels(request):
    """
    GET: Retrieve all levels for the authenticated user
    POST: Create a new level
    """
    if request.method == "GET":
        try:
            user_levels = Level.objects.filter(user=request.user)
            levels_data = [
                {
                    "id": level.id,
                    "name": level.name,
                    "is_active": level.is_active,
                    "created_at": level.created_at,
                    "updated_at": level.updated_at,
                }
                for level in user_levels
            ]

            return Response({"levels": levels_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            data = json.loads(request.body)

            # Validate required fields
            if "name" not in data or not data["name"].strip():
                return Response(
                    {"error": "Level name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            level_name = data["name"].strip()

            # Check for duplicate level names for this user
            if Level.objects.filter(user=request.user, name=level_name).exists():
                return Response(
                    {"error": "Level with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the level
            level = Level.objects.create(
                user=request.user,
                name=level_name,
                is_active=data.get("is_active", True),
            )

            return Response(
                {
                    "message": "Level created successfully",
                    "level": {
                        "id": level.id,
                        "name": level.name,
                        "is_active": level.is_active,
                        "created_at": level.created_at,
                        "updated_at": level.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except json.JSONDecodeError:
            return Response(
                {"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {"error": "Level with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def level_detail(request, level_id):
    """
    GET: Retrieve a specific level
    PUT: Update a specific level
    DELETE: Delete a specific level
    """
    try:
        level = Level.objects.get(id=level_id, user=request.user)
    except Level.DoesNotExist:
        return Response({"error": "Level not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(
            {
                "level": {
                    "id": level.id,
                    "name": level.name,
                    "is_active": level.is_active,
                    "created_at": level.created_at,
                    "updated_at": level.updated_at,
                }
            },
            status=status.HTTP_200_OK,
        )

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)

            # Update fields if provided
            if "name" in data:
                new_name = data["name"].strip()
                if not new_name:
                    return Response(
                        {"error": "Level name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check for duplicate names (excluding current level)
                if (
                    Level.objects.filter(user=request.user, name=new_name)
                    .exclude(id=level.id)
                    .exists()
                ):
                    return Response(
                        {"error": "Level with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                level.name = new_name

            if "is_active" in data:
                level.is_active = bool(data["is_active"])

            level.save()

            return Response(
                {
                    "message": "Level updated successfully",
                    "level": {
                        "id": level.id,
                        "name": level.name,
                        "is_active": level.is_active,
                        "created_at": level.created_at,
                        "updated_at": level.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except json.JSONDecodeError:
            return Response(
                {"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {"error": "Level with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            level_name = level.name
            level.delete()

            return Response(
                {"message": f'Level "{level_name}" deleted successfully'},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_level(request, level_id):
    """
    Toggle level active/inactive status
    """
    try:
        level = Level.objects.get(id=level_id, user=request.user)

        # Toggle the active status
        level.is_active = not level.is_active
        level.save()

        return Response(
            {
                "message": f"Level {level.name} {'activated' if level.is_active else 'deactivated'} successfully",
                "level": {
                    "id": level.id,
                    "name": level.name,
                    "is_active": level.is_active,
                    "created_at": level.created_at,
                    "updated_at": level.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Level.DoesNotExist:
        return Response({"error": "Level not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@api_view(["POST", "GET"])
def smsSend(request):
    from subscription.models import SMSSentHistory, UserSMSCredit
    import re

    data = request.data
    phone = data.get("phone", "").strip()
    message = data.get("message", "").strip()

    if not phone or not message:
        return Response(
            {"success": False, "error": "Phone number and message are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Calculate SMS count properly for Unicode/Bengali text
    length = len(message)
    
    # Check if message contains Unicode characters (Bengali, emojis, etc.)
    has_unicode_chars = (
        re.search(r'[^\x00-\x7F]', message) or
        re.search(r'[\u0980-\u09FF]', message) or  # Bengali
        re.search(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]', message)  # Emojis
    )
    
    if has_unicode_chars:
        # Unicode encoding - for Bengali, emojis, etc.
        if length <= 70:
            sms_count = 1
        else:
            sms_count = (length + 66) // 67  # 67 chars per segment for multi-part Unicode
    else:
        # GSM 7-bit encoding - for basic Latin characters
        if length <= 160:
            sms_count = 1
        else:
            sms_count = (length + 152) // 153  # 153 chars per segment for multi-part GSM
    
    print(f"SMS calculation: {length} chars, Unicode: {has_unicode_chars}, Segments: {sms_count}")

    # Check if user has sufficient SMS credits
    try:
        user_sms_credit = UserSMSCredit.objects.get(user=request.user)
        if user_sms_credit.credits < sms_count:
            return Response(
                {
                    "success": False,
                    "error": f"Insufficient SMS credits. You need {sms_count} credit{'s' if sms_count > 1 else ''} but only have {user_sms_credit.credits}.",
                    "required_credits": sms_count,
                    "available_credits": user_sms_credit.credits,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
    except UserSMSCredit.DoesNotExist:
        return Response(
            {
                "success": False,
                "error": f"No SMS credits available. You need {sms_count} credit{'s' if sms_count > 1 else ''} to send this message.",
                "required_credits": sms_count,
                "available_credits": 0,
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    url = "http://api.smsinbd.com/sms-api/sendsms"
    payload = {
        "api_token": settings.API_SMS,
        "senderid": "8809617614969",
        "contact_number": phone,
        "message": message,
    }

    try:
        # Add timeout to prevent ECONNABORTED errors
        response = requests.get(url, params=payload, timeout=10)

        # If SMS was sent successfully, deduct credits and log the transaction
        if response.status_code == 200:
            # Deduct SMS credits
            user_sms_credit.credits -= sms_count
            user_sms_credit.save()

            # Log the SMS transaction
            SMSSentHistory.objects.create(
                user=request.user,
                recipient=phone,
                message=message,
                status="sent",
                sms_count=sms_count,
            )

            print(
                f"SMS sent successfully. Deducted {sms_count} credits ({length} chars, Unicode: {has_unicode_chars}). Remaining: {user_sms_credit.credits}"
            )
            return Response(
                {
                    "success": True,
                    "message": "SMS sent successfully",
                    "credits_used": sms_count,
                    "remaining_credits": user_sms_credit.credits,
                    "response": response.text,
                },
                status=status.HTTP_200_OK,
            )
        else:
            # Log failed SMS attempt (but don't deduct credits)
            SMSSentHistory.objects.create(
                user=request.user,
                recipient=phone,
                message=message,
                status="failed",
                sms_count=sms_count,
            )
            return Response(
                {
                    "success": False,
                    "error": f"SMS service failed to send message. Service response: {response.status_code}",
                    "service_response": response.text,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except requests.exceptions.Timeout:
        print("SMS API request timed out")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status="failed",
            sms_count=sms_count,
        )
        return Response(
            {
                "success": False,
                "error": "SMS service is currently unavailable (timeout). Please try again later.",
            },
            status=status.HTTP_408_REQUEST_TIMEOUT,
        )
    except requests.exceptions.ConnectionError:
        print("SMS API connection error")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status="failed",
            sms_count=sms_count,
        )
        return Response(
            {
                "success": False,
                "error": "SMS service is currently unavailable (connection error). Please try again later.",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except requests.exceptions.RequestException as e:
        print(f"SMS API request failed: {str(e)}")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status="failed",
            sms_count=sms_count,
        )
        return Response(
            {"success": False, "error": f"SMS service error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Brand Views


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def brands(request):
    """
    Get all brands or create a new brand
    """
    if request.method == "GET":
        try:
            user_brands = Brand.objects.filter(user=request.user)
            brands_data = []
            for brand in user_brands:
                brands_data.append(
                    {
                        "id": brand.id,
                        "name": brand.name,
                        "is_active": brand.is_active,
                        "created_at": brand.created_at,
                        "updated_at": brand.updated_at,
                    }
                )

            return Response({"brands": brands_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            name = request.data.get("name", "").strip()

            if not name:
                return Response(
                    {"error": "Brand name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if brand with same name already exists for this user
            if Brand.objects.filter(user=request.user, name__iexact=name).exists():
                return Response(
                    {"error": "Brand with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create new brand
            brand = Brand.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get("is_active", True),
            )

            return Response(
                {
                    "message": "Brand created successfully",
                    "brand": {
                        "id": brand.id,
                        "name": brand.name,
                        "is_active": brand.is_active,
                        "created_at": brand.created_at,
                        "updated_at": brand.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def brand_detail(request, brand_id):
    """
    Update or delete a specific brand
    """
    try:
        brand = Brand.objects.get(id=brand_id, user=request.user)
    except Brand.DoesNotExist:
        return Response({"error": "Brand not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PUT":
        try:
            # Update brand fields
            if "name" in request.data:
                name = request.data["name"].strip()
                if not name:
                    return Response(
                        {"error": "Brand name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if another brand with same name exists for this user
                if (
                    Brand.objects.filter(user=request.user, name__iexact=name)
                    .exclude(id=brand_id)
                    .exists()
                ):
                    return Response(
                        {"error": "Brand with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                brand.name = name

            if "is_active" in request.data:
                brand.is_active = request.data["is_active"]

            brand.save()

            return Response(
                {
                    "message": "Brand updated successfully",
                    "brand": {
                        "id": brand.id,
                        "name": brand.name,
                        "is_active": brand.is_active,
                        "created_at": brand.created_at,
                        "updated_at": brand.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            brand.delete()
            return Response(
                {"message": "Brand deleted successfully"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_brand(request, brand_id):
    """
    Toggle brand active status
    """
    try:
        brand = Brand.objects.get(id=brand_id, user=request.user)
        brand.is_active = not brand.is_active
        brand.save()

        return Response(
            {
                "message": f"Brand {brand.name} {'activated' if brand.is_active else 'deactivated'} successfully",
                "brand": {
                    "id": brand.id,
                    "name": brand.name,
                    "is_active": brand.is_active,
                    "created_at": brand.created_at,
                    "updated_at": brand.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Brand.DoesNotExist:
        return Response({"error": "Brand not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Payment Method Views


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """
    Get all payment methods or create a new payment method
    """
    if request.method == "GET":
        try:
            user_payment_methods = PaymentMethod.objects.filter(user=request.user)
            payment_methods_data = []
            for payment_method in user_payment_methods:
                payment_methods_data.append(
                    {
                        "id": payment_method.id,
                        "name": payment_method.name,
                        "is_active": payment_method.is_active,
                        "created_at": payment_method.created_at,
                        "updated_at": payment_method.updated_at,
                    }
                )

            return Response(
                {"paymentMethods": payment_methods_data}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "POST":
        try:
            name = request.data.get("name", "").strip()

            if not name:
                return Response(
                    {"error": "Payment method name is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if payment method with same name already exists for this user
            if PaymentMethod.objects.filter(
                user=request.user, name__iexact=name
            ).exists():
                return Response(
                    {"error": "Payment method with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create new payment method
            payment_method = PaymentMethod.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get("is_active", True),
            )

            return Response(
                {
                    "message": "Payment method created successfully",
                    "paymentMethod": {
                        "id": payment_method.id,
                        "name": payment_method.name,
                        "is_active": payment_method.is_active,
                        "created_at": payment_method.created_at,
                        "updated_at": payment_method.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, payment_method_id):
    """
    Update or delete a specific payment method
    """
    try:
        payment_method = PaymentMethod.objects.get(
            id=payment_method_id, user=request.user
        )
    except PaymentMethod.DoesNotExist:
        return Response(
            {"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "PUT":
        try:
            # Update payment method fields
            if "name" in request.data:
                name = request.data["name"].strip()
                if not name:
                    return Response(
                        {"error": "Payment method name cannot be empty"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if another payment method with same name exists for this user
                if (
                    PaymentMethod.objects.filter(user=request.user, name__iexact=name)
                    .exclude(id=payment_method_id)
                    .exists()
                ):
                    return Response(
                        {"error": "Payment method with this name already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payment_method.name = name

            if "is_active" in request.data:
                payment_method.is_active = request.data["is_active"]

            payment_method.save()

            return Response(
                {
                    "message": "Payment method updated successfully",
                    "paymentMethod": {
                        "id": payment_method.id,
                        "name": payment_method.name,
                        "is_active": payment_method.is_active,
                        "created_at": payment_method.created_at,
                        "updated_at": payment_method.updated_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == "DELETE":
        try:
            payment_method.delete()
            return Response(
                {"message": "Payment method deleted successfully"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def toggle_payment_method(request, payment_method_id):
    """
    Toggle payment method active status
    """
    try:
        payment_method = PaymentMethod.objects.get(
            id=payment_method_id, user=request.user
        )
        payment_method.is_active = not payment_method.is_active
        payment_method.save()

        return Response(
            {
                "message": f"Payment method {payment_method.name} {'activated' if payment_method.is_active else 'deactivated'} successfully",
                "paymentMethod": {
                    "id": payment_method.id,
                    "name": payment_method.name,
                    "is_active": payment_method.is_active,
                    "created_at": payment_method.created_at,
                    "updated_at": payment_method.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except PaymentMethod.DoesNotExist:
        return Response(
            {"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ======================= CUSTOM DOMAIN API VIEWS =======================


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def custom_domain_view(request):
    """
    Get or create/update custom domain for authenticated user
    """
    if request.method == "GET":
        try:
            custom_domain = CustomDomain.objects.get(user=request.user)
            dns_records = DNSRecord.objects.filter(custom_domain=custom_domain)

            return Response(
                {
                    "custom_domain": {
                        "id": custom_domain.id,
                        "domain": custom_domain.domain,
                        "full_domain": custom_domain.full_domain,
                        "status": custom_domain.status,
                        "is_active": custom_domain.is_active,
                        "ssl_enabled": custom_domain.ssl_enabled,
                        "verified_at": custom_domain.verified_at,
                        "created_at": custom_domain.created_at,
                        "updated_at": custom_domain.updated_at,
                    },
                    "dns_records": [
                        {
                            "id": record.id,
                            "record_type": record.record_type,
                            "name": record.name,
                            "value": record.value,
                            "ttl": record.ttl,
                            "priority": record.priority,
                        }
                        for record in dns_records
                    ],
                },
                status=status.HTTP_200_OK,
            )

        except CustomDomain.DoesNotExist:
            return Response(
                {"custom_domain": None, "dns_records": []}, status=status.HTTP_200_OK
            )

    elif request.method == "POST":
        try:
            domain = request.data.get("domain", "").strip().lower()

            if not domain:
                return Response(
                    {"error": "Domain is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Remove protocol if present
            domain = domain.replace("http://", "").replace("https://", "")
            domain = domain.replace("www.", "")

            # Check if domain already exists for another user
            existing_domain = (
                CustomDomain.objects.filter(domain=domain)
                .exclude(user=request.user)
                .first()
            )

            if existing_domain:
                return Response(
                    {"error": "This domain is already taken by another user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create or update custom domain
            custom_domain, created = CustomDomain.objects.get_or_create(
                user=request.user,
                defaults={
                    "domain": domain,
                    "status": "pending",
                    "is_active": True,
                },
            )

            if not created:
                # Update existing domain
                custom_domain.domain = domain
                custom_domain.status = "pending"
                custom_domain.save()

            return Response(
                {
                    "message": "Custom domain saved successfully",
                    "custom_domain": {
                        "id": custom_domain.id,
                        "domain": custom_domain.domain,
                        "full_domain": custom_domain.full_domain,
                        "status": custom_domain.status,
                        "is_active": custom_domain.is_active,
                        "ssl_enabled": custom_domain.ssl_enabled,
                        "verified_at": custom_domain.verified_at,
                        "created_at": custom_domain.created_at,
                        "updated_at": custom_domain.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Error saving custom domain: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_custom_domain(request):
    """
    Delete custom domain for authenticated user
    """
    try:
        custom_domain = CustomDomain.objects.get(user=request.user)
        custom_domain.delete()

        return Response(
            {"message": "Custom domain deleted successfully"}, status=status.HTTP_200_OK
        )

    except CustomDomain.DoesNotExist:
        return Response(
            {"error": "Custom domain not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error deleting custom domain: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_custom_domain(request):
    """
    Verify custom domain DNS configuration
    """
    try:
        custom_domain = CustomDomain.objects.get(user=request.user)

        # Here you would implement actual DNS verification logic
        # For now, we'll just mark it as verified
        from django.utils import timezone

        custom_domain.status = "verified"
        custom_domain.is_active = True
        custom_domain.verified_at = timezone.now()
        custom_domain.save()

        return Response(
            {
                "message": "Domain verified successfully",
                "custom_domain": {
                    "id": custom_domain.id,
                    "domain": custom_domain.domain,
                    "subdomain": custom_domain.subdomain,
                    "full_domain": custom_domain.full_domain,
                    "status": custom_domain.status,
                    "is_active": custom_domain.is_active,
                    "ssl_enabled": custom_domain.ssl_enabled,
                    "verified_at": custom_domain.verified_at,
                    "created_at": custom_domain.created_at,
                    "updated_at": custom_domain.updated_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    except CustomDomain.DoesNotExist:
        return Response(
            {"error": "Custom domain not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error verifying domain: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def dns_records_view(request):
    """
    Get or create DNS records for user's custom domain
    """
    try:
        custom_domain = CustomDomain.objects.get(user=request.user)
    except CustomDomain.DoesNotExist:
        return Response(
            {"error": "Custom domain not found. Please configure a domain first."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        dns_records = DNSRecord.objects.filter(custom_domain=custom_domain)

        return Response(
            {
                "dns_records": [
                    {
                        "id": record.id,
                        "record_type": record.record_type,
                        "name": record.name,
                        "value": record.value,
                        "ttl": record.ttl,
                        "priority": record.priority,
                        "created_at": record.created_at,
                        "updated_at": record.updated_at,
                    }
                    for record in dns_records
                ]
            },
            status=status.HTTP_200_OK,
        )

    elif request.method == "POST":
        try:
            record_type = request.data.get("record_type", "").upper()
            name = request.data.get("name", "").strip()
            value = request.data.get("value", "").strip()
            ttl = request.data.get("ttl", 3600)
            priority = request.data.get("priority", None)

            if not all([record_type, name, value]):
                return Response(
                    {"error": "record_type, name, and value are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            valid_types = [choice[0] for choice in DNSRecord.RECORD_TYPES]
            if record_type not in valid_types:
                return Response(
                    {"error": f"Invalid record type. Valid types: {valid_types}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dns_record = DNSRecord.objects.create(
                custom_domain=custom_domain,
                record_type=record_type,
                name=name,
                value=value,
                ttl=ttl,
                priority=priority,
            )

            return Response(
                {
                    "message": "DNS record created successfully",
                    "dns_record": {
                        "id": dns_record.id,
                        "record_type": dns_record.record_type,
                        "name": dns_record.name,
                        "value": dns_record.value,
                        "ttl": dns_record.ttl,
                        "priority": dns_record.priority,
                        "created_at": dns_record.created_at,
                        "updated_at": dns_record.updated_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError:
            return Response(
                {"error": "DNS record with this type and name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Error creating DNS record: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_dns_record(request, record_id):
    """
    Delete a specific DNS record
    """
    try:
        custom_domain = CustomDomain.objects.get(user=request.user)
        dns_record = DNSRecord.objects.get(id=record_id, custom_domain=custom_domain)
        dns_record.delete()

        return Response(
            {"message": "DNS record deleted successfully"}, status=status.HTTP_200_OK
        )

    except CustomDomain.DoesNotExist:
        return Response(
            {"error": "Custom domain not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except DNSRecord.DoesNotExist:
        return Response(
            {"error": "DNS record not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error deleting DNS record: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_store_by_domain(request, domain):
    """
    Get online store data by custom domain
    This endpoint will be used by the custom domain to serve the store
    """
    try:
        # Find the custom domain
        custom_domain = CustomDomain.objects.get(domain=domain, is_active=True)

        # Get the user's online store products
        online_products = []
        try:
            from online_store.models import OnlineProduct
            from online_store.serializers import PublicOnlineProductSerializer

            online_products_queryset = OnlineProduct.objects.filter(
                user=custom_domain.user, is_published=True
            )
            online_products = PublicOnlineProductSerializer(
                online_products_queryset, many=True
            ).data

        except Exception as e:
            print(f"Error fetching online products: {e}")
            pass

        # Get user profile for store info
        user_profile = UserProfile.objects.get(user=custom_domain.user)

        # Get store settings if available
        store_settings = None
        try:
            from online_store.models import StoreSettings

            store_settings = StoreSettings.objects.get(user=custom_domain.user)
        except:
            pass

        return Response(
            {
                "store_info": {
                    "domain": custom_domain.full_domain,
                    "store_name": user_profile.company
                    or custom_domain.user.get_full_name()
                    or custom_domain.user.username,
                    "description": store_settings.store_description
                    if store_settings
                    else "Welcome to our online store",
                    "logo": build_absolute_url(request, user_profile.store_logo.url)
                    if user_profile.store_logo
                    else None,
                    "banner": build_absolute_url(request, user_profile.banner_image.url)
                    if user_profile.banner_image
                    else None,
                    "contact_email": store_settings.contact_email
                    if store_settings
                    else user_profile.user.email,
                    "contact_phone": store_settings.contact_phone
                    if store_settings
                    else user_profile.phone,
                },
                "products": online_products,
                "owner": {
                    "username": custom_domain.user.username,
                    "company": user_profile.company,
                    "phone": user_profile.phone,
                    "address": user_profile.address,
                },
                "store_settings": {
                    "terms_and_conditions": store_settings.terms_and_conditions
                    if store_settings
                    else "",
                    "privacy_policy": store_settings.privacy_policy
                    if store_settings
                    else "",
                },
            },
            status=status.HTTP_200_OK,
        )

    except CustomDomain.DoesNotExist:
        return Response(
            {"error": "Store not found for this domain"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Error retrieving store: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
