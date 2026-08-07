from core.uploads import validate_document

from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum
from django.utils import timezone

from employees.models import Employee


class BankAccount(models.Model):
    name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=10, unique=True, null=True, blank=True, help_text="10-digit unique account number")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_accounts",
        help_text="The user who owns this account",
    )
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    activation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_activated = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - ${self.balance} (Owner: {self.owner.username})"

    def update_balance(self, amount, transaction_type):
        """Update account balance based on transaction type"""
        if transaction_type == "credit":
            self.balance += Decimal(str(amount))
        elif transaction_type == "debit":
            self.balance -= Decimal(str(amount))
        self.save()


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ("credit", "Credit"),
        ("debit", "Debit"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("cancelled", "Cancelled"),
    )

    # `type` says which way the money moved; `nature` says what it *was*.
    # Both an operating expense and a payment to a supplier are debits, but the
    # monthly cost report has to list them apart — one is money burnt, the other
    # settles a bill that was already owed.
    # Only `expense` and `payment` are business costs. Deposits and
    # withdrawals move the shop's own money and stay out of the cost report.
    NATURE_CHOICES = (
        ("expense", "Expense"),
        ("payment", "Payment"),
        ("income", "Income"),
        ("withdrawal", "Withdrawal"),
        ("other", "Other"),
    )

    # Groups debits for the cost breakdown. Kept short on purpose: a shopkeeper
    # will not maintain a fifty-line chart of accounts.
    CATEGORY_CHOICES = (
        ("rent", "Rent"),
        ("utilities", "Utilities"),
        ("internet", "Internet / Phone"),
        ("salary", "Salary"),
        ("transport", "Transport"),
        ("marketing", "Marketing"),
        ("supplies", "Supplies"),
        ("maintenance", "Maintenance"),
        ("tax", "Tax / Fees"),
        ("other", "Other"),
    )

    account = models.ForeignKey(
        BankAccount, on_delete=models.CASCADE, related_name="transactions"
    )
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    nature = models.CharField(
        max_length=20,
        choices=NATURE_CHOICES,
        blank=True,
        default="",
        help_text="What this money was for. Blank on rows created before this existed.",
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text=(
            "Cost bucket for the monthly expense report. Free text rather than a "
            "fixed choice list — CATEGORY_CHOICES are only the suggestions the UI "
            "offers, and a shop can name its own."
        ),
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    purpose = models.CharField(max_length=255)
    verified_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_transactions",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="verified")
    date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reference_number = models.CharField(max_length=50, unique=True, blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.type.title()} - ${self.amount} - {self.account.name}"

    def save(self, *args, **kwargs):
        # Generate reference number if not provided
        if not self.reference_number:
            import uuid

            self.reference_number = f"TXN-{str(uuid.uuid4())[:8].upper()}"

        # Check if this is a new transaction or status is changing to verified
        is_new = self.pk is None
        old_status = None

        if not is_new:
            # Get the old status before saving
            try:
                old_instance = Transaction.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Transaction.DoesNotExist:
                old_status = None

        super().save(*args, **kwargs)

        # Update account balance for new verified transactions or when status changes to verified
        if self.status == "verified" and (
            is_new or (old_status and old_status != "verified")
        ):
            self.account.update_balance(self.amount, self.type)


class BankingPlan(models.Model):
    """Banking account plans (monthly/yearly)"""

    PERIOD_CHOICES = [
        ("monthly", "Monthly"),
        ("yearly", "Yearly"),
    ]

    name = models.CharField(max_length=50)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    description = models.TextField(blank=True)
    features = models.JSONField(default=list)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("name", "period")
        ordering = ["price"]

    def __str__(self):
        return f"{self.name} - {self.get_period_display()}"


class UserBankingPlan(models.Model):
    """Track user banking plan subscriptions"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(BankingPlan, on_delete=models.CASCADE)
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE)

    activated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Payment tracking
    payment_order_id = models.CharField(max_length=200, blank=True)
    payment_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    payment_status = models.CharField(max_length=50, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.plan} - {self.account.name}"

    def is_plan_active(self):
        """Check if the plan is currently active"""
        if not self.is_active:
            return False

        if self.expires_at:
            from django.utils import timezone

            return timezone.now() <= self.expires_at

        return True


class Loan(models.Model):
    """A loan the shop is repaying.

    Installments are the part that matters for planning: a fixed sum leaves the
    business every month whether or not anything sold, so analytics has to count
    it as a running cost when working out the daily break-even target.

    The schedule is stored as a rule (amount + day of month + count) rather than
    as generated rows, so changing the tenure does not orphan a table of dates.
    """

    STATUS_CHOICES = (
        ("active", "Active"),
        ("closed", "Closed"),
        ("defaulted", "Defaulted"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="loans")
    account = models.ForeignKey(
        BankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loans",
        help_text="Which account the installments are paid from",
    )

    lender = models.CharField(max_length=150, help_text="Bank or person lending")
    purpose = models.CharField(max_length=255, blank=True, default="")

    principal = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_payable = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Principal plus all interest — what will actually be repaid",
    )
    interest_rate = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, help_text="Yearly %, for reference"
    )

    installment_amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    installment_count = models.PositiveIntegerField(help_text="How many months")
    payment_day = models.PositiveSmallIntegerField(
        default=1, help_text="Day of the month the installment is due (1-31)"
    )

    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self):
        return f"{self.lender} — {self.principal}"

    def delete(self, *args, **kwargs):
        """Remove the installment transactions this loan created.

        Django's cascade takes the LoanPayment rows but leaves the bank
        transactions they wrote, which then reappear as unexplained expenses in
        the cost report. Deleting them here also credits the balance back,
        since Transaction.save() debited it on the way in.
        """
        for payment in self.payments.select_related("transaction"):
            txn = payment.transaction
            if txn is None:
                continue
            if txn.status == "verified":
                txn.account.update_balance(txn.amount, "credit")
            txn.delete()
        return super().delete(*args, **kwargs)

    @property
    def paid_amount(self):
        return self.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    @property
    def remaining_amount(self):
        return max(Decimal("0"), self.total_payable - self.paid_amount)

    @property
    def paid_count(self):
        return self.payments.count()

    @property
    def remaining_count(self):
        return max(0, self.installment_count - self.paid_count)

    @property
    def progress_pct(self):
        if not self.total_payable:
            return 0
        return round(float(self.paid_amount / self.total_payable * 100), 1)

    @property
    def next_due_date(self):
        """When the next installment falls due.

        Walks forward from the start date by the number already paid, so a
        borrower who is behind sees an overdue date rather than a future one.
        """
        if self.status != "active" or self.remaining_count == 0:
            return None

        month_offset = self.paid_count
        year = self.start_date.year + (self.start_date.month - 1 + month_offset) // 12
        month = (self.start_date.month - 1 + month_offset) % 12 + 1
        # Clamp for short months: a loan due on the 31st is due on the 30th in
        # a 30-day month, not rolled into the next one.
        last_day = monthrange(year, month)[1]
        return date(year, month, min(self.payment_day, last_day))

    def due_date_for(self, index):
        """Due date of installment `index` (0-based), clamped to short months."""
        year = self.start_date.year + (self.start_date.month - 1 + index) // 12
        month = (self.start_date.month - 1 + index) % 12 + 1
        last_day = monthrange(year, month)[1]
        return date(year, month, min(self.payment_day, last_day))

    @property
    def schedule(self):
        """The full installment plan, one row per month.

        Payments are matched to installments in order rather than by date: a
        borrower who pays two months at once should see the first two rows
        settled, not two arbitrary ones.
        """
        payments = list(self.payments.order_by("paid_on", "id"))
        today = timezone.localdate()
        # Upcoming installments are counted from the DUE DATE of the last
        # settled one — the "কবে দিতে হবে" of installment 8, not the day its
        # money changed hands. So row 9 reads "1 মাস পর": one month after the
        # installment it follows. Paying early or late must not stretch or
        # shrink the gaps in a fixed schedule. Nothing paid yet → count from
        # today, since there is no earlier installment to sit behind.
        anchor = self.due_date_for(len(payments) - 1) if payments else today
        rows = []
        for index in range(self.installment_count):
            due = self.due_date_for(index)
            payment = payments[index] if index < len(payments) else None
            if payment is not None:
                state = "paid"
            elif due < today:
                state = "overdue"
            else:
                state = "upcoming"
            rows.append(
                {
                    "number": index + 1,
                    # Needed to undo a mistaken entry from the schedule row.
                    "payment_id": payment.id if payment else None,
                    "due_date": due,
                    "amount": self.installment_amount,
                    "state": state,
                    "paid_on": payment.paid_on if payment else None,
                    "paid_amount": payment.amount if payment else None,
                    "reference": payment.reference if payment else "",
                    # Relative here; LoanSerializer turns it absolute because
                    # the frontend runs on a different origin than /media.
                    "receipt_url": (
                        payment.receipt.url if payment and payment.receipt else None
                    ),
                    "days_late": (
                        (payment.paid_on - due).days
                        if payment and payment.paid_on > due
                        else 0
                    ),
                    # Days until the due date; negative once it is past. The UI
                    # turns this into "3 মাস 2 দিন পর".
                    # Lateness is always measured from today — an overdue row
                    # must never be softened by an older anchor.
                    "days_until": (
                        None
                        if payment is not None
                        else (due - today).days
                        if state == "overdue"
                        else (due - anchor).days
                    ),
                    # The date the countdown above runs from, so the UI can do a
                    # real calendar diff instead of dividing days by 30.
                    "countdown_from": (
                        None
                        if payment is not None
                        else today
                        if state == "overdue"
                        else anchor
                    ),
                }
            )
        return rows

    @property
    def is_overdue(self):
        due = self.next_due_date
        return bool(due and due < timezone.localdate())

    @property
    def days_overdue(self):
        due = self.next_due_date
        if not due:
            return 0
        return max(0, (timezone.localdate() - due).days)


class LoanPayment(models.Model):
    """One installment actually paid.

    Optionally linked to the bank transaction it came from, so the money is
    counted once — the analytics cost total reads loan payments from here and
    skips transactions already attached to a loan.
    """

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    paid_on = models.DateField(default=date.today)
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loan_payment",
    )
    reference = models.CharField(max_length=100, blank=True, default="")
    receipt = models.FileField(
        validators=[validate_document],
        upload_to="loan_receipts/%Y/%m/",
        blank=True,
        null=True,
        help_text="Scan or photo of the installment receipt",
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_on", "-id"]

    def __str__(self):
        return f"{self.loan.lender} — {self.amount} on {self.paid_on}"

    def delete(self, *args, **kwargs):
        """Undo the bank transaction along with the installment."""
        txn = self.transaction
        result = super().delete(*args, **kwargs)
        if txn is not None:
            if txn.status == "verified":
                txn.account.update_balance(txn.amount, "credit")
            txn.delete()
        return result


class RecurringCost(models.Model):
    """A fixed bill the shop pays every month — office rent, a service charge.

    Modelled like a Loan rather than a plain transaction because it is an
    *obligation*: the money is owed each month whether or not it has been paid,
    so analytics has to count it when working out the daily break-even target,
    the same way it counts salaries and loan installments.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="recurring_costs"
    )
    account = models.ForeignKey(
        BankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurring_costs",
        help_text="Which account it is paid from",
    )

    title = models.CharField(max_length=150, help_text="e.g. অফিস ভাড়া")
    category = models.CharField(
        max_length=50,
        default="rent",
        help_text="Cost bucket, matching Transaction.category",
    )
    amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    due_day = models.PositiveSmallIntegerField(
        default=1, help_text="Day of the month it falls due (1-31)"
    )
    start_date = models.DateField(default=date.today)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "title"]
        indexes = [models.Index(fields=["user", "is_active"])]

    def __str__(self):
        return f"{self.title} — {self.amount}/month"

    def _month_start(self, day):
        return day.replace(day=1)

    @property
    def current_period(self):
        """The month this cost is currently being paid for."""
        return self._month_start(timezone.localdate())

    @property
    def due_date(self):
        """When this month's payment falls due, clamped to short months."""
        today = timezone.localdate()
        last_day = monthrange(today.year, today.month)[1]
        return date(today.year, today.month, min(self.due_day, last_day))

    @property
    def paid_this_month(self):
        return self.payments.filter(period=self.current_period).exists()

    @property
    def is_overdue(self):
        return (
            self.is_active
            and not self.paid_this_month
            and self.due_date < timezone.localdate()
        )

    @property
    def days_overdue(self):
        if not self.is_overdue:
            return 0
        return (timezone.localdate() - self.due_date).days

    @property
    def paid_total(self):
        return self.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")


class RecurringCostPayment(models.Model):
    """One month's payment of a recurring cost.

    `period` is the first of the month being settled, so paying August's rent in
    September still lands against August and the month cannot be paid twice.
    """

    cost = models.ForeignKey(
        RecurringCost, on_delete=models.CASCADE, related_name="payments"
    )
    period = models.DateField(help_text="First day of the month being paid for")
    amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    paid_on = models.DateField(default=date.today)
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurring_payment",
    )
    receipt = models.FileField(
        validators=[validate_document],
        upload_to="rent_receipts/%Y/%m/",
        blank=True,
        null=True,
        help_text="Scan or photo of the money receipt",
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period", "-id"]
        unique_together = ["cost", "period"]

    def __str__(self):
        return f"{self.cost.title} — {self.period:%b %Y}"

    def delete(self, *args, **kwargs):
        """Remove the bank transaction along with the payment."""
        txn = self.transaction
        result = super().delete(*args, **kwargs)
        if txn is not None:
            if txn.status == "verified":
                txn.account.update_balance(txn.amount, "credit")
            txn.delete()
        return result
