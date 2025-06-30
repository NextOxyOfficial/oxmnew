from rest_framework import serializers
from .models import Employee, PaymentInformation, Incentive, SalaryRecord, Task, Document


class PaymentInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInformation
        fields = '__all__'
        extra_kwargs = {
            'employee': {'read_only': True}
        }


class IncentiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incentive
        fields = '__all__'
        extra_kwargs = {
            'employee': {'read_only': True}
        }


class SalaryRecordSerializer(serializers.ModelSerializer):
    overtime_pay = serializers.SerializerMethodField()

    class Meta:
        model = SalaryRecord
        fields = '__all__'
        extra_kwargs = {
            'employee': {'read_only': True},
            'net_salary': {'read_only': True}
        }

    def get_overtime_pay(self, obj):
        return float(obj.overtime_hours * obj.overtime_rate)


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {
            'employee': {'read_only': True}
        }


class DocumentSerializer(serializers.ModelSerializer):
    file_type = serializers.CharField(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = '__all__'
        extra_kwargs = {
            'employee': {'read_only': True},
            'size': {'read_only': True}
        }

    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class EmployeeSerializer(serializers.ModelSerializer):
    payment_info = PaymentInformationSerializer(read_only=True)
    incentives = IncentiveSerializer(many=True, read_only=True)
    salary_records = SalaryRecordSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    # Calculate fields
    total_incentives = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'

    def get_total_incentives(self, obj):
        return float(sum(incentive.amount for incentive in obj.incentives.all()))

    def get_completion_rate(self, obj):
        if obj.tasks_assigned > 0:
            return (obj.tasks_completed / obj.tasks_assigned) * 100
        return 0

    def get_pending_tasks(self, obj):
        return obj.tasks.filter(status__in=['pending', 'in_progress']).count()


class EmployeeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for employee list view"""
    total_incentives = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'name', 'email', 'phone', 'address',
            'role', 'department', 'manager', 'salary', 'hiring_date',
            'photo', 'status', 'tasks_assigned', 'tasks_completed',
            'total_incentives', 'completion_rate', 'pending_tasks',
            'created_at', 'updated_at'
        ]

    def get_total_incentives(self, obj):
        return float(sum(incentive.amount for incentive in obj.incentives.all()))

    def get_completion_rate(self, obj):
        if obj.tasks_assigned > 0:
            return (obj.tasks_completed / obj.tasks_assigned) * 100
        return 0

    def get_pending_tasks(self, obj):
        return obj.tasks.filter(status__in=['pending', 'in_progress']).count()


class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating employees"""
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'name', 'email', 'phone', 'address',
            'role', 'department', 'manager', 'salary', 'hiring_date',
            'photo', 'status'
        ]
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def validate_employee_id(self, value):
        """Ensure employee_id is unique"""
        instance = getattr(self, 'instance', None)
        if Employee.objects.filter(employee_id=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError(
                "Employee with this ID already exists.")
        return value

    def validate_email(self, value):
        """Ensure email is unique"""
        instance = getattr(self, 'instance', None)
        if Employee.objects.filter(email=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError(
                "Employee with this email already exists.")
        return value
