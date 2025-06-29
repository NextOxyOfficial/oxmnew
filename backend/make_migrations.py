from django.core.management import execute_from_command_line
import django
import sys
import os

# Add current directory to path
sys.path.insert(0, '.')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()


if __name__ == '__main__':
    execute_from_command_line(['manage.py', 'makemigrations', 'customers'])
