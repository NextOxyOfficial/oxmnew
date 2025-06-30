from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from employees.models import Employee, PaymentInformation, Incentive, SalaryRecord, Task, Document


class Command(BaseCommand):
    help = 'Create sample employee data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(
            'Creating sample employee data...'))

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
                'salary': 6250.00,
                'hiring_date': date(2023, 1, 15),
                'status': 'active',
                'tasks_assigned': 24,
                'tasks_completed': 22,
            },
            {
                'employee_id': 'EMP002',
                'name': 'John Davis',
                'email': 'john.davis@company.com',
                'phone': '+1 (555) 234-5678',
                'address': '456 Oak Ave, City, State 67890',
                'role': 'Product Manager',
                'department': 'Product',
                'manager': 'Sarah Wilson',
                'salary': 7500.00,
                'hiring_date': date(2022, 8, 10),
                'status': 'active',
                'tasks_assigned': 18,
                'tasks_completed': 16,
            },
            {
                'employee_id': 'EMP003',
                'name': 'Emily Chen',
                'email': 'emily.chen@company.com',
                'phone': '+1 (555) 345-6789',
                'address': '789 Pine St, City, State 13579',
                'role': 'UX Designer',
                'department': 'Design',
                'manager': 'Mike Thompson',
                'salary': 5800.00,
                'hiring_date': date(2023, 3, 22),
                'status': 'active',
                'tasks_assigned': 15,
                'tasks_completed': 13,
            },
            {
                'employee_id': 'EMP004',
                'name': 'Michael Brown',
                'email': 'michael.brown@company.com',
                'phone': '+1 (555) 456-7890',
                'address': '321 Elm Dr, City, State 24680',
                'role': 'DevOps Engineer',
                'department': 'Infrastructure',
                'manager': 'Lisa Garcia',
                'salary': 6800.00,
                'hiring_date': date(2022, 11, 5),
                'status': 'active',
                'tasks_assigned': 12,
                'tasks_completed': 11,
            },
            {
                'employee_id': 'EMP005',
                'name': 'Sarah Martinez',
                'email': 'sarah.martinez@company.com',
                'phone': '+1 (555) 567-8901',
                'address': '654 Maple Ln, City, State 97531',
                'role': 'Data Analyst',
                'department': 'Analytics',
                'manager': 'David Lee',
                'salary': 5200.00,
                'hiring_date': date(2023, 6, 18),
                'status': 'suspended',
                'tasks_assigned': 8,
                'tasks_completed': 6,
            }
        ]

        created_employees = []
        for emp_data in employees_data:
            employee, created = Employee.objects.get_or_create(
                employee_id=emp_data['employee_id'],
                defaults=emp_data
            )
            if created:
                self.stdout.write(f'Created employee: {employee.name}')
            else:
                self.stdout.write(f'Employee already exists: {employee.name}')
            created_employees.append(employee)

            # Create payment information
            payment_info, created = PaymentInformation.objects.get_or_create(
                employee=employee,
                defaults={
                    'bank_name': 'Dutch-Bangla Bank Limited',
                    'account_number': f'12345678901234{employee.id:02d}',
                    'bank_branch': 'Dhanmondi Branch',
                    'account_holder_name': employee.name,
                    'tax_id': f'123-45-{employee.id:04d}',
                    'tax_withholding': 'single',
                    'payment_method': 'direct-deposit',
                    'pay_frequency': 'monthly',
                }
            )

        # Create sample incentives
        alice = created_employees[0]
        incentives_data = [
            {
                'employee': alice,
                'title': 'Q1 Performance Bonus',
                'description': 'Exceeded quarterly targets',
                'amount': 2500.00,
                'type': 'performance',
                'status': 'paid'
            },
            {
                'employee': alice,
                'title': 'Project Completion Bonus',
                'description': 'Successfully delivered major project',
                'amount': 1500.00,
                'type': 'bonus',
                'status': 'approved'
            },
            {
                'employee': alice,
                'title': 'Innovation Award',
                'description': 'Implemented new efficiency tool',
                'amount': 1000.00,
                'type': 'achievement',
                'status': 'pending'
            }
        ]

        for inc_data in incentives_data:
            incentive, created = Incentive.objects.get_or_create(
                employee=inc_data['employee'],
                title=inc_data['title'],
                defaults=inc_data
            )
            if created:
                self.stdout.write(f'Created incentive: {incentive.title}')

        # Create sample salary records
        salary_data = [
            {
                'employee': alice,
                'month': 'June',
                'year': 2025,
                'base_salary': 6250.00,
                'overtime_hours': 10.00,
                'overtime_rate': 45.00,
                'bonuses': 500.00,
                'deductions': 200.00,
                'status': 'paid'
            },
            {
                'employee': alice,
                'month': 'May',
                'year': 2025,
                'base_salary': 6250.00,
                'overtime_hours': 8.00,
                'overtime_rate': 45.00,
                'bonuses': 0.00,
                'deductions': 150.00,
                'status': 'paid'
            },
            {
                'employee': alice,
                'month': 'April',
                'year': 2025,
                'base_salary': 6250.00,
                'overtime_hours': 12.00,
                'overtime_rate': 45.00,
                'bonuses': 1000.00,
                'deductions': 180.00,
                'status': 'paid'
            }
        ]

        for sal_data in salary_data:
            salary, created = SalaryRecord.objects.get_or_create(
                employee=sal_data['employee'],
                month=sal_data['month'],
                year=sal_data['year'],
                defaults=sal_data
            )
            if created:
                self.stdout.write(f'Created salary record: {salary}')

        # Create sample tasks
        tasks_data = [
            {
                'employee': alice,
                'title': 'API Development',
                'description': 'Develop REST API for user management',
                'priority': 'high',
                'status': 'in_progress',
                'due_date': timezone.now() + timedelta(days=15),
                'assigned_by': 'Bob Smith',
                'project': 'User Portal v2.0'
            },
            {
                'employee': alice,
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
                'employee': alice,
                'title': 'Database Optimization',
                'description': 'Optimize queries for better performance',
                'priority': 'urgent',
                'status': 'pending',
                'due_date': timezone.now() + timedelta(days=4),
                'assigned_by': 'Bob Smith',
                'project': 'Performance Improvement'
            }
        ]

        for task_data in tasks_data:
            task, created = Task.objects.get_or_create(
                employee=task_data['employee'],
                title=task_data['title'],
                defaults=task_data
            )
            if created:
                self.stdout.write(f'Created task: {task.title}')

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample employee data!')
        )
