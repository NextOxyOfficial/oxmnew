"""Seed employees, salaries and running expenses so the analytics screen has
something real to reason about.

Everything created is tagged so `--undo` removes exactly this and nothing the
user entered themselves.
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from banking.models import BankAccount, Transaction
from employees.models import Employee, SalaryRecord

MARKER = "[demo-seed]"
# Employee has no notes field, so demo staff are tagged by their id prefix.
EMPLOYEE_PREFIX = "DEMO-"

STAFF = [
    ("রফিকুল ইসলাম", "ম্যানেজার", 15000),
    ("সাইফুল হক", "সেলস এক্সিকিউটিভ", 14000),
    ("নাজমুল হাসান", "মেকানিক", 13500),
    ("তানভীর আহমেদ", "সেলস এক্সিকিউটিভ", 13000),
    ("মিজানুর রহমান", "স্টোর কিপার", 12500),
    ("সোহেল রানা", "মেকানিক", 12000),
    ("জাহিদ হোসেন", "ডেলিভারি ম্যান", 11500),
    ("কামরুল ইসলাম", "হেল্পার", 11000),
    ("রাশেদ খান", "হেল্পার", 10500),
    ("আরিফুল ইসলাম", "ক্লিনার", 10000),
]

# (purpose, category, amount, days_ago)
EXPENSES = [
    ("দোকান ভাড়া", "rent", 35000, 5),
    ("বিদ্যুৎ বিল", "utilities", 8400, 4),
    ("ইন্টারনেট বিল", "internet", 2200, 4),
    ("পানির বিল", "utilities", 900, 3),
    ("ডেলিভারি ভ্যানের তেল", "transport", 6500, 3),
    ("ফেসবুক বুস্টিং", "marketing", 5000, 2),
    ("দোকানের টুকিটাকি", "supplies", 1800, 2),
    ("সাইনবোর্ড মেরামত", "maintenance", 3200, 1),
    ("ট্রেড লাইসেন্স নবায়ন", "tax", 4500, 1),
    ("চা-নাশতা", "supplies", 1200, 0),
]

# Bills settled rather than money burnt — these show as পেমেন্ট, not খরচ.
PAYMENTS = [
    ("সাপ্লায়ার বিল পরিশোধ", "supplies", 45000, 4),
    ("আগের মাসের ভাড়া বকেয়া", "rent", 12000, 2),
]

MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


class Command(BaseCommand):
    help = "Create (or remove) demo employees, salaries and expenses."

    def add_arguments(self, parser):
        parser.add_argument("--user", required=True)
        parser.add_argument("--undo", action="store_true")

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options["user"])
        except User.DoesNotExist:
            raise CommandError("No user named %r" % options["user"])
        return self._undo(user) if options["undo"] else self._seed(user)

    def _undo(self, user):
        employees = Employee.objects.filter(
            user=user, employee_id__startswith=EMPLOYEE_PREFIX
        )
        salaries = SalaryRecord.objects.filter(employee__in=employees)
        txns = Transaction.objects.filter(
            account__owner=user, purpose__endswith=MARKER
        )
        counts = (employees.count(), salaries.count(), txns.count())
        salaries.delete()
        employees.delete()
        txns.delete()
        self.stdout.write(
            self.style.SUCCESS(
                "Removed %d employees, %d salary records, %d transactions." % counts
            )
        )

    @transaction.atomic
    def _seed(self, user):
        if Employee.objects.filter(
            user=user, employee_id__startswith=EMPLOYEE_PREFIX
        ).exists():
            raise CommandError("Demo cost data already exists. Run with --undo first.")

        account = BankAccount.objects.filter(owner=user, is_active=True).first()
        if account is None:
            raise CommandError(
                "This user has no bank account — create one before seeding expenses."
            )

        today = timezone.localdate()
        rng = random.Random(20260807)  # fixed seed so re-runs look the same

        made = []
        for index, (name, role, salary) in enumerate(STAFF):
            employee = Employee.objects.create(
                user=user,
                employee_id="%s%02d" % (EMPLOYEE_PREFIX, index + 1),
                name=name,
                email="demo.staff%02d@example.com" % (index + 1),
                phone="0171000%04d" % (1000 + index),
                role=role,
                department="অপারেশন" if index % 2 == 0 else "সেলস",
                salary=Decimal(salary),
                hiring_date=today - timedelta(days=200 + index * 17),
                status="active",
            )
            made.append((employee, salary))

        # Salary paid on the 1st, so it lands inside "this month".
        pay_day = today.replace(day=1)
        for employee, salary in made:
            bonus = Decimal(rng.choice([0, 0, 500, 1000]))
            record = SalaryRecord.objects.create(
                employee=employee,
                month=MONTHS[pay_day.month - 1],
                year=pay_day.year,
                base_salary=Decimal(salary),
                bonuses=bonus,
                deductions=Decimal(0),
                net_salary=Decimal(salary) + bonus,
                status="paid",
            )
            # payment_date is auto_now_add, so it has to be corrected after the
            # insert or every salary would land on today's date.
            SalaryRecord.objects.filter(pk=record.pk).update(
                payment_date=timezone.make_aware(
                    timezone.datetime.combine(pay_day, timezone.datetime.min.time())
                )
            )

        created_txns = 0
        for purpose, category, amount, days_ago in EXPENSES:
            self._spend(user, account, purpose, "expense", category, amount, days_ago)
            created_txns += 1
        for purpose, category, amount, days_ago in PAYMENTS:
            self._spend(user, account, purpose, "payment", category, amount, days_ago)
            created_txns += 1

        total_salary = sum(s for _, s in made)
        self.stdout.write(
            self.style.SUCCESS(
                "Created %d employees (salary %s/month), %d transactions."
                % (len(made), f"{total_salary:,}", created_txns)
            )
        )

    def _spend(self, user, account, purpose, nature, category, amount, days_ago):
        txn = Transaction.objects.create(
            account=account,
            type="debit",
            nature=nature,
            category=category,
            amount=Decimal(amount),
            purpose="%s %s" % (purpose, MARKER),
            status="verified",
        )
        # `date` is auto_now_add; spread the rows across the week so the
        # day-by-day target table has something to show.
        Transaction.objects.filter(pk=txn.pk).update(
            date=timezone.now() - timedelta(days=days_ago)
        )
