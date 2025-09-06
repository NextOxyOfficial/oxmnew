#!/usr/bin/env python
"""
Simple script to add 30 dummy products to a user account
"""

import os
import sys
import django
from decimal import Decimal
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from products.models import Product, ProductVariant
from core.models import Category
from suppliers.models import Supplier

def create_dummy_products(email):
    try:
        user = User.objects.get(email=email)
        print(f"Creating products for user: {user.username} ({email})")
    except User.DoesNotExist:
        print(f"User with email {email} not found!")
        return

    # Create default category if none exists
    category, created = Category.objects.get_or_create(
        name="General",
        user=user,
        defaults={'description': 'General products'}
    )
    if created:
        print("Created default category: General")

    # Create default supplier if none exists
    supplier, created = Supplier.objects.get_or_create(
        name="Default Supplier",
        user=user,
        defaults={
            'phone': '123-456-7890',
            'email': 'supplier@example.com',
            'contact_person': 'John Doe'
        }
    )
    if created:
        print("Created default supplier: Default Supplier")

    # Product templates - expanded to 50 products
    products_data = [
        "Wireless Headphones",
        "Smart LED Bulb", 
        "Cotton T-Shirt",
        "Denim Jeans",
        "Office Chair",
        "Laptop Stand",
        "Yoga Mat",
        "Water Bottle",
        "Face Cream",
        "Shampoo",
        "Novel Book",
        "Cooking Pot",
        "Garden Hose",
        "Toy Robot",
        "Building Blocks",
        "Car Air Freshener",
        "Engine Oil",
        "Vitamin Tablets",
        "Hand Sanitizer",
        "Notebook",
        "Wireless Mouse",
        "Phone Case",
        "Sunglasses",
        "Running Shoes",
        "Coffee Mug",
        "Table Lamp",
        "Lip Balm",
        "Puzzle Game",
        "Phone Mount",
        "Protein Powder",
        "Bluetooth Speaker",
        "Smart Watch",
        "Gaming Keyboard",
        "Desk Organizer",
        "Plant Pot",
        "Moisturizer",
        "Hair Conditioner",
        "Cookbook",
        "Frying Pan",
        "Garden Gloves",
        "Remote Control Car",
        "Lego Set",
        "Car Phone Charger",
        "Brake Fluid",
        "Calcium Supplements",
        "Face Mask",
        "Sticky Notes",
        "Wireless Charger",
        "Screen Protector",
        "Baseball Cap"
    ]

    created_count = 0
    for i, name in enumerate(products_data):
        try:
            # Generate random prices and stock
            buy_price = Decimal(str(round(random.uniform(5.00, 100.00), 2)))
            sell_price = Decimal(str(round(float(buy_price) * random.uniform(1.3, 2.0), 2)))
            stock = random.randint(1, 100)
            
            product = Product.objects.create(
                name=f"{name} - Premium",
                product_code=f"PROD{str(i+1).zfill(3)}",
                category=category,
                supplier=supplier,
                location=f"Shelf {chr(65 + (i % 5))}{random.randint(1, 9)}",
                details=f"High-quality {name.lower()} for everyday use.",
                has_variants=False,
                buy_price=buy_price,
                sell_price=sell_price,
                stock=stock,
                user=user,
                is_active=True
            )
            
            created_count += 1
            print(f"✓ Created product {created_count}: {product.name}")
            
        except Exception as e:
            print(f"✗ Error creating {name}: {str(e)}")
            continue

    print(f"\n🎉 Successfully created {created_count} dummy products!")
    
    # Verify creation
    total_products = Product.objects.filter(user=user).count()
    print(f"Total products in account: {total_products}")

if __name__ == "__main__":
    create_dummy_products("johndd44@gmail.com")
