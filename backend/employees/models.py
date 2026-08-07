from core.uploads import validate_document, validate_image

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import date
from decimal import Decimal


class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('resigned', 'Resigned'),
        ('corrupted', 'Corrupted'),
    ]

    # Store/User association
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="employees")

    # Basic Information
    employee_id = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    photo = models.ImageField(
        validators=[validate_image],
        upload_to='employee_photos/', blank=True, null=True)

    # Employment Details
    role = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    manager = models.CharField(max_length=100, blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, validators=[
                                 MinValueValidator(Decimal('0.01'))])
    hiring_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active')

    # Task tracking
    tasks_assigned = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = [
            ('user', 'employee_id'),
            ('user', 'email'),
        ]

    def __str__(self):
        return f"{self.name} ({self.employee_id})"


class PaymentInformation(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('direct-deposit', 'Bank Deposit'),
        ('check', 'Paper Check'),
        ('wire', 'Online Transfer'),
        ('cash', 'Cash Payment'),
    ]

    PAY_FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('bi-weekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
    ]

    TAX_WITHHOLDING_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married Filing Jointly'),
        ('married-separate', 'Married Filing Separately'),
        ('head', 'Head of Household'),
    ]

    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name='payment_info')

    # Bank Information
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_branch = models.CharField(max_length=100, blank=True, null=True)
    account_holder_name = models.CharField(
        max_length=100, blank=True, null=True)

    # Tax Information
    tax_id = models.CharField(max_length=20, blank=True, null=True)
    tax_withholding = models.CharField(
        max_length=20, choices=TAX_WITHHOLDING_CHOICES, blank=True, null=True)

    # Payment Settings
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default='direct-deposit')
    pay_frequency = models.CharField(
        max_length=20, choices=PAY_FREQUENCY_CHOICES, default='monthly')
    payment_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment info for {self.employee.name}"


class Incentive(models.Model):
    TYPE_CHOICES = [
        ('bonus', 'Bonus'),
        ('commission', 'Commission'),
        ('achievement', 'Achievement'),
        ('performance', 'Performance'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='incentives')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[
                                 MinValueValidator(Decimal('0.01'))])
    #: When the bonus was awarded, not when it was typed in — see the note on
    #: banking.Transaction.date.
    date_awarded = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_awarded']
        indexes = [
            models.Index(fields=['employee', '-date_awarded']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', '-date_awarded']),
        ]

    def __str__(self):
        return f"{self.title} - {self.amount}"


class IncentiveWithdrawal(models.Model):
    """Track all incentive withdrawals for an employee"""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='incentive_withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[
                                 MinValueValidator(Decimal('0.01'))])
    withdrawal_date = models.DateTimeField(default=timezone.now)
    reason = models.TextField(blank=True, null=True)
    
    # Optional: Track which incentives were affected
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-withdrawal_date']
        indexes = [
            models.Index(fields=['employee', '-withdrawal_date']),
        ]

    def __str__(self):
        return f"{self.employee.name} - {self.amount} withdrawn on {self.withdrawal_date.strftime('%Y-%m-%d')}"


class SalaryRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
    ]

    MONTH_CHOICES = [
        ('January', 'January'),
        ('February', 'February'),
        ('March', 'March'),
        ('April', 'April'),
        ('May', 'May'),
        ('June', 'June'),
        ('July', 'July'),
        ('August', 'August'),
        ('September', 'September'),
        ('October', 'October'),
        ('November', 'November'),
        ('December', 'December'),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='salary_records')
    month = models.CharField(max_length=20, choices=MONTH_CHOICES)
    year = models.IntegerField()
    base_salary = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=0)
    overtime_rate = models.DecimalField(
        max_digits=6, decimal_places=2, default=0)
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    #: When the salary was paid, not when the record was created.
    payment_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['employee', 'month', 'year']

    def save(self, *args, **kwargs):
        # Calculate net salary automatically
        overtime_pay = self.overtime_hours * self.overtime_rate
        self.net_salary = self.base_salary + overtime_pay + self.bonuses - self.deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.name} - {self.month} {self.year}"


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    completed_date = models.DateTimeField(blank=True, null=True)
    assigned_by = models.CharField(max_length=100)
    project = models.CharField(max_length=200, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']

    def __str__(self):
        return f"{self.title} - {self.employee.name}"


class Document(models.Model):
    CATEGORY_CHOICES = [
        ('contract', 'Contract'),
        ('id_document', 'ID Document'),
        ('certificate', 'Certificate'),
        ('performance', 'Performance Review'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default='other')
    file = models.FileField(upload_to='employee_documents/', validators=[validate_document])
    size = models.IntegerField()  # in bytes
    upload_date = models.DateTimeField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.name} - {self.employee.name}"

    @property
    def file_type(self):
        """Return file extension"""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return 'unknown'

    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)

class EmployeeAccess(models.Model):
    """A login the shop owner hands to one employee.

    Kept apart from `Employee` on purpose: most staff never get a login, and a
    row here is the single answer to "can this person sign in". Deleting it
    revokes access without touching the employment record.

    `account` is a normal Django user, so the whole auth stack — password
    hashing, tokens, throttling — applies unchanged. What makes it *staff* is
    `employee`, which points back at the owner whose books it may see.
    """

    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name="access"
    )
    account = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="staff_access"
    )
    #: Permission codes from employees.permissions. Stored as a list rather
    #: than rows so reading them costs nothing on every request.
    permissions = models.JSONField(default=list, blank=True)
    #: The owner can switch a login off without deleting it — a suspended
    #: employee should not lose their permission set.
    is_enabled = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Employee access"

    def __str__(self):
        return f"{self.employee.name} — login"

    @property
    def owner(self):
        """The shop this login works for."""
        return self.employee.user

    def has(self, code):
        return self.is_enabled and code in (self.permissions or [])

class SalaryPayment(models.Model):
    """Money actually handed to an employee.

    Kept separate from `SalaryRecord`, which is only the *payslip* — what was
    earned that month. Cash moves on its own schedule: an advance in the middle
    of the month, the balance after payday, sometimes nothing at all. Folding
    the two together would make it impossible to answer the question the owner
    actually asks — "how much has he taken, and how much is still owed".

    A payment with no `salary_record` is a floating advance: money given before
    the month it belongs to was worked out. It still counts against the
    employee's ledger, so nobody can quietly draw more than they earn.
    """

    KIND_CHOICES = [
        ("advance", "Advance"),
        ("salary", "Salary"),
    ]
    METHOD_CHOICES = [
        ("cash", "Cash"),
        ("bank", "Bank"),
        ("mobile", "Mobile Banking"),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="salary_payments"
    )
    #: Which month's payslip this settles. Null while it is a plain advance.
    salary_record = models.ForeignKey(
        SalaryRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="salary")
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default="cash")
    paid_on = models.DateField(default=date.today)
    note = models.TextField(blank=True, null=True)

    #: The bank transaction this created, so deleting the payment can undo it
    #: and the money is never counted twice in the cost report.
    transaction = models.OneToOneField(
        "banking.Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="salary_payment",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_on", "-id"]
        indexes = [models.Index(fields=["employee", "paid_on"])]

    def __str__(self):
        return f"{self.employee.name} — {self.amount} ({self.get_kind_display()})"

    def delete(self, *args, **kwargs):
        """Reverse the bank side too, so an undone payment leaves no trace."""
        txn = self.transaction
        super().delete(*args, **kwargs)
        if txn is not None:
            account = txn.account
            # The transaction was a debit; crediting the same amount back puts
            # the balance where it was before.
            account.update_balance(txn.amount, "credit")
            txn.delete()


def salary_ledger(employee):
    """One employee's pay position, in the terms the owner thinks in.

    `outstanding` positive means the shop still owes him. Negative means he has
    drawn more than he has earned — an advance not yet worked off.

    Summed in Python rather than with `.aggregate()`: the payroll screen
    prefetches both sets for every employee, and an aggregate would ignore that
    and fire three fresh queries per person.
    """
    records = employee.salary_records.all()
    payments = employee.salary_payments.all()

    earned = sum((r.net_salary for r in records), Decimal("0"))
    paid = sum((p.amount for p in payments), Decimal("0"))
    advances = sum(
        (p.amount for p in payments if p.kind == "advance" and not p.salary_record_id),
        Decimal("0"),
    )
    return {
        "earned": earned,
        "paid": paid,
        "outstanding": earned - paid,
        "unsettled_advance": advances,
    }
