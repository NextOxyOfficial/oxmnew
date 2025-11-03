"""
Management command to ensure all users have a Main bank account
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from banking.models import BankAccount


class Command(BaseCommand):
    help = 'Ensure all users have a Main bank account'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to ensure all users have Main accounts...'))
        
        users = User.objects.all()
        created_count = 0
        existing_count = 0
        
        for user in users:
            # Check if user has a Main account
            main_account = BankAccount.objects.filter(owner=user, name="Main").first()
            
            if not main_account:
                # Create Main account for this user
                BankAccount.objects.create(
                    name="Main",
                    owner=user,
                    balance=0.00,
                    is_active=True
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created Main account for user: {user.username}')
                )
            else:
                existing_count += 1
                self.stdout.write(
                    self.style.WARNING(f'- User {user.username} already has Main account (ID: {main_account.id})')
                )
        
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(self.style.SUCCESS(f'Total users: {users.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Main accounts created: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'Main accounts already existed: {existing_count}'))
        self.stdout.write(self.style.SUCCESS('\nAll users now have Main accounts!'))
