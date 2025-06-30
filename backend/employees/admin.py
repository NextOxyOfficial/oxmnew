from django.contrib import admin
from .models import Employee, PaymentInformation, Incentive, SalaryRecord, Task, Document


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'name', 'email', 'role',
                    'department', 'status', 'salary', 'hiring_date']
    list_filter = ['status', 'department', 'role', 'hiring_date']
    search_fields = ['name', 'email', 'employee_id', 'role', 'department']
    readonly_fields = ['tasks_assigned',
                       'tasks_completed', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee_id', 'name', 'email', 'phone', 'address', 'photo')
        }),
        ('Employment Details', {
            'fields': ('role', 'department', 'manager', 'salary', 'hiring_date', 'status')
        }),
        ('Task Statistics', {
            'fields': ('tasks_assigned', 'tasks_completed'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentInformation)
class PaymentInformationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'bank_name', 'payment_method', 'pay_frequency']
    list_filter = ['payment_method', 'pay_frequency', 'tax_withholding']
    search_fields = ['employee__name', 'bank_name', 'account_holder_name']


@admin.register(Incentive)
class IncentiveAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'type',
                    'amount', 'status', 'date_awarded']
    list_filter = ['type', 'status', 'date_awarded']
    search_fields = ['title', 'employee__name', 'description']
    readonly_fields = ['date_awarded', 'created_at', 'updated_at']


@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'year',
                    'base_salary', 'net_salary', 'status']
    list_filter = ['year', 'month', 'status']
    search_fields = ['employee__name']
    readonly_fields = ['net_salary',
                       'payment_date', 'created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'priority',
                    'status', 'assigned_date', 'due_date']
    list_filter = ['priority', 'status', 'assigned_date', 'due_date']
    search_fields = ['title', 'employee__name', 'assigned_by', 'project']
    readonly_fields = ['assigned_date',
                       'completed_date', 'created_at', 'updated_at']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'employee', 'category',
                    'file_type', 'size', 'upload_date']
    list_filter = ['category', 'upload_date']
    search_fields = ['name', 'employee__name']
    readonly_fields = ['size', 'file_type',
                       'upload_date', 'created_at', 'updated_at']
