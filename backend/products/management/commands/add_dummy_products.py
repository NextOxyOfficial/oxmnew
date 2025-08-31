import random
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from products.models import Product, ProductVariant
from core.models import Category
from suppliers.models import Supplier


class Command(BaseCommand):
    help = 'Add 30 dummy products to a specified user account'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='User email address', required=True)

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'User with email "{email}" does not exist.')

        self.stdout.write(f'Adding dummy products for user: {user.username} ({email})')

        # Create some categories if they don't exist
        categories_data = [
            'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books',
            'Toys', 'Beauty', 'Automotive', 'Health', 'Office Supplies'
        ]
        
        categories = []
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                user=user,
                defaults={'description': f'{cat_name} products'}
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {cat_name}')

        # Create some suppliers if they don't exist
        suppliers_data = [
            {'name': 'TechCorp Supplies', 'phone': '123-456-7890', 'email': 'contact@techcorp.com'},
            {'name': 'Global Electronics', 'phone': '123-456-7891', 'email': 'info@globalelectronics.com'},
            {'name': 'Fashion Hub', 'phone': '123-456-7892', 'email': 'sales@fashionhub.com'},
            {'name': 'Home Essentials', 'phone': '123-456-7893', 'email': 'orders@homeessentials.com'},
            {'name': 'Sports Unlimited', 'phone': '123-456-7894', 'email': 'support@sportsunlimited.com'},
        ]
        
        suppliers = []
        for supplier_data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                name=supplier_data['name'],
                user=user,
                defaults=supplier_data
            )
            suppliers.append(supplier)
            if created:
                self.stdout.write(f'Created supplier: {supplier_data["name"]}')

        # Dummy product data
        product_templates = [
            {'name': 'Wireless Bluetooth Headphones', 'category': 'Electronics', 'has_variants': True},
            {'name': 'Smart LED Light Bulb', 'category': 'Electronics', 'has_variants': False},
            {'name': 'Cotton T-Shirt', 'category': 'Clothing', 'has_variants': True},
            {'name': 'Denim Jeans', 'category': 'Clothing', 'has_variants': True},
            {'name': 'Office Chair', 'category': 'Office Supplies', 'has_variants': False},
            {'name': 'Laptop Stand', 'category': 'Office Supplies', 'has_variants': False},
            {'name': 'Yoga Mat', 'category': 'Sports', 'has_variants': True},
            {'name': 'Water Bottle', 'category': 'Sports', 'has_variants': False},
            {'name': 'Face Cream', 'category': 'Beauty', 'has_variants': False},
            {'name': 'Shampoo', 'category': 'Beauty', 'has_variants': True},
            {'name': 'Novel Book', 'category': 'Books', 'has_variants': False},
            {'name': 'Cooking Pot', 'category': 'Home & Garden', 'has_variants': True},
            {'name': 'Garden Hose', 'category': 'Home & Garden', 'has_variants': False},
            {'name': 'Toy Robot', 'category': 'Toys', 'has_variants': False},
            {'name': 'Building Blocks', 'category': 'Toys', 'has_variants': True},
            {'name': 'Car Air Freshener', 'category': 'Automotive', 'has_variants': True},
            {'name': 'Engine Oil', 'category': 'Automotive', 'has_variants': False},
            {'name': 'Vitamin C Tablets', 'category': 'Health', 'has_variants': False},
            {'name': 'Hand Sanitizer', 'category': 'Health', 'has_variants': True},
            {'name': 'Notebook', 'category': 'Office Supplies', 'has_variants': True},
            {'name': 'Wireless Mouse', 'category': 'Electronics', 'has_variants': False},
            {'name': 'Phone Case', 'category': 'Electronics', 'has_variants': True},
            {'name': 'Sunglasses', 'category': 'Clothing', 'has_variants': True},
            {'name': 'Running Shoes', 'category': 'Sports', 'has_variants': True},
            {'name': 'Coffee Mug', 'category': 'Home & Garden', 'has_variants': True},
            {'name': 'Table Lamp', 'category': 'Home & Garden', 'has_variants': False},
            {'name': 'Lip Balm', 'category': 'Beauty', 'has_variants': True},
            {'name': 'Puzzle Game', 'category': 'Toys', 'has_variants': False},
            {'name': 'Car Phone Mount', 'category': 'Automotive', 'has_variants': False},
            {'name': 'Protein Powder', 'category': 'Health', 'has_variants': True},
        ]

        # Colors and sizes for variants
        colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray']
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', '32', '34', '36', '38', '40']

        created_count = 0
        for i, template in enumerate(product_templates[:30]):  # Limit to 30 products
            # Find category
            category = next((cat for cat in categories if cat.name == template['category']), categories[0])
            
            # Random supplier
            supplier = random.choice(suppliers)
            
            # Generate prices
            buy_price = Decimal(str(round(random.uniform(10.00, 200.00), 2)))
            sell_price = Decimal(str(round(float(buy_price) * random.uniform(1.2, 2.5), 2)))
            stock = random.randint(0, 100)
            
            # Create product
            product_code = f"P{str(i+1).zfill(4)}"
            product_name = f"{template['name']} - {random.choice(['Premium', 'Standard', 'Basic', 'Pro', 'Elite'])}"
            
            try:
                product = Product.objects.create(
                    name=product_name,
                    product_code=product_code,
                    category=category,
                    supplier=supplier,
                    location=f"Shelf {chr(65 + (i % 26))}{random.randint(1, 10)}",
                    details=f"High-quality {template['name'].lower()}. Perfect for daily use.",
                    has_variants=template['has_variants'],
                    buy_price=buy_price if not template['has_variants'] else Decimal('0.00'),
                    sell_price=sell_price if not template['has_variants'] else Decimal('0.00'),
                    stock=stock if not template['has_variants'] else 0,
                    user=user,
                    is_active=True
                )
                
                # Create variants if needed
                if template['has_variants']:
                    variant_count = random.randint(2, 4)
                    for v in range(variant_count):
                        color = random.choice(colors)
                        size = random.choice(sizes)
                        variant_buy_price = Decimal(str(round(random.uniform(10.00, 200.00), 2)))
                        variant_sell_price = Decimal(str(round(float(variant_buy_price) * random.uniform(1.2, 2.5), 2)))
                        variant_stock = random.randint(0, 50)
                        
                        try:
                            ProductVariant.objects.create(
                                product=product,
                                color=color,
                                size=size,
                                buy_price=variant_buy_price,
                                sell_price=variant_sell_price,
                                stock=variant_stock,
                                custom_variant=f"Variant {v+1}" if random.choice([True, False]) else None
                            )
                        except Exception as e:
                            # Skip duplicate variants
                            pass
                
                created_count += 1
                self.stdout.write(f'Created product {created_count}: {product_name}')
                
            except Exception as e:
                self.stdout.write(f'Error creating product {product_name}: {str(e)}')
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} dummy products for user {user.username} ({email})'
            )
        )
