from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
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
    employee_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    photo = models.ImageField(
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
    date_awarded = models.DateTimeField(auto_now_add=True)
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
    withdrawal_date = models.DateTimeField(auto_now_add=True)
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
    payment_date = models.DateTimeField(auto_now_add=True)
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
    file = models.FileField(upload_to='employee_documents/')
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
