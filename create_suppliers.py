from django.contrib.auth.models import User
from suppliers.models import Supplier
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, r'c:\project\oxymanager-new\backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()


def create_sample_suppliers():
    # Get the first user (or create one if needed)
    try:
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                'admin', 'admin@example.com', 'admin123')
            print('Created user:', user.username)
        else:
            print('Using existing user:', user.username)

        # Sample suppliers data
        suppliers_data = [
            {
                'name': 'TechSupply Corp',
                'address': '123 Tech Street, Silicon Valley, CA 94043',
                'phone': '+1-555-0123',
                'email': 'contact@techsupply.com',
                'website': 'https://www.techsupply.com',
                'contact_person': 'John Smith',
                'notes': 'Primary electronics supplier with excellent quality products'
            },
            {
                'name': 'Global Electronics Ltd',
                'address': '456 Electronics Ave, New York, NY 10001',
                'phone': '+1-555-0456',
                'email': 'sales@globalelectronics.com',
                'website': 'https://www.globalelectronics.com',
                'contact_person': 'Sarah Johnson',
                'notes': 'Competitive pricing for bulk orders'
            },
            {
                'name': 'Premium Parts Inc',
                'address': '789 Industrial Blvd, Chicago, IL 60601',
                'phone': '+1-555-0789',
                'email': 'info@premiumparts.com',
                'website': 'https://www.premiumparts.com',
                'contact_person': 'Mike Wilson',
                'notes': 'Specialized in high-end components'
            },
            {
                'name': 'Budget Components Co',
                'address': '321 Budget Road, Austin, TX 73301',
                'phone': '+1-555-0321',
                'email': 'orders@budgetcomponents.com',
                'contact_person': 'Lisa Brown',
                'notes': 'Cost-effective solutions for standard components'
            },
            {
                'name': 'Express Supply Chain',
                'address': '654 Fast Lane, Seattle, WA 98101',
                'phone': '+1-555-0654',
                'email': 'express@supplychainfast.com',
                'website': 'https://www.expresssupplychain.com',
                'contact_person': 'David Lee',
                'notes': 'Fast delivery and reliable service'
            }
        ]

        # Create suppliers
        created_count = 0
        for supplier_data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                name=supplier_data['name'],
                user=user,
                defaults=supplier_data
            )
            if created:
                created_count += 1
                print(f'Created supplier: {supplier.name}')
            else:
                print(f'Supplier already exists: {supplier.name}')

        print(f'Total suppliers created: {created_count}')
        print(f'Total suppliers in database: {Supplier.objects.count()}')

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    create_sample_suppliers()
