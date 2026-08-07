"""Owner-only endpoints for handing an employee a login.

Everything here is guarded on the caller being a real shop owner, not a staff
login: an assistant who could grant themselves permissions would make the whole
scheme decorative. `_owner_only` is the single gate.
"""

import secrets

from core.scoping import staff_access
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import permissions as perms
from .models import Employee, EmployeeAccess

MIN_PASSWORD = 6


def _owner_only(request):
    """None when the caller may manage logins, else the refusal to return."""
    if staff_access(request.user) is not None:
        return Response(
            {"error": "শুধু মালিক লগইনের অনুমতি দিতে পারেন।"},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _username_for(employee):
    """A stable internal username. Nobody types this — staff sign in with their
    phone or email — so it only has to be unique."""
    base = f"emp{employee.user_id}_{employee.id}"
    if not User.objects.filter(username=base).exists():
        return base
    return f"{base}_{secrets.token_hex(2)}"


def _represent(access, request=None):
    employee = access.employee
    return {
        "employee": employee.id,
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "role": employee.role,
        "department": employee.department,
        "username": access.account.username,
        "is_enabled": access.is_enabled,
        "permissions": access.permissions or [],
        "last_login_at": access.last_login_at,
        "created_at": access.created_at,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def permission_catalogue(request):
    """Every permission the checkbox screen can offer, grouped."""
    return Response(
        {
            "groups": perms.grouped(),
            "default_preset": perms.DEFAULT_PRESET,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def access_list(request):
    """Who in this shop has a login."""
    denied = _owner_only(request)
    if denied:
        return denied
    rows = (
        EmployeeAccess.objects.filter(employee__user=request.user)
        .select_related("employee", "account")
        .order_by("employee__name")
    )
    return Response([_represent(row) for row in rows])


@api_view(["POST", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def access_detail(request, employee_id):
    """Create, update or revoke one employee's login.

    POST creates it with a password the owner chooses. PATCH edits permissions,
    flips the switch, or sets a new password. DELETE removes the login and the
    account behind it, leaving the employment record untouched.
    """
    denied = _owner_only(request)
    if denied:
        return denied

    employee = Employee.objects.filter(id=employee_id, user=request.user).first()
    if employee is None:
        return Response(
            {"error": "কর্মচারীটা পাওয়া যায়নি।"}, status=status.HTTP_404_NOT_FOUND
        )

    access = EmployeeAccess.objects.filter(employee=employee).select_related(
        "account"
    ).first()

    if request.method == "POST":
        if access is not None:
            return Response(
                {"error": "এই কর্মচারীর লগইন আগে থেকেই আছে।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (employee.email or "").strip() and not (employee.phone or "").strip():
            return Response(
                {"error": "লগইন দিতে হলে কর্মচারীর ফোন বা ইমেইল থাকতে হবে।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        password = request.data.get("password") or ""
        if len(password) < MIN_PASSWORD:
            return Response(
                {"error": f"পাসওয়ার্ড অন্তত {MIN_PASSWORD} অক্ষরের হতে হবে।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        granted = perms.clean(request.data.get("permissions"))
        try:
            with transaction.atomic():
                account = User.objects.create_user(
                    username=_username_for(employee),
                    email=(employee.email or "").strip() or None,
                    password=password,
                    first_name=employee.name[:30],
                )
                access = EmployeeAccess.objects.create(
                    employee=employee,
                    account=account,
                    permissions=granted,
                    is_enabled=True,
                )
        except IntegrityError:
            return Response(
                {"error": "লগইন বানানো গেল না, আবার চেষ্টা করুন।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(_represent(access), status=status.HTTP_201_CREATED)

    if access is None:
        return Response(
            {"error": "এই কর্মচারীর কোনো লগইন নেই।"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "DELETE":
        account = access.account
        access.delete()
        account.delete()
        return Response({"message": "লগইন বাতিল হয়েছে।"})

    # PATCH
    if "permissions" in request.data:
        access.permissions = perms.clean(request.data.get("permissions"))
    if "is_enabled" in request.data:
        access.is_enabled = bool(request.data.get("is_enabled"))
    access.save(update_fields=["permissions", "is_enabled", "updated_at"])

    password = request.data.get("password")
    if password:
        if len(password) < MIN_PASSWORD:
            return Response(
                {"error": f"পাসওয়ার্ড অন্তত {MIN_PASSWORD} অক্ষরের হতে হবে।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account = access.account
        account.set_password(password)
        account.save(update_fields=["password"])
        # Old tokens must die with the old password, or a revoked device keeps
        # working after the owner resets it.
        from rest_framework.authtoken.models import Token

        Token.objects.filter(user=account).delete()

    return Response(_represent(access))
