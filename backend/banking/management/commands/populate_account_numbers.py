"""
Django management command to populate account numbers for existing bank accounts
"""
from django.core.management.base import BaseCommand
from banking.models import BankAccount
import random

class Command(BaseCommand):
    help = 'Populate account numbers for existing bank accounts that don\'t have them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regenerate account numbers for all accounts (even those with existing numbers)',
        )

    def generate_account_number(self):
        """Generate a unique 10-digit account number"""
        while True:
            account_number = str(random.randint(1000000000, 9999999999))
            if not BankAccount.objects.filter(account_number=account_number).exists():
                return account_number

    def handle(self, *args, **options):
        force = options['force']
        
        if force:
            accounts_to_update = BankAccount.objects.all()
            self.stdout.write(
                self.style.WARNING(f"Found {accounts_to_update.count()} accounts (FORCE MODE - updating all)")
            )
        else:
            accounts_to_update = BankAccount.objects.filter(account_number__isnull=True)
            self.stdout.write(
                self.style.SUCCESS(f"Found {accounts_to_update.count()} accounts without account numbers")
            )
        
        if accounts_to_update.count() == 0:
            self.stdout.write(
                self.style.SUCCESS("No accounts need account number updates!")
            )
            return
        
        updated_count = 0
        for account in accounts_to_update:
            old_number = account.account_number
            account_number = self.generate_account_number()
            account.account_number = account_number
            account.save()
            
            if old_number:
                self.stdout.write(
                    f"Updated account '{account.name}' from {old_number} to {account_number}"
                )
            else:
                self.stdout.write(
                    f"Updated account '{account.name}' with new account number: {account_number}"
                )
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully updated {updated_count} account(s)!")
        )
