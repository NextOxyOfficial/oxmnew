from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.db import IntegrityError
from django.core.mail import send_mail
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, Category, UserSettings, Gift, Achievement, Level, Brand, PaymentMethod
import json
from django.conf import settings
import requests


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    API root endpoint
    """
    return Response({
        'message': 'Welcome to OXM Backend API',
        'endpoints': {
            'health': '/api/health/',
            'register': '/api/auth/register/',
            'login': '/api/auth/login/',
            'logout': '/api/auth/logout/',
            'profile': '/api/auth/profile/',
            'update-profile': '/api/auth/profile/update/',
            'admin': '/admin/',
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint
    """
    return Response({
        'status': 'healthy',
        'message': 'Backend is running successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    User registration endpoint
    """
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not username or not email or not password:
            return Response({
                'error': 'Username, email, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Create token
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    User login endpoint
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    User logout endpoint
    """
    try:
        # Delete the user's token
        Token.objects.filter(user=request.user).delete()
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get or update user profile
    """
    user = request.user

    if request.method == 'GET':
        # Get profile data
        profile, created = UserProfile.objects.get_or_create(user=user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            },
            'profile': {
                'company': profile.company or '',
                'company_address': profile.company_address or '',
                'phone': profile.phone or '',
                'store_logo': profile.store_logo.url if profile.store_logo else '',
                'banner_image': profile.banner_image.url if profile.banner_image else '',
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        # Update profile data
        try:
            # Get or create profile
            profile, created = UserProfile.objects.get_or_create(user=user)

            # Update user fields
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            if 'email' in request.data:
                user.email = request.data['email']

            user.save()

            # Update profile fields
            if 'company' in request.data:
                profile.company = request.data['company']
            if 'company_address' in request.data:
                profile.company_address = request.data['company_address']
            if 'phone' in request.data:
                profile.phone = request.data['phone']

            profile.save()

            return Response({
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'profile': {
                    'company': profile.company or '',
                    'company_address': profile.company_address or '',
                    'phone': profile.phone or '',
                    'store_logo': profile.store_logo.url if profile.store_logo else '',
                    'banner_image': profile.banner_image.url if profile.banner_image else '',
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_store_logo(request):
    """
    Upload store logo
    """
    try:
        if 'store_logo' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        profile.store_logo = request.FILES['store_logo']
        profile.save()

        return Response({
            'message': 'Store logo uploaded successfully',
            'store_logo_url': profile.store_logo.url
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_banner_image(request):
    """
    Upload banner image
    """
    try:
        if 'banner_image' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        profile.banner_image = request.FILES['banner_image']
        profile.save()

        return Response({
            'message': 'Banner image uploaded successfully',
            'banner_image_url': profile.banner_image.url
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
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

        return Response({
            'message': 'Store logo removed successfully'
        }, status=status.HTTP_200_OK)

    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
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

        return Response({
            'message': 'Banner image removed successfully'
        }, status=status.HTTP_200_OK)

    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def categories(request):
    """
    Get all categories or create a new category
    """
    if request.method == 'GET':
        try:
            user_categories = Category.objects.filter(user=request.user)
            categories_data = []

            for category in user_categories:
                categories_data.append({
                    'id': category.id,
                    'name': category.name,
                    'description': category.description or '',
                    'is_active': category.is_active,
                    'created_at': category.created_at,
                    'updated_at': category.updated_at,
                })

            return Response({
                'categories': categories_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            name = request.data.get('name', '').strip()
            description = request.data.get('description', '').strip()

            if not name:
                return Response({
                    'error': 'Category name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if category with same name already exists for this user
            if Category.objects.filter(user=request.user, name__iexact=name).exists():
                return Response({
                    'error': 'Category with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new category
            category = Category.objects.create(
                name=name,
                description=description,
                user=request.user
            )

            return Response({
                'message': 'Category created successfully',
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description or '',
                    'is_active': category.is_active,
                    'created_at': category.created_at,
                    'updated_at': category.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_detail(request, category_id):
    """
    Update or delete a specific category
    """
    try:
        category = Category.objects.get(id=category_id, user=request.user)
    except Category.DoesNotExist:
        return Response({
            'error': 'Category not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        try:
            # Update category fields
            if 'name' in request.data:
                name = request.data['name'].strip()
                if not name:
                    return Response({
                        'error': 'Category name cannot be empty'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if another category with same name exists for this user
                if Category.objects.filter(
                    user=request.user,
                    name__iexact=name
                ).exclude(id=category_id).exists():
                    return Response({
                        'error': 'Category with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)

                category.name = name

            if 'description' in request.data:
                category.description = request.data['description'].strip()

            if 'is_active' in request.data:
                category.is_active = bool(request.data['is_active'])

            category.save()

            return Response({
                'message': 'Category updated successfully',
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description or '',
                    'is_active': category.is_active,
                    'created_at': category.created_at,
                    'updated_at': category.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            category.delete()
            return Response({
                'message': 'Category deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_category(request, category_id):
    """
    Toggle category active status
    """
    try:
        category = Category.objects.get(id=category_id, user=request.user)
        category.is_active = not category.is_active
        category.save()

        return Response({
            'message': f'Category {"activated" if category.is_active else "deactivated"} successfully',
            'category': {
                'id': category.id,
                'name': category.name,
                'description': category.description or '',
                'is_active': category.is_active,
                'created_at': category.created_at,
                'updated_at': category.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except Category.DoesNotExist:
        return Response({
            'error': 'Category not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    Get or update user settings
    """
    user = request.user

    if request.method == 'GET':
        try:
            # Get or create settings
            settings, created = UserSettings.objects.get_or_create(user=user)

            return Response({
                'settings': {
                    'language': settings.language,
                    'currency': settings.currency,
                    'currency_symbol': settings.currency_symbol,
                    'email_notifications': settings.email_notifications,
                    'marketing_notifications': settings.marketing_notifications,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'PUT':
        try:
            # Get or create settings
            settings, created = UserSettings.objects.get_or_create(user=user)

            # Update settings fields
            if 'language' in request.data:
                language = request.data['language']
                if language in [choice[0] for choice in UserSettings.LANGUAGE_CHOICES]:
                    settings.language = language
                else:
                    return Response({
                        'error': 'Invalid language choice'
                    }, status=status.HTTP_400_BAD_REQUEST)

            if 'currency' in request.data:
                currency = request.data['currency']
                if currency in [choice[0] for choice in UserSettings.CURRENCY_CHOICES]:
                    settings.currency = currency
                else:
                    return Response({
                        'error': 'Invalid currency choice'
                    }, status=status.HTTP_400_BAD_REQUEST)

            if 'email_notifications' in request.data:
                settings.email_notifications = bool(
                    request.data['email_notifications'])

            if 'marketing_notifications' in request.data:
                settings.marketing_notifications = bool(
                    request.data['marketing_notifications'])

            settings.save()

            return Response({
                'message': 'Settings updated successfully',
                'settings': {
                    'language': settings.language,
                    'currency': settings.currency,
                    'currency_symbol': settings.currency_symbol,
                    'email_notifications': settings.email_notifications,
                    'marketing_notifications': settings.marketing_notifications,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    try:
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response({
                'error': 'Current password, new password, and confirm password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if current password is correct
        if not request.user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if new passwords match
        if new_password != confirm_password:
            return Response({
                'error': 'New passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate new password
        try:
            validate_password(new_password, request.user)
        except ValidationError as e:
            return Response({
                'error': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        request.user.set_password(new_password)
        request.user.save()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
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
                subject='Password Reset Request',
                message=f'Hello {user.first_name or user.username},\n\nYou have requested a password reset. Please click the link below to reset your password.\n\n[Reset Password Link]\n\nIf you did not request this, please ignore this email.',
                from_email='noreply@oxm.com',
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as email_error:
            # Log the error but don't fail the request
            print(f"Email sending failed: {email_error}")

        return Response({
            'message': f'Password reset instructions have been sent to {user.email}'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def gifts(request):
    """
    Get all gifts or create a new gift
    """
    if request.method == 'GET':
        try:
            user_gifts = Gift.objects.filter(user=request.user)
            gifts_data = []
            for gift in user_gifts:
                gifts_data.append({
                    'id': gift.id,
                    'name': gift.name,
                    'is_active': gift.is_active,
                    'created_at': gift.created_at,
                    'updated_at': gift.updated_at,
                })

            return Response({
                'gifts': gifts_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            name = request.data.get('name', '').strip()

            if not name:
                return Response({
                    'error': 'Gift name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if gift with same name already exists for this user
            if Gift.objects.filter(user=request.user, name__iexact=name).exists():
                return Response({
                    'error': 'Gift with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new gift
            gift = Gift.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get('is_active', True)
            )

            return Response({
                'message': 'Gift created successfully',
                'gift': {
                    'id': gift.id,
                    'name': gift.name,
                    'is_active': gift.is_active,
                    'created_at': gift.created_at,
                    'updated_at': gift.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def gift_detail(request, gift_id):
    """
    Update or delete a specific gift
    """
    try:
        gift = Gift.objects.get(id=gift_id, user=request.user)
    except Gift.DoesNotExist:
        return Response({
            'error': 'Gift not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        try:
            # Update gift fields
            if 'name' in request.data:
                name = request.data['name'].strip()
                if not name:
                    return Response({
                        'error': 'Gift name cannot be empty'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if another gift with same name exists for this user
                if Gift.objects.filter(
                    user=request.user,
                    name__iexact=name
                ).exclude(id=gift_id).exists():
                    return Response({
                        'error': 'Gift with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)

                gift.name = name

            if 'is_active' in request.data:
                gift.is_active = bool(request.data['is_active'])

            gift.save()

            return Response({
                'message': 'Gift updated successfully',
                'gift': {
                    'id': gift.id,
                    'name': gift.name,
                    'is_active': gift.is_active,
                    'created_at': gift.created_at,
                    'updated_at': gift.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            gift.delete()
            return Response({
                'message': 'Gift deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_gift(request, gift_id):
    """
    Toggle gift active status
    """
    try:
        gift = Gift.objects.get(id=gift_id, user=request.user)
        gift.is_active = not gift.is_active
        gift.save()

        return Response({
            'message': f'Gift {gift.name} {"activated" if gift.is_active else "deactivated"} successfully',
            'gift': {
                'id': gift.id,
                'name': gift.name,
                'is_active': gift.is_active,
                'created_at': gift.created_at,
                'updated_at': gift.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except Gift.DoesNotExist:
        return Response({
            'error': 'Gift not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Achievement Views


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def achievements(request):
    """
    GET: Retrieve all achievements for the authenticated user
    POST: Create a new achievement
    """
    if request.method == 'GET':
        try:
            user_achievements = Achievement.objects.filter(user=request.user)
            achievements_data = [{
                'id': achievement.id,
                'name': achievement.name,
                'type': achievement.type,
                'value': achievement.value,
                'points': achievement.points,
                'is_active': achievement.is_active,
                'created_at': achievement.created_at,
                'updated_at': achievement.updated_at,
            } for achievement in user_achievements]

            return Response({
                'achievements': achievements_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Validate required fields
            required_fields = ['type', 'value', 'points']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Missing required field: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Validate achievement type
            valid_types = ['orders', 'amount']
            if data['type'] not in valid_types:
                return Response({
                    'error': f'Invalid achievement type. Must be one of: {valid_types}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate value and points are positive integers
            try:
                value = int(data['value'])
                points = int(data['points'])
                if value <= 0 or points <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                return Response({
                    'error': 'Value and points must be positive integers'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Generate achievement name if not provided
            achievement_name = data.get('name')
            if not achievement_name:
                if data['type'] == 'orders':
                    achievement_name = f"Complete {value} orders"
                else:
                    achievement_name = f"Spend {value} dollars"

            # Check for duplicate achievement names for this user
            if Achievement.objects.filter(user=request.user, name=achievement_name).exists():
                return Response({
                    'error': 'Achievement with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the achievement
            achievement = Achievement.objects.create(
                user=request.user,
                name=achievement_name,
                type=data['type'],
                value=value,
                points=points,
                is_active=data.get('is_active', True)
            )

            return Response({
                'message': 'Achievement created successfully',
                'achievement': {
                    'id': achievement.id,
                    'name': achievement.name,
                    'type': achievement.type,
                    'value': achievement.value,
                    'points': achievement.points,
                    'is_active': achievement.is_active,
                    'created_at': achievement.created_at,
                    'updated_at': achievement.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({
                'error': 'Achievement with this name already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def achievement_detail(request, achievement_id):
    """
    GET: Retrieve a specific achievement
    PUT: Update a specific achievement
    DELETE: Delete a specific achievement
    """
    try:
        achievement = Achievement.objects.get(
            id=achievement_id, user=request.user)
    except Achievement.DoesNotExist:
        return Response({
            'error': 'Achievement not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'achievement': {
                'id': achievement.id,
                'name': achievement.name,
                'type': achievement.type,
                'value': achievement.value,
                'points': achievement.points,
                'is_active': achievement.is_active,
                'created_at': achievement.created_at,
                'updated_at': achievement.updated_at,
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)

            # Update fields if provided
            if 'name' in data:
                # Check for duplicate names (excluding current achievement)
                if Achievement.objects.filter(
                    user=request.user,
                    name=data['name']
                ).exclude(id=achievement.id).exists():
                    return Response({
                        'error': 'Achievement with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                achievement.name = data['name']

            if 'type' in data:
                valid_types = ['orders', 'amount']
                if data['type'] not in valid_types:
                    return Response({
                        'error': f'Invalid achievement type. Must be one of: {valid_types}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                achievement.type = data['type']

            if 'value' in data:
                try:
                    value = int(data['value'])
                    if value <= 0:
                        raise ValueError()
                    achievement.value = value
                except (ValueError, TypeError):
                    return Response({
                        'error': 'Value must be a positive integer'
                    }, status=status.HTTP_400_BAD_REQUEST)

            if 'points' in data:
                try:
                    points = int(data['points'])
                    if points <= 0:
                        raise ValueError()
                    achievement.points = points
                except (ValueError, TypeError):
                    return Response({
                        'error': 'Points must be a positive integer'
                    }, status=status.HTTP_400_BAD_REQUEST)

            if 'is_active' in data:
                achievement.is_active = bool(data['is_active'])

            achievement.save()

            return Response({
                'message': 'Achievement updated successfully',
                'achievement': {
                    'id': achievement.id,
                    'name': achievement.name,
                    'type': achievement.type,
                    'value': achievement.value,
                    'points': achievement.points,
                    'is_active': achievement.is_active,
                    'created_at': achievement.created_at,
                    'updated_at': achievement.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({
                'error': 'Achievement with this name already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            achievement_name = achievement.name
            achievement.delete()

            return Response({
                'message': f'Achievement "{achievement_name}" deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_achievement(request, achievement_id):
    """
    Toggle achievement active/inactive status
    """
    try:
        achievement = Achievement.objects.get(
            id=achievement_id, user=request.user)

        # Toggle the active status
        achievement.is_active = not achievement.is_active
        achievement.save()

        return Response({
            'message': f'Achievement {achievement.name} {"activated" if achievement.is_active else "deactivated"} successfully',
            'achievement': {
                'id': achievement.id,
                'name': achievement.name,
                'type': achievement.type,
                'value': achievement.value,
                'points': achievement.points,
                'is_active': achievement.is_active,
                'created_at': achievement.created_at,
                'updated_at': achievement.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except Achievement.DoesNotExist:
        return Response({
            'error': 'Achievement not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Level Views


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def levels(request):
    """
    GET: Retrieve all levels for the authenticated user
    POST: Create a new level
    """
    if request.method == 'GET':
        try:
            user_levels = Level.objects.filter(user=request.user)
            levels_data = [{
                'id': level.id,
                'name': level.name,
                'is_active': level.is_active,
                'created_at': level.created_at,
                'updated_at': level.updated_at,
            } for level in user_levels]

            return Response({
                'levels': levels_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Validate required fields
            if 'name' not in data or not data['name'].strip():
                return Response({
                    'error': 'Level name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            level_name = data['name'].strip()

            # Check for duplicate level names for this user
            if Level.objects.filter(user=request.user, name=level_name).exists():
                return Response({
                    'error': 'Level with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the level
            level = Level.objects.create(
                user=request.user,
                name=level_name,
                is_active=data.get('is_active', True)
            )

            return Response({
                'message': 'Level created successfully',
                'level': {
                    'id': level.id,
                    'name': level.name,
                    'is_active': level.is_active,
                    'created_at': level.created_at,
                    'updated_at': level.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({
                'error': 'Level with this name already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
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
        return Response({
            'error': 'Level not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'level': {
                'id': level.id,
                'name': level.name,
                'is_active': level.is_active,
                'created_at': level.created_at,
                'updated_at': level.updated_at,
            }
        }, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)

            # Update fields if provided
            if 'name' in data:
                new_name = data['name'].strip()
                if not new_name:
                    return Response({
                        'error': 'Level name cannot be empty'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check for duplicate names (excluding current level)
                if Level.objects.filter(
                    user=request.user,
                    name=new_name
                ).exclude(id=level.id).exists():
                    return Response({
                        'error': 'Level with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                level.name = new_name

            if 'is_active' in data:
                level.is_active = bool(data['is_active'])

            level.save()

            return Response({
                'message': 'Level updated successfully',
                'level': {
                    'id': level.id,
                    'name': level.name,
                    'is_active': level.is_active,
                    'created_at': level.created_at,
                    'updated_at': level.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({
                'error': 'Level with this name already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            level_name = level.name
            level.delete()

            return Response({
                'message': f'Level "{level_name}" deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
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

        return Response({
            'message': f'Level {level.name} {"activated" if level.is_active else "deactivated"} successfully',
            'level': {
                'id': level.id,
                'name': level.name,
                'is_active': level.is_active,
                'created_at': level.created_at,
                'updated_at': level.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except Level.DoesNotExist:
        return Response({
            'error': 'Level not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@api_view(['POST', 'GET'])
def smsSend(request):
    from subscription.models import UserSMSCredit, SMSSentHistory
    
    data = request.data
    phone = data.get('phone', '').strip()
    message = data.get('message', '').strip()
    
    if not phone or not message:
        return Response({
            'success': False,
            'error': 'Phone number and message are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate SMS count (160 characters per SMS)
    sms_count = max(1, (len(message) + 159) // 160)
    
    # Check if user has sufficient SMS credits
    try:
        user_sms_credit = UserSMSCredit.objects.get(user=request.user)
        if user_sms_credit.credits < sms_count:
            return Response({
                'success': False,
                'error': f'Insufficient SMS credits. You need {sms_count} credits but only have {user_sms_credit.credits}.',
                'required_credits': sms_count,
                'available_credits': user_sms_credit.credits
            }, status=status.HTTP_402_PAYMENT_REQUIRED)
    except UserSMSCredit.DoesNotExist:
        return Response({
            'success': False,
            'error': f'No SMS credits available. You need {sms_count} credits to send this message.',
            'required_credits': sms_count,
            'available_credits': 0
        }, status=status.HTTP_402_PAYMENT_REQUIRED)
    
    url = "http://api.smsinbd.com/sms-api/sendsms"
    payload = {
        'api_token': settings.API_SMS,
        'senderid': '8809617614969',
        'contact_number': phone,
        'message': message,
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
                status='sent',
                sms_count=sms_count
            )
            
            print(f"SMS sent successfully. Deducted {sms_count} credits. Remaining: {user_sms_credit.credits}")
            return Response({
                'success': True,
                'message': 'SMS sent successfully',
                'credits_used': sms_count,
                'remaining_credits': user_sms_credit.credits,
                'response': response.text
            }, status=status.HTTP_200_OK)
        else:
            # Log failed SMS attempt (but don't deduct credits)
            SMSSentHistory.objects.create(
                user=request.user,
                recipient=phone,
                message=message,
                status='failed',
                sms_count=sms_count
            )
            return Response({
                'success': False,
                'error': 'SMS service error',
                'response': response.text
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except requests.exceptions.Timeout:
        print("SMS API request timed out")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status='failed',
            sms_count=sms_count
        )
        return Response({
            'success': False,
            'error': 'SMS service timeout'
        }, status=status.HTTP_408_REQUEST_TIMEOUT)
    except requests.exceptions.ConnectionError:
        print("SMS API connection error")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status='failed',
            sms_count=sms_count
        )
        return Response({
            'success': False,
            'error': 'SMS service unavailable'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except requests.exceptions.RequestException as e:
        print(f"SMS API request failed: {str(e)}")
        SMSSentHistory.objects.create(
            user=request.user,
            recipient=phone,
            message=message,
            status='failed',
            sms_count=sms_count
        )
        return Response({
            'success': False,
            'error': 'SMS service error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Brand Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def brands(request):
    """
    Get all brands or create a new brand
    """
    if request.method == 'GET':
        try:
            user_brands = Brand.objects.filter(user=request.user)
            brands_data = []
            for brand in user_brands:
                brands_data.append({
                    'id': brand.id,
                    'name': brand.name,
                    'is_active': brand.is_active,
                    'created_at': brand.created_at,
                    'updated_at': brand.updated_at,
                })

            return Response({
                'brands': brands_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            name = request.data.get('name', '').strip()

            if not name:
                return Response({
                    'error': 'Brand name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if brand with same name already exists for this user
            if Brand.objects.filter(user=request.user, name__iexact=name).exists():
                return Response({
                    'error': 'Brand with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new brand
            brand = Brand.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get('is_active', True)
            )

            return Response({
                'message': 'Brand created successfully',
                'brand': {
                    'id': brand.id,
                    'name': brand.name,
                    'is_active': brand.is_active,
                    'created_at': brand.created_at,
                    'updated_at': brand.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def brand_detail(request, brand_id):
    """
    Update or delete a specific brand
    """
    try:
        brand = Brand.objects.get(id=brand_id, user=request.user)
    except Brand.DoesNotExist:
        return Response({
            'error': 'Brand not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        try:
            # Update brand fields
            if 'name' in request.data:
                name = request.data['name'].strip()
                if not name:
                    return Response({
                        'error': 'Brand name cannot be empty'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if another brand with same name exists for this user
                if Brand.objects.filter(
                    user=request.user,
                    name__iexact=name
                ).exclude(id=brand_id).exists():
                    return Response({
                        'error': 'Brand with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)

                brand.name = name

            if 'is_active' in request.data:
                brand.is_active = request.data['is_active']

            brand.save()

            return Response({
                'message': 'Brand updated successfully',
                'brand': {
                    'id': brand.id,
                    'name': brand.name,
                    'is_active': brand.is_active,
                    'created_at': brand.created_at,
                    'updated_at': brand.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            brand.delete()
            return Response({
                'message': 'Brand deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_brand(request, brand_id):
    """
    Toggle brand active status
    """
    try:
        brand = Brand.objects.get(id=brand_id, user=request.user)
        brand.is_active = not brand.is_active
        brand.save()

        return Response({
            'message': f'Brand {brand.name} {"activated" if brand.is_active else "deactivated"} successfully',
            'brand': {
                'id': brand.id,
                'name': brand.name,
                'is_active': brand.is_active,
                'created_at': brand.created_at,
                'updated_at': brand.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except Brand.DoesNotExist:
        return Response({
            'error': 'Brand not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Payment Method Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """
    Get all payment methods or create a new payment method
    """
    if request.method == 'GET':
        try:
            user_payment_methods = PaymentMethod.objects.filter(
                user=request.user)
            payment_methods_data = []
            for payment_method in user_payment_methods:
                payment_methods_data.append({
                    'id': payment_method.id,
                    'name': payment_method.name,
                    'is_active': payment_method.is_active,
                    'created_at': payment_method.created_at,
                    'updated_at': payment_method.updated_at,
                })

            return Response({
                'paymentMethods': payment_methods_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            name = request.data.get('name', '').strip()

            if not name:
                return Response({
                    'error': 'Payment method name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if payment method with same name already exists for this user
            if PaymentMethod.objects.filter(user=request.user, name__iexact=name).exists():
                return Response({
                    'error': 'Payment method with this name already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new payment method
            payment_method = PaymentMethod.objects.create(
                name=name,
                user=request.user,
                is_active=request.data.get('is_active', True)
            )

            return Response({
                'message': 'Payment method created successfully',
                'paymentMethod': {
                    'id': payment_method.id,
                    'name': payment_method.name,
                    'is_active': payment_method.is_active,
                    'created_at': payment_method.created_at,
                    'updated_at': payment_method.updated_at,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, payment_method_id):
    """
    Update or delete a specific payment method
    """
    try:
        payment_method = PaymentMethod.objects.get(
            id=payment_method_id, user=request.user)
    except PaymentMethod.DoesNotExist:
        return Response({
            'error': 'Payment method not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        try:
            # Update payment method fields
            if 'name' in request.data:
                name = request.data['name'].strip()
                if not name:
                    return Response({
                        'error': 'Payment method name cannot be empty'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if another payment method with same name exists for this user
                if PaymentMethod.objects.filter(
                    user=request.user,
                    name__iexact=name
                ).exclude(id=payment_method_id).exists():
                    return Response({
                        'error': 'Payment method with this name already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)

                payment_method.name = name

            if 'is_active' in request.data:
                payment_method.is_active = request.data['is_active']

            payment_method.save()

            return Response({
                'message': 'Payment method updated successfully',
                'paymentMethod': {
                    'id': payment_method.id,
                    'name': payment_method.name,
                    'is_active': payment_method.is_active,
                    'created_at': payment_method.created_at,
                    'updated_at': payment_method.updated_at,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            payment_method.delete()
            return Response({
                'message': 'Payment method deleted successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_payment_method(request, payment_method_id):
    """
    Toggle payment method active status
    """
    try:
        payment_method = PaymentMethod.objects.get(
            id=payment_method_id, user=request.user)
        payment_method.is_active = not payment_method.is_active
        payment_method.save()

        return Response({
            'message': f'Payment method {payment_method.name} {"activated" if payment_method.is_active else "deactivated"} successfully',
            'paymentMethod': {
                'id': payment_method.id,
                'name': payment_method.name,
                'is_active': payment_method.is_active,
                'created_at': payment_method.created_at,
                'updated_at': payment_method.updated_at,
            }
        }, status=status.HTTP_200_OK)

    except PaymentMethod.DoesNotExist:
        return Response({
            'error': 'Payment method not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
