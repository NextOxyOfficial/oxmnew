from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from employees.models import Employee, PaymentInformation, Incentive, SalaryRecord, Task, Document


class Command(BaseCommand):
    help = 'Create sample employee data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample employee data...')

        # Clear existing data
        Employee.objects.all().delete()

        # Create sample employees
        employees_data = [
            {
                'employee_id': 'EMP001',
                'name': 'Alice Johnson',
                'email': 'alice.johnson@company.com',
                'phone': '+1 (555) 123-4567',
                'address': '123 Main St, City, State 12345',
                'role': 'Software Engineer',
                'department': 'Development',
                'manager': 'Bob Smith',
                'salary': Decimal('6250.00'),
                'hiring_date': datetime(2023, 1, 15).date(),
                'status': 'active',
                'tasks_assigned': 24,
                'tasks_completed': 22
            },
            {
                'employee_id': 'EMP002',
                'name': 'Bob Smith',
                'email': 'bob.smith@company.com',
                'phone': '+1 (555) 987-6543',
                'address': '456 Oak Ave, City, State 67890',
                'role': 'Project Manager',
                'department': 'Management',
                'manager': 'Carol Davis',
                'salary': Decimal('7083.00'),
                'hiring_date': datetime(2022, 8, 10).date(),
                'status': 'active',
                'tasks_assigned': 18,
                'tasks_completed': 17
            },
            {
                'employee_id': 'EMP003',
                'name': 'Carol Davis',
                'email': 'carol.davis@company.com',
                'phone': '+1 (555) 456-7890',
                'role': 'Marketing Specialist',
                'department': 'Marketing',
                'manager': 'David Wilson',
                'salary': Decimal('4583.00'),
                'hiring_date': datetime(2023, 6, 20).date(),
                'status': 'active',
                'tasks_assigned': 16,
                'tasks_completed': 14
            },
            {
                'employee_id': 'EMP004',
                'name': 'David Wilson',
                'email': 'david.wilson@company.com',
                'phone': '+1 (555) 321-0987',
                'address': '789 Pine Rd, City, State 13579',
                'role': 'Sales Representative',
                'department': 'Sales',
                'manager': 'Emma Brown',
                'salary': Decimal('4000.00'),
                'hiring_date': datetime(2023, 3, 5).date(),
                'status': 'suspended',
                'tasks_assigned': 12,
                'tasks_completed': 10
            },
            {
                'employee_id': 'EMP005',
                'name': 'Emma Brown',
                'email': 'emma.brown@company.com',
                'phone': '+1 (555) 654-3210',
                'role': 'HR Manager',
                'department': 'Human Resources',
                'manager': None,
                'salary': Decimal('5833.00'),
                'hiring_date': datetime(2022, 11, 1).date(),
                'status': 'active',
                'tasks_assigned': 20,
                'tasks_completed': 19
            }
        ]

        created_employees = []
        for emp_data in employees_data:
            employee = Employee.objects.create(**emp_data)
            created_employees.append(employee)
            self.stdout.write(f'Created employee: {employee.name}')

            # Create payment information
            payment_data = [
                {
                    'bank_name': 'Dutch-Bangla Bank Limited',
                    'account_number': '1234567890123456',
                    'bank_branch': 'Dhanmondi Branch',
                    'account_holder_name': employee.name,
                    'tax_id': '123-45-6789',
                    'tax_withholding': 'single',
                    'payment_method': 'direct-deposit',
                    'pay_frequency': 'monthly'
                },
                {
                    'bank_name': 'Brac Bank Limited',
                    'account_number': '1234567890',
                    'bank_branch': 'Kushtia',
                    'account_holder_name': employee.name,
                    'tax_id': '987-65-4321',
                    'tax_withholding': 'married',
                    'payment_method': 'direct-deposit',
                    'pay_frequency': 'monthly'
                },
                {
                    'bank_name': 'Prime Bank Limited',
                    'account_number': '9988776655',
                    'bank_branch': 'Rajshahi',
                    'account_holder_name': employee.name,
                    'tax_id': '456-78-9123',
                    'tax_withholding': 'single',
                    'payment_method': 'wire',
                    'pay_frequency': 'monthly'
                }
            ]

            payment_info = PaymentInformation.objects.create(
                employee=employee,
                **payment_data[min(len(payment_data)-1, len(created_employees)-1)]
            )

        # Create sample incentives for Alice Johnson
        alice = Employee.objects.get(employee_id='EMP001')
        incentives_data = [
            {
                'title': 'Q1 Performance Bonus',
                'description': 'Exceeded quarterly targets',
                'amount': Decimal('2500.00'),
                'type': 'performance',
                'status': 'paid'
            },
            {
                'title': 'Project Completion Bonus',
                'description': 'Successfully delivered major project',
                'amount': Decimal('1500.00'),
                'type': 'bonus',
                'status': 'approved'
            },
            {
                'title': 'Innovation Award',
                'description': 'Implemented new efficiency tool',
                'amount': Decimal('1000.00'),
                'type': 'achievement',
                'status': 'pending'
            }
        ]

        for incentive_data in incentives_data:
            Incentive.objects.create(employee=alice, **incentive_data)

        # Create salary records for Alice
        salary_records_data = [
            {
                'month': 'June',
                'year': 2025,
                'base_salary': Decimal('6250.00'),
                'overtime_hours': Decimal('10.00'),
                'overtime_rate': Decimal('45.00'),
                'bonuses': Decimal('500.00'),
                'deductions': Decimal('200.00'),
                'status': 'paid'
            },
            {
                'month': 'May',
                'year': 2025,
                'base_salary': Decimal('6250.00'),
                'overtime_hours': Decimal('8.00'),
                'overtime_rate': Decimal('45.00'),
                'bonuses': Decimal('0.00'),
                'deductions': Decimal('150.00'),
                'status': 'paid'
            },
            {
                'month': 'April',
                'year': 2025,
                'base_salary': Decimal('6250.00'),
                'overtime_hours': Decimal('12.00'),
                'overtime_rate': Decimal('45.00'),
                'bonuses': Decimal('1000.00'),
                'deductions': Decimal('180.00'),
                'status': 'paid'
            }
        ]

        for salary_data in salary_records_data:
            SalaryRecord.objects.create(employee=alice, **salary_data)

        # Create tasks for Alice
        tasks_data = [
            {
                'title': 'API Development',
                'description': 'Develop REST API for user management',
                'priority': 'high',
                'status': 'in_progress',
                'due_date': timezone.now() + timedelta(days=5),
                'assigned_by': 'Bob Smith',
                'project': 'User Portal v2.0'
            },
            {
                'title': 'Code Review',
                'description': 'Review pull requests for feature branch',
                'priority': 'medium',
                'status': 'completed',
                'due_date': timezone.now() - timedelta(days=3),
                'completed_date': timezone.now() - timedelta(days=4),
                'assigned_by': 'Bob Smith',
                'project': 'Feature Release'
            },
            {
                'title': 'Database Optimization',
                'description': 'Optimize queries for better performance',
                'priority': 'urgent',
                'status': 'pending',
                'due_date': timezone.now() + timedelta(days=2),
                'assigned_by': 'Bob Smith',
                'project': 'Performance Improvement'
            }
        ]

        for task_data in tasks_data:
            Task.objects.create(employee=alice, **task_data)

        # Create some tasks for other employees
        for employee in created_employees[1:]:
            Task.objects.create(
                employee=employee,
                title=f'Sample Task for {employee.name}',
                description=f'This is a sample task assigned to {employee.name}',
                priority='medium',
                status='pending',
                due_date=timezone.now() + timedelta(days=7),
                assigned_by='Admin',
                project='General Tasks'
            )

        self.stdout.write(self.style.SUCCESS(
            'Successfully created sample employee data!'))
