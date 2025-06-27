#!/usr/bin/env python
"""
Quick test script to verify the Django setup is working correctly.
Run this from the backend directory.
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    
    print("✅ Django setup successful!")
    print(f"✅ Database: {settings.DATABASES['default']['NAME']}")
    print(f"✅ Debug mode: {settings.DEBUG}")
    print(f"✅ Allowed hosts: {settings.ALLOWED_HOSTS}")
    
    # Test imports
    try:
        from core.views import api_root, health_check, register, login, logout, profile
        print("✅ All authentication views imported successfully!")
    except ImportError as e:
        print(f"❌ Import error: {e}")
    
    try:
        from rest_framework.authtoken.models import Token
        print("✅ Token authentication model available!")
    except ImportError as e:
        print(f"❌ Token model import error: {e}")
    
    print("\n🚀 Your Django backend is ready!")
    print("Run: python manage.py runserver")
