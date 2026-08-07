"""Paying staff: advances, balances, and who is ahead of their earnings.

The shape here follows how the money actually moves in a shop. Nobody runs
payroll once a month and stops — an assistant asks for ৳2,000 mid-month, takes
the rest after payday, and by the third month somebody has drawn more than they
have earned. So the system tracks two separate things:

  * what was earned  — `SalaryRecord`, one payslip per month
  * what was handed over — `SalaryPayment`, each time cash changed hands

and the difference is the answer to every question the owner asks.
"""

from decimal import Decimal, InvalidOperation

from banking.models import BankAccount, Transaction
from core.scoping import can, owner_for
from django.db import transaction as db_transaction
from django.db.models import Sum
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee, SalaryPayment, SalaryRecord, salary_ledger


def _needs_salary_permission(request):
    """Payroll is money and other people's pay — a plain sales login has no
    business in it. Returns the refusal, or None when the caller may proceed."""
    if can(request, "employees.salary"):
        return None
    return Response(
        {"error": "বেতনের হিসাব দেখার অনুমতি আপনার নেই।"},
        status=status.HTTP_403_FORBIDDEN,
    )


def _amount(value, field="amount"):
    try:
        out = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field} must be a number.")
    if out <= 0:
        raise ValueError(f"{field} must be more than zero.")
    return out


def _represent_payment(payment):
    return {
        "id": payment.id,
        "employee": payment.employee_id,
        "employee_name": payment.employee.name,
        "amount": float(payment.amount),
        "kind": payment.kind,
        "method": payment.method,
        "paid_on": payment.paid_on,
        "note": payment.note,
        "salary_record": payment.salary_record_id,
        "period": (
            f"{payment.salary_record.month} {payment.salary_record.year}"
            if payment.salary_record_id
            else None
        ),
        "created_at": payment.created_at,
    }


def _employee_row(employee, ledger=None):
    ledger = ledger or salary_ledger(employee)
    monthly = Decimal(str(employee.salary or 0))
    outstanding = Decimal(str(ledger["outstanding"]))
    return {
        "id": employee.id,
        "name": employee.name,
        "role": employee.role,
        "department": employee.department,
        "phone": employee.phone,
        "status": employee.status,
        "monthly_salary": float(monthly),
        "earned": float(ledger["earned"]),
        "paid": float(ledger["paid"]),
        # Positive → the shop owes him. Negative → he has drawn ahead.
        "outstanding": float(outstanding),
        "advance_taken": float(-outstanding) if outstanding < 0 else 0.0,
        "unsettled_advance": float(ledger["unsettled_advance"]),
        # From the prefetched list for the same reason as the ledger above —
        # an .order_by() here would re-hit the database per employee.
        "last_paid_on": max(
            (p.paid_on for p in employee.salary_payments.all()), default=None
        ),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payroll_overview(request):
    """Everyone's pay position in one table, plus the totals above it."""
    denied = _needs_salary_permission(request)
    if denied:
        return denied

    owner = owner_for(request)
    employees = (
        Employee.objects.filter(user=owner)
        .prefetch_related("salary_records", "salary_payments")
        .order_by("name")
    )
    rows = [_employee_row(e) for e in employees]

    monthly = sum(r["monthly_salary"] for r in rows)
    owed = sum(r["outstanding"] for r in rows if r["outstanding"] > 0)
    ahead = sum(r["advance_taken"] for r in rows)

    return Response(
        {
            "employees": rows,
            "summary": {
                "headcount": len(rows),
                "monthly_payroll": monthly,
                "owed_to_staff": owed,
                "drawn_in_advance": ahead,
                "paid_this_year": float(
                    SalaryPayment.objects.filter(employee__user=owner).aggregate(
                        total=Sum("amount")
                    )["total"]
                    or 0
                ),
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_payroll(request, employee_id):
    """One employee's payslips and every payment against them."""
    denied = _needs_salary_permission(request)
    if denied:
        return denied

    owner = owner_for(request)
    employee = Employee.objects.filter(id=employee_id, user=owner).first()
    if employee is None:
        return Response(
            {"error": "কর্মচারীটা পাওয়া যায়নি।"}, status=status.HTTP_404_NOT_FOUND
        )

    records = []
    for record in employee.salary_records.all().order_by("-year", "-id"):
        paid = record.payments.aggregate(total=Sum("amount"))["total"] or 0
        records.append(
            {
                "id": record.id,
                "period": f"{record.month} {record.year}",
                "month": record.month,
                "year": record.year,
                "net_salary": float(record.net_salary),
                "paid": float(paid),
                "due": float(Decimal(str(record.net_salary)) - Decimal(str(paid))),
                "status": record.status,
            }
        )

    payments = [
        _represent_payment(p)
        for p in employee.salary_payments.select_related(
            "employee", "salary_record"
        ).all()
    ]

    return Response(
        {
            "employee": _employee_row(employee),
            "records": records,
            "payments": payments,
        }
    )


def _pay_one(owner, employee, amount, kind, method, paid_on, note, account, record):
    """Record one payment and, when an account is named, move the money."""
    from django.utils import timezone

    # An explicit None from the request would override the model default and
    # hit the NOT NULL constraint, so today is filled in here instead.
    paid_on = paid_on or timezone.localdate()

    txn = None
    if account is not None:
        txn = Transaction.objects.create(
            account=account,
            type="debit",
            nature="expense",
            category="salary",
            amount=amount,
            purpose=f"{employee.name} — {'অগ্রিম' if kind == 'advance' else 'বেতন'}",
            status="verified",
        )
    return SalaryPayment.objects.create(
        employee=employee,
        salary_record=record,
        amount=amount,
        kind=kind,
        method=method,
        paid_on=paid_on,
        note=note or None,
        transaction=txn,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pay_salaries(request):
    """Pay one or several employees in a single action.

    The whole batch is one transaction: paying six people and failing on the
    seventh must not leave the books half-updated.
    """
    denied = _needs_salary_permission(request)
    if denied:
        return denied

    owner = owner_for(request)
    items = request.data.get("payments") or []
    if not isinstance(items, list) or not items:
        return Response(
            {"error": "কাকে কত দেবেন সেটা দিন।"}, status=status.HTTP_400_BAD_REQUEST
        )

    account = None
    account_id = request.data.get("account")
    if account_id:
        account = BankAccount.objects.filter(id=account_id, owner=owner).first()
        if account is None:
            return Response(
                {"error": "অ্যাকাউন্টটা পাওয়া যায়নি।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    method = request.data.get("method", "cash")
    paid_on = request.data.get("paid_on")
    note = request.data.get("note")

    created = []
    try:
        with db_transaction.atomic():
            for item in items:
                employee = Employee.objects.filter(
                    id=item.get("employee"), user=owner
                ).first()
                if employee is None:
                    raise ValueError(
                        f"কর্মচারী {item.get('employee')} পাওয়া যায়নি।"
                    )
                amount = _amount(item.get("amount"))
                kind = item.get("kind", "salary")
                if kind not in ("advance", "salary"):
                    raise ValueError("kind হবে advance বা salary।")

                record = None
                if item.get("salary_record"):
                    record = SalaryRecord.objects.filter(
                        id=item["salary_record"], employee=employee
                    ).first()
                    if record is None:
                        raise ValueError("বেতনের হিসাবটা পাওয়া যায়নি।")

                created.append(
                    _pay_one(
                        owner,
                        employee,
                        amount,
                        kind,
                        item.get("method", method),
                        item.get("paid_on", paid_on) or None,
                        item.get("note", note),
                        account,
                        record,
                    )
                )
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {
            "message": f"{len(created)} জনকে দেওয়া হয়েছে।",
            "payments": [_represent_payment(p) for p in created],
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_payment(request, payment_id):
    """Undo a payment entered by mistake, bank side included."""
    denied = _needs_salary_permission(request)
    if denied:
        return denied

    owner = owner_for(request)
    payment = SalaryPayment.objects.filter(
        id=payment_id, employee__user=owner
    ).first()
    if payment is None:
        return Response(
            {"error": "পেমেন্টটা পাওয়া যায়নি।"}, status=status.HTTP_404_NOT_FOUND
        )
    payment.delete()
    return Response({"message": "বাতিল হয়েছে।"})
