from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from banking.models import BankAccount


class Command(BaseCommand):
    help = 'Create Primary bank accounts for all users who do not have one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating accounts',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE: No accounts will be created')
            )
        
        users_without_primary = []
        
        # Get all active users
        users = User.objects.filter(is_active=True)
        
        for user in users:
            # Check if user has a Primary account
            if not BankAccount.objects.filter(owner=user, name="Primary").exists():
                users_without_primary.append(user)
        
        if not users_without_primary:
            self.stdout.write(
                self.style.SUCCESS('All users already have Primary accounts!')
            )
            return
        
        self.stdout.write(
            f'Found {len(users_without_primary)} users without Primary accounts:'
        )
        
        for user in users_without_primary:
            user_display = f"{user.get_full_name()} ({user.username})" if user.get_full_name() else user.username
            self.stdout.write(f'  - {user_display}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'Would create {len(users_without_primary)} Primary accounts')
            )
            return
        
        # Create Primary accounts
        created_count = 0
        for user in users_without_primary:
            try:
                account = BankAccount.objects.create(
                    name="Primary",
                    owner=user,
                    balance=0.00,
                    is_active=True
                )
                user_display = f"{user.get_full_name()} ({user.username})" if user.get_full_name() else user.username
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created Primary account for {user_display}')
                )
                created_count += 1
            except Exception as e:
                user_display = f"{user.get_full_name()} ({user.username})" if user.get_full_name() else user.username
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create Primary account for {user_display}: {e}')
                )
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} Primary accounts!'
            )
        )
