from products.models import Product, ProductVariant
from core.models import Gift, Achievement, Level
from customers.models import Customer, Order, OrderItem, CustomerGift, CustomerAchievement, CustomerLevel, DuePayment, Transaction
from django.contrib.auth.models import User
import random
import django
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

# Add current directory to path
sys.path.insert(0, '.')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now import Django models after setup


def create_sample_data():
    # Get or create a user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created user: {user.username}")
    else:
        print(f"Using existing user: {user.username}")

    # Create gifts if they don't exist
    gift_names = ['Welcome Bonus', 'Loyalty Reward',
                  'Discount Voucher 10%', 'Free Shipping', 'Bonus Points']
    for gift_name in gift_names:
        gift, created = Gift.objects.get_or_create(
            name=gift_name,
            user=user,
            defaults={'is_active': True}
        )
        if created:
            print(f"Created gift: {gift.name}")

    # Create achievements if they don't exist
    achievements_data = [
        ('First Purchase', 'orders', 1, 100),
        ('Loyal Customer', 'orders', 10, 500),
        ('Big Spender', 'amount', 1000, 300),
        ('VIP Customer', 'amount', 5000, 1000),
    ]

    for name, type_val, value, points in achievements_data:
        achievement, created = Achievement.objects.get_or_create(
            name=name,
            user=user,
            defaults={
                'type': type_val,
                'value': value,
                'points': points,
                'is_active': True
            }
        )
        if created:
            print(f"Created achievement: {achievement.name}")

    # Create levels if they don't exist
    level_names = ['Bronze', 'Silver', 'Gold', 'Platinum']
    for level_name in level_names:
        level, created = Level.objects.get_or_create(
            name=level_name,
            user=user,
            defaults={'is_active': True}
        )
        if created:
            print(f"Created level: {level.name}")

    # Create sample customers
    customers_data = [
        {
            'name': 'John Doe',
            'email': 'john.doe@email.com',
            'phone': '+1234567890',
            'address': '123 Main St, City, State 12345'
        },
        {
            'name': 'Jane Smith',
            'email': 'jane.smith@email.com',
            'phone': '+1234567891',
            'address': '456 Oak Ave, City, State 12346'
        },
        {
            'name': 'Bob Johnson',
            'email': 'bob.johnson@email.com',
            'phone': '+1234567892',
            'address': '789 Pine Rd, City, State 12347'
        }
    ]

    for customer_data in customers_data:
        customer, created = Customer.objects.get_or_create(
            email=customer_data['email'],
            user=user,
            defaults={
                'name': customer_data['name'],
                'phone': customer_data['phone'],
                'address': customer_data['address'],
                'status': 'active'
            }
        )
        if created:
            print(f"Created customer: {customer.name}")

            # Create sample orders for each customer
            for i in range(random.randint(1, 5)):
                order = Order.objects.create(
                    customer=customer,
                    status=random.choice(['completed', 'pending']),
                    total_amount=Decimal(str(random.uniform(50, 500))),
                    paid_amount=Decimal(str(random.uniform(0, 500))),
                    user=user
                )
                print(f"Created order: {order.order_number}")

                # Create due payments for some orders
                if random.choice([True, False]):
                    due_amount = order.total_amount - order.paid_amount
                    if due_amount > 0:
                        DuePayment.objects.create(
                            customer=customer,
                            order=order,
                            amount=due_amount,
                            payment_type='due',
                            due_date=date.today() + timedelta(days=random.randint(1, 30)),
                            user=user
                        )
                        print(
                            f"Created due payment for order: {order.order_number}")

            # Assign gifts to customers
            gifts = Gift.objects.filter(user=user)[:2]
            for gift in gifts:
                CustomerGift.objects.create(
                    customer=customer,
                    gift=gift,
                    value=Decimal(str(random.uniform(5, 50))),
                    status=random.choice(['active', 'used']),
                    user=user
                )
                print(f"Assigned gift {gift.name} to {customer.name}")

            # Assign achievements to customers
            achievements = Achievement.objects.filter(user=user)[:2]
            for achievement in achievements:
                CustomerAchievement.objects.create(
                    customer=customer,
                    achievement=achievement,
                    user=user
                )
                print(
                    f"Assigned achievement {achievement.name} to {customer.name}")

            # Assign level to customer
            levels = Level.objects.filter(user=user)
            if levels:
                level = random.choice(levels)
                CustomerLevel.objects.create(
                    customer=customer,
                    level=level,
                    is_current=True,
                    notes=f"Assigned {level.name} level based on activity",
                    assigned_by=user
                )
                print(f"Assigned level {level.name} to {customer.name}")

            # Create due payments for customers
            customer_orders = customer.orders.all()
            if customer_orders:
                # Create some due payments based on orders
                due_payment_count = random.randint(1, 3)
                for _ in range(due_payment_count):
                    order = random.choice(customer_orders)
                    payment_type = random.choice(['due', 'advance'])

                    # Generate amount
                    if payment_type == 'due':
                        amount = Decimal(str(random.uniform(50, 500)))
                    else:  # advance
                        amount = Decimal(str(random.uniform(20, 200)))

                    # Generate due date (some overdue, some future)
                    days_offset = random.randint(-30, 60)  # -30 to +60 days
                    due_date = date.today() + timedelta(days=days_offset)

                    DuePayment.objects.create(
                        customer=customer,
                        order=order,
                        amount=amount,
                        payment_type=payment_type,
                        due_date=due_date,
                        status='pending',
                        notes=f"Sample {payment_type} payment for order #{order.order_number}",
                        user=user
                    )
                    print(
                        f"Created {payment_type} payment of ${amount} for {customer.name}")

            # Also create some due payments without orders (manual entries)
            standalone_payments = random.randint(0, 2)
            for _ in range(standalone_payments):
                payment_type = random.choice(['due', 'advance'])
                amount = Decimal(str(random.uniform(25, 300)))
                days_offset = random.randint(-15, 45)
                due_date = date.today() + timedelta(days=days_offset)

                DuePayment.objects.create(
                    customer=customer,
                    amount=amount,
                    payment_type=payment_type,
                    due_date=due_date,
                    status='pending',
                    notes=f"Manual {payment_type} payment entry",
                    user=user
                )
                print(
                    f"Created standalone {payment_type} payment of ${amount} for {customer.name}")


if __name__ == '__main__':
    create_sample_data()
    print("Sample data creation completed!")
