from django.db.models import Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Document,
    Employee,
    Incentive,
    PaymentInformation,
    SalaryRecord,
    Task,
)
from .serializers import (
    DocumentSerializer,
    EmployeeCreateUpdateSerializer,
    EmployeeListSerializer,
    EmployeeSerializer,
    IncentiveSerializer,
    PaymentInformationSerializer,
    SalaryRecordSerializer,
    TaskSerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
    ]  # Support both session and token auth
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "department", "role"]
    search_fields = ["name", "email", "employee_id", "role", "department"]
    ordering_fields = ["name", "salary", "hiring_date", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == "create":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "list":
            return EmployeeListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return EmployeeCreateUpdateSerializer
        return EmployeeSerializer

    def perform_create(self, serializer):
        # User must be authenticated to create an employee
        employee = serializer.save(user=self.request.user)
        # Create default payment information
        PaymentInformation.objects.create(employee=employee)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get employee statistics"""
        total_employees = Employee.objects.count()
        active_employees = Employee.objects.filter(status="active").count()
        avg_salary = (
            Employee.objects.aggregate(avg_salary=Avg("salary"))["avg_salary"] or 0
        )
        departments = Employee.objects.values_list("department", flat=True).distinct()

        return Response(
            {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "average_salary": float(avg_salary),
                "departments": list(departments),
            }
        )

    @action(detail=True, methods=["get", "put", "patch"])
    def payment_info(self, request, pk=None):
        """Manage employee payment information"""
        employee = self.get_object()
        payment_info, created = PaymentInformation.objects.get_or_create(
            employee=employee
        )

        if request.method == "GET":
            serializer = PaymentInformationSerializer(payment_info)
            return Response(serializer.data)

        elif request.method in ["PUT", "PATCH"]:
            partial = request.method == "PATCH"
            serializer = PaymentInformationSerializer(
                payment_info, data=request.data, partial=partial
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"])
    def incentives(self, request, pk=None):
        """Manage employee incentives"""
        employee = self.get_object()

        if request.method == "GET":
            incentives = employee.incentives.all()
            serializer = IncentiveSerializer(incentives, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = IncentiveSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(employee=employee)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"])
    def salary_records(self, request, pk=None):
        """Manage employee salary records"""
        employee = self.get_object()

        if request.method == "GET":
            records = employee.salary_records.all()
            serializer = SalaryRecordSerializer(records, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = SalaryRecordSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(employee=employee)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"])
    def tasks(self, request, pk=None):
        """Manage employee tasks"""
        employee = self.get_object()

        if request.method == "GET":
            tasks = employee.tasks.all()
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = TaskSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(employee=employee)
                # Update task count
                employee.tasks_assigned += 1
                employee.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True, methods=["post"], url_path="tasks/(?P<task_id>[^/.]+)/complete"
    )
    def complete_task(self, request, pk=None, task_id=None):
        """Mark a task as completed"""
        employee = self.get_object()
        try:
            task = employee.tasks.get(id=task_id)
            if task.status != "completed":
                task.status = "completed"
                task.completed_date = timezone.now()
                task.save()

                # Update completion count
                employee.tasks_completed += 1
                employee.save()

                return Response({"message": "Task marked as completed"})
            return Response(
                {"message": "Task already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Task.DoesNotExist:
            return Response(
                {"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(
        detail=True,
        methods=["get", "post"],
        parser_classes=[MultiPartParser, FormParser],
    )
    def documents(self, request, pk=None):
        """Manage employee documents"""
        employee = self.get_object()

        if request.method == "GET":
            documents = employee.documents.all()
            serializer = DocumentSerializer(
                documents, many=True, context={"request": request}
            )
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = DocumentSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(employee=employee)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IncentiveViewSet(viewsets.ModelViewSet):
    queryset = Incentive.objects.all()
    serializer_class = IncentiveSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["employee", "type", "status"]
    ordering_fields = ["date_awarded", "amount"]
    ordering = ["-date_awarded"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve an incentive"""
        incentive = self.get_object()
        incentive.status = "approved"
        incentive.save()
        return Response({"message": "Incentive approved"})

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        """Mark incentive as paid"""
        incentive = self.get_object()
        incentive.status = "paid"
        incentive.save()
        return Response({"message": "Incentive marked as paid"})


class SalaryRecordViewSet(viewsets.ModelViewSet):
    queryset = SalaryRecord.objects.all()
    serializer_class = SalaryRecordSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["employee", "year", "month", "status"]
    ordering_fields = ["year", "month", "payment_date"]
    ordering = ["-year", "-month"]

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        """Mark salary record as paid"""
        record = self.get_object()
        record.status = "paid"
        record.save()
        return Response({"message": "Salary record marked as paid"})


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["employee", "status", "priority", "assigned_by"]
    ordering_fields = ["assigned_date", "due_date", "priority"]
    ordering = ["-assigned_date"]

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark task as completed"""
        task = self.get_object()
        if task.status != "completed":
            task.status = "completed"
            task.completed_date = timezone.now()
            task.save()

            # Update employee task completion count
            employee = task.employee
            employee.tasks_completed += 1
            employee.save()

            return Response({"message": "Task completed"})
        return Response(
            {"message": "Task already completed"}, status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel a task"""
        task = self.get_object()
        task.status = "cancelled"
        task.save()
        return Response({"message": "Task cancelled"})


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["employee", "category"]
    ordering_fields = ["upload_date", "name"]
    ordering = ["-upload_date"]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        """Override to handle employee field from request data"""
        employee_id = self.request.data.get("employee")
        if employee_id:
            try:
                employee = Employee.objects.get(id=employee_id)
                serializer.save(employee=employee)
                return
            except Employee.DoesNotExist:
                pass

        # If no valid employee provided, save without employee (will cause validation error)
        serializer.save()


class PaymentInformationViewSet(viewsets.ModelViewSet):
    queryset = PaymentInformation.objects.all()
    serializer_class = PaymentInformationSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["employee", "payment_method", "pay_frequency"]
