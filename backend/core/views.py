from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.db import IntegrityError
from .models import UserProfile, Category
import json

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
