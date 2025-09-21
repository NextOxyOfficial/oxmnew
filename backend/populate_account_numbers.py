"""
Script to populate account numbers for existing bank accounts
"""
import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from banking.models import BankAccount

def generate_account_number():
    """Generate a unique 10-digit account number"""
    while True:
        account_number = str(random.randint(1000000000, 9999999999))
        if not BankAccount.objects.filter(account_number=account_number).exists():
            return account_number

def populate_account_numbers():
    """Populate account numbers for accounts that don't have them"""
    accounts_without_numbers = BankAccount.objects.filter(account_number__isnull=True)
    
    print(f"Found {accounts_without_numbers.count()} accounts without account numbers")
    
    for account in accounts_without_numbers:
        account_number = generate_account_number()
        account.account_number = account_number
        account.save()
        print(f"Updated account '{account.name}' with account number: {account_number}")
    
    print("Account number population completed!")

if __name__ == "__main__":
    populate_account_numbers()
