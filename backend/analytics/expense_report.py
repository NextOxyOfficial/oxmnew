"""Everything one month cost the shop, itemised, in one payload.

The dashboard already shows a খরচ total, but a total is not something you can
hand to an accountant, argue with, or check against a bank statement. This is
the month opened up: which employee got how much and when, which bill was paid
on which date, which loan instalment went out — each as its own row under its
own heading.

Built as one flat structure of titled sections rather than a nested tree, so
the print sheet on the front end can render it without knowing what any
particular section means. Adding a new cost type here needs no front-end change.

Everything is scoped to `user` — the shop owner — and every query filters on it,
because this report contains payroll, which is the most sensitive data the app
holds.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Q

from banking.models import LoanPayment, RecurringCostPayment, Transaction
from core import business_days
from core.models import UserProfile
from employees.models import Employee, Incentive, SalaryPayment

ZERO = Decimal("0.00")

MONTHS_BN = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
]

CATEGORY_BN = {
    "rent": "ভাড়া",
    "utility": "বিল",
    "internet": "ইন্টারনেট",
    "salary": "বেতন",
    "purchase": "মালামাল কেনা",
    "transport": "পরিবহন",
    "maintenance": "মেরামত",
    "marketing": "বিজ্ঞাপন",
    "tax": "ট্যাক্স",
    "other": "অন্যান্য",
}


def _money(value):
    return Decimal(value or 0).quantize(Decimal("0.01"))


def _fmt(value):
    """Lakh-crore grouping in Latin digits: 12,34,567 — how a Bangladeshi
    shopkeeper reads money. Python's own `{:,}` gives 1,234,567 instead."""
    whole = int(Decimal(value or 0))
    sign = "-" if whole < 0 else ""
    digits = str(abs(whole))
    if len(digits) <= 3:
        return sign + digits
    head, tail = digits[:-3], digits[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return sign + ",".join(parts + [tail])


def month_bounds(key=None, today=None):
    """(first, last, label) for a "YYYY-MM" key, defaulting to this month.

    An unparseable key falls back to the current month rather than erroring: a
    stale bookmark should still print a report.
    """
    today = today or date.today()
    year, month = today.year, today.month
    if key:
        try:
            year, month = (int(part) for part in str(key).split("-")[:2])
            if not 1 <= month <= 12:
                raise ValueError
        except (TypeError, ValueError):
            year, month = today.year, today.month

    first = date(year, month, 1)
    last = (
        date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    ) - timedelta(days=1)
    return first, last, f"{MONTHS_BN[month - 1]} {year}"


def _section(key, title, note, columns, rows, total):
    return {
        "key": key,
        "title": title,
        "note": note,
        "columns": columns,
        "rows": rows,
        "total": float(_money(total)),
        "total_text": f"৳{_fmt(total)}",
        "count": len(rows),
    }


# ── the sections ────────────────────────────────────────────────────────


def _payroll(user, first, last):
    """Who was paid what, and what is still owed — per employee, one row each.

    Advances are shown beside the salary rather than folded into it: an advance
    already left the till this month, but it is repaid out of a later salary, so
    treating the two as one number is how a shop ends up paying twice.
    """
    payments = (
        SalaryPayment.objects.filter(
            employee__user=user, paid_on__range=(first, last)
        )
        .select_related("employee")
        .order_by("paid_on")
    )

    per_employee = {}
    for payment in payments:
        row = per_employee.setdefault(
            payment.employee_id,
            {
                "employee": payment.employee,
                "salary": ZERO,
                "advance": ZERO,
                "dates": [],
            },
        )
        if payment.kind == "advance":
            row["advance"] += payment.amount
        else:
            row["salary"] += payment.amount
        row["dates"].append(payment.paid_on)

    # Active staff who were paid nothing this month still belong in the report:
    # a blank row is the evidence that a salary is outstanding.
    for employee in Employee.objects.filter(user=user, status="active"):
        per_employee.setdefault(
            employee.id,
            {"employee": employee, "salary": ZERO, "advance": ZERO, "dates": []},
        )

    rows = []
    for entry in per_employee.values():
        employee = entry["employee"]
        paid = entry["salary"] + entry["advance"]
        monthly = _money(employee.salary)
        rows.append(
            {
                "name": employee.name,
                "role": employee.role or "—",
                "monthly": f"৳{_fmt(monthly)}",
                "salary_paid": f"৳{_fmt(entry['salary'])}",
                "advance": f"৳{_fmt(entry['advance'])}" if entry["advance"] else "—",
                "paid_on": (
                    max(entry["dates"]).strftime("%d-%m-%Y") if entry["dates"] else "—"
                ),
                "due": f"৳{_fmt(max(ZERO, monthly - paid))}",
                "_total": paid,
            }
        )
    rows.sort(key=lambda row: row["_total"], reverse=True)
    total = sum((row.pop("_total") for row in rows), ZERO)

    return _section(
        "payroll",
        "কর্মচারীর বেতন ও অগ্রিম",
        "এই মাসে যা দেওয়া হয়েছে। অগ্রিম পরের বেতন থেকে কাটা যাবে।",
        [
            {"key": "name", "label": "কর্মচারী"},
            {"key": "role", "label": "পদ"},
            {"key": "monthly", "label": "মাসিক বেতন", "numeric": True},
            {"key": "salary_paid", "label": "বেতন দেওয়া", "numeric": True},
            {"key": "advance", "label": "অগ্রিম", "numeric": True},
            {"key": "paid_on", "label": "শেষ পেমেন্ট"},
            {"key": "due", "label": "বাকি", "numeric": True},
        ],
        rows,
        total,
    )


def _incentives(user, first, last):
    rows = []
    total = ZERO
    for incentive in (
        Incentive.objects.filter(
            employee__user=user,
            status="paid",
            date_awarded__date__range=(first, last),
        )
        .select_related("employee")
        .order_by("date_awarded")
    ):
        total += incentive.amount
        rows.append(
            {
                "name": incentive.employee.name,
                "title": incentive.title,
                "date": incentive.date_awarded.strftime("%d-%m-%Y"),
                "amount": f"৳{_fmt(incentive.amount)}",
            }
        )
    return _section(
        "incentive",
        "ইনসেনটিভ ও বোনাস",
        "বেতনের বাইরে যা দেওয়া হয়েছে।",
        [
            {"key": "name", "label": "কর্মচারী"},
            {"key": "title", "label": "কারণ"},
            {"key": "date", "label": "তারিখ"},
            {"key": "amount", "label": "টাকা", "numeric": True},
        ],
        rows,
        total,
    )


def _fixed(user, first, last):
    rows = []
    total = ZERO
    for payment in (
        RecurringCostPayment.objects.filter(
            cost__user=user, paid_on__range=(first, last)
        )
        .select_related("cost")
        .order_by("paid_on")
    ):
        total += payment.amount
        rows.append(
            {
                "title": payment.cost.title,
                "category": CATEGORY_BN.get(payment.cost.category, payment.cost.category or "—"),
                "period": f"{MONTHS_BN[payment.period.month - 1]} {payment.period.year}",
                "date": payment.paid_on.strftime("%d-%m-%Y"),
                "amount": f"৳{_fmt(payment.amount)}",
            }
        )
    return _section(
        "fixed",
        "অফিস ভাড়া, বিল ও নির্দিষ্ট খরচ",
        "প্রতি মাসে যেগুলো দিতেই হয়।",
        [
            {"key": "title", "label": "খরচ"},
            {"key": "category", "label": "খাত"},
            {"key": "period", "label": "কোন মাসের"},
            {"key": "date", "label": "পেমেন্টের তারিখ"},
            {"key": "amount", "label": "টাকা", "numeric": True},
        ],
        rows,
        total,
    )


def _loans(user, first, last):
    rows = []
    total = ZERO
    for payment in (
        LoanPayment.objects.filter(loan__user=user, paid_on__range=(first, last))
        .select_related("loan")
        .order_by("paid_on")
    ):
        total += payment.amount
        rows.append(
            {
                "lender": payment.loan.lender,
                "reference": payment.reference or "—",
                "date": payment.paid_on.strftime("%d-%m-%Y"),
                "amount": f"৳{_fmt(payment.amount)}",
            }
        )
    return _section(
        "loan",
        "লোনের কিস্তি",
        "এই মাসে যত কিস্তি দেওয়া হয়েছে।",
        [
            {"key": "lender", "label": "কার কাছ থেকে"},
            {"key": "reference", "label": "রেফারেন্স"},
            {"key": "date", "label": "তারিখ"},
            {"key": "amount", "label": "টাকা", "numeric": True},
        ],
        rows,
        total,
    )


def _other(user, first, last):
    """Bank debits that are not payroll, not a fixed bill, not a loan.

    The same exclusions as the analytics খরচ total, and for the same reason:
    those three are reported from their own tables, so counting the matching
    transaction as well would charge the shop twice for one payment.
    """
    debits = (
        Transaction.objects.filter(
            account__owner=user,
            type="debit",
            date__date__range=(first, last),
        )
        .exclude(status="cancelled")
        .exclude(nature="withdrawal")
        .filter(loan_payment__isnull=True, recurring_payment__isnull=True)
        .select_related("account")
        .order_by("date")
    )

    rows = []
    total = ZERO
    for txn in debits:
        total += txn.amount
        rows.append(
            {
                "date": txn.date.strftime("%d-%m-%Y"),
                "purpose": txn.purpose or "—",
                "category": CATEGORY_BN.get(txn.category, txn.category or "খাত দেওয়া হয়নি"),
                "account": txn.account.name if txn.account else "—",
                "amount": f"৳{_fmt(txn.amount)}",
            }
        )
    return _section(
        "other",
        "অন্যান্য খরচ",
        "ব্যাংক ও ক্যাশ থেকে যেসব টাকা বেরিয়েছে।",
        [
            {"key": "date", "label": "তারিখ"},
            {"key": "purpose", "label": "কী বাবদ"},
            {"key": "category", "label": "খাত"},
            {"key": "account", "label": "অ্যাকাউন্ট"},
            {"key": "amount", "label": "টাকা", "numeric": True},
        ],
        rows,
        total,
    )


# ── the report ──────────────────────────────────────────────────────────


def build(user, month=None, today=None):
    first, last, label = month_bounds(month, today)

    sections = [
        _payroll(user, first, last),
        _incentives(user, first, last),
        _fixed(user, first, last),
        _loans(user, first, last),
        _other(user, first, last),
    ]

    grand = sum((Decimal(str(section["total"])) for section in sections), ZERO)
    closed = business_days.closed_weekdays(user)
    open_days = business_days.open_days_between(first, last, closed)

    profile = UserProfile.objects.filter(user=user).only("company", "company_address").first()
    shop = (profile.company or "").strip() if profile else ""

    return {
        "month": {
            "key": f"{first.year}-{first.month:02d}",
            "label": label,
            "start": first.isoformat(),
            "end": last.isoformat(),
        },
        "shop": {
            "name": shop or (user.get_full_name() or user.username),
            "address": (profile.company_address or "").strip() if profile else "",
        },
        "calendar": {
            "days": (last - first).days + 1,
            "open_days": open_days,
            "closed_label": business_days.describe(closed),
        },
        "summary": [
            {
                "key": section["key"],
                "label": section["title"],
                "amount": section["total"],
                "amount_text": section["total_text"],
                "count": section["count"],
            }
            for section in sections
        ],
        "sections": [section for section in sections if section["rows"]],
        "grand_total": float(_money(grand)),
        "grand_total_text": f"৳{_fmt(grand)}",
        # What the shop had to earn, on the days it was open, just to cover this.
        "per_open_day_text": f"৳{_fmt(grand / open_days if open_days else ZERO)}",
    }


def months_available(user, back=12, today=None):
    """The month picker's options — this month and the previous `back`."""
    today = today or date.today()
    out = []
    year, month = today.year, today.month
    for _ in range(back + 1):
        out.append({"key": f"{year}-{month:02d}", "label": f"{MONTHS_BN[month - 1]} {year}"})
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return out
