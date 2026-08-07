"""Everything one month cost the shop, itemised, in one payload.

The dashboard already shows a খরচ total, but a total is not something you can
hand to an accountant, argue with, or check against a bank statement. This is
the month opened up: which employee is owed how much and what they got, which
bill is due and whether it was settled, which loan instalment fell due.

**Two numbers per section, never one.** An earlier version reported only money
that had already left the till, so a shop that had not yet paid August's rent
or salaries got a report reading ৳0 while the card directly above it said
৳3,62,997. Both figures were "true" and the pair was useless. So every section
carries `due` (what the month costs, paid or not) and `paid` (what has actually
gone out), and the difference is the বাকি the shopkeeper has to plan for.

Built as one flat structure of titled sections rather than a nested tree, so
the print sheet on the front end can render it without knowing what any
particular section means. Adding a new cost type here needs no front-end change.

Everything is scoped to `user` — the shop owner — and every query filters on
it, because this report contains payroll, the most sensitive data the app holds.
"""

from datetime import date, timedelta
from decimal import Decimal

from banking.models import Loan, LoanPayment, RecurringCost, RecurringCostPayment, Transaction
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


def _taka(value):
    return f"৳{_fmt(value)}"


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


def _section(key, title, note, columns, rows, due, paid):
    outstanding = max(ZERO, _money(due) - _money(paid))
    return {
        "key": key,
        "title": title,
        "note": note,
        "columns": columns,
        "rows": rows,
        "due": float(_money(due)),
        "paid": float(_money(paid)),
        "outstanding": float(outstanding),
        "due_text": _taka(due),
        "paid_text": _taka(paid),
        "outstanding_text": _taka(outstanding),
        # What prints under the section's own table.
        "total_text": (
            f"দিতে হবে {_taka(due)} · দেওয়া হয়েছে {_taka(paid)}"
            + (f" · বাকি {_taka(outstanding)}" if outstanding else "")
        ),
        "count": len(rows),
    }


# ── the sections ────────────────────────────────────────────────────────


def _payroll(user, first, last):
    """Who is owed what this month, and what they actually got.

    Advances sit beside the salary rather than folded into it: an advance has
    already left the till this month, but it is repaid out of a later salary,
    so treating the two as one number is how a shop ends up paying twice.
    """
    payments = (
        SalaryPayment.objects.filter(employee__user=user, paid_on__range=(first, last))
        .select_related("employee")
        .order_by("paid_on")
    )

    per_employee = {}
    for payment in payments:
        row = per_employee.setdefault(
            payment.employee_id,
            {"employee": payment.employee, "salary": ZERO, "advance": ZERO, "dates": []},
        )
        if payment.kind == "advance":
            row["advance"] += payment.amount
        else:
            row["salary"] += payment.amount
        row["dates"].append(payment.paid_on)

    # Active staff who were paid nothing this month still belong here: their
    # salary is the month's largest cost whether or not it has gone out yet.
    active = Employee.objects.filter(user=user, status="active")
    for employee in active:
        per_employee.setdefault(
            employee.id,
            {"employee": employee, "salary": ZERO, "advance": ZERO, "dates": []},
        )

    active_ids = {employee.id for employee in active}
    rows = []
    due = paid = ZERO
    for entry in per_employee.values():
        employee = entry["employee"]
        got = entry["salary"] + entry["advance"]
        # Someone who left mid-month owes nothing going forward, but what they
        # were paid still counts against the month.
        owed = _money(employee.salary) if employee.id in active_ids else got
        due += owed
        paid += got
        rows.append(
            {
                "name": employee.name,
                "role": employee.role or "—",
                "monthly": _taka(owed),
                "salary_paid": _taka(entry["salary"]),
                "advance": _taka(entry["advance"]) if entry["advance"] else "—",
                "paid_on": (
                    max(entry["dates"]).strftime("%d-%m-%Y") if entry["dates"] else "—"
                ),
                "due": _taka(max(ZERO, owed - got)),
                "_owed": owed,
            }
        )
    rows.sort(key=lambda row: row["_owed"], reverse=True)
    for row in rows:
        row.pop("_owed")

    return _section(
        "payroll",
        "কর্মচারীর বেতন ও অগ্রিম",
        "এই মাসে যাদের বেতন দিতে হবে, আর যা যা দেওয়া হয়েছে। অগ্রিম পরের বেতন থেকে কাটা যাবে।",
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
        due,
        paid,
    )


def _fixed(user, first, last):
    """Rent and the other bills that fall due every month, settled or not.

    Listed from the RecurringCost itself rather than from its payments: an
    unpaid rent is the single most important line in the month's expenses, and
    reporting only payments made it disappear from the report on exactly the
    months it mattered most.
    """
    payments = list(
        RecurringCostPayment.objects.filter(
            cost__user=user, paid_on__range=(first, last)
        ).select_related("cost")
    )
    by_cost = {}
    for payment in payments:
        by_cost.setdefault(payment.cost_id, []).append(payment)

    rows = []
    due = paid = ZERO
    for cost in RecurringCost.objects.filter(user=user).order_by("-amount"):
        settled = by_cost.pop(cost.id, [])
        got = sum((payment.amount for payment in settled), ZERO)
        # A cost switched off, or started after this month, owes nothing —
        # but any payment recorded against it still counts.
        owes = cost.is_active and cost.start_date <= last
        owed = _money(cost.amount) if owes else got
        if not owes and not settled:
            continue

        due += owed
        paid += got
        if settled:
            state = "দেওয়া হয়েছে"
        elif not owes:
            state = "বন্ধ"
        else:
            due_on = cost.due_date
            state = "মেয়াদ পেরিয়েছে" if due_on < date.today() else "বাকি"
        rows.append(
            {
                "title": cost.title,
                "category": CATEGORY_BN.get(cost.category, cost.category or "—"),
                "monthly": _taka(owed),
                "paid": _taka(got),
                "date": (
                    max(payment.paid_on for payment in settled).strftime("%d-%m-%Y")
                    if settled
                    else f"{cost.due_day} তারিখে"
                ),
                "state": state,
            }
        )

    # Payments against a cost that has since been deleted still spent money.
    for orphans in by_cost.values():
        for payment in orphans:
            due += payment.amount
            paid += payment.amount
            rows.append(
                {
                    "title": payment.cost.title,
                    "category": CATEGORY_BN.get(payment.cost.category, "—"),
                    "monthly": _taka(payment.amount),
                    "paid": _taka(payment.amount),
                    "date": payment.paid_on.strftime("%d-%m-%Y"),
                    "state": "দেওয়া হয়েছে",
                }
            )

    return _section(
        "fixed",
        "অফিস ভাড়া, বিল ও নির্দিষ্ট খরচ",
        "প্রতি মাসে যেগুলো দিতেই হয় — দেওয়া হোক বা না হোক, এই মাসের হিসাবে ধরা।",
        [
            {"key": "title", "label": "খরচ"},
            {"key": "category", "label": "খাত"},
            {"key": "monthly", "label": "মাসিক টাকা", "numeric": True},
            {"key": "paid", "label": "দেওয়া হয়েছে", "numeric": True},
            {"key": "date", "label": "তারিখ"},
            {"key": "state", "label": "অবস্থা"},
        ],
        rows,
        due,
        paid,
    )


def _loans(user, first, last):
    """Instalments falling due inside the month, plus what was paid against them."""
    rows = []
    due = paid = ZERO
    settled_ids = set()

    for loan in Loan.objects.filter(user=user).order_by("lender"):
        for item in loan.schedule:
            if not (first <= item["due_date"] <= last):
                continue
            owed = _money(item["amount"])
            got = _money(item["paid_amount"] or 0)
            due += owed
            paid += got
            if item["payment_id"]:
                settled_ids.add(item["payment_id"])
            rows.append(
                {
                    "lender": loan.lender,
                    "number": f"{item['number']} নম্বর কিস্তি",
                    "monthly": _taka(owed),
                    "paid": _taka(got),
                    "date": (
                        item["paid_on"].strftime("%d-%m-%Y")
                        if item["paid_on"]
                        else item["due_date"].strftime("%d-%m-%Y")
                    ),
                    "state": {
                        "paid": "দেওয়া হয়েছে",
                        "overdue": "মেয়াদ পেরিয়েছে",
                        "upcoming": "বাকি",
                    }[item["state"]],
                }
            )

    # A payment made this month against an instalment due in another one is
    # still money that left this month.
    for payment in (
        LoanPayment.objects.filter(loan__user=user, paid_on__range=(first, last))
        .exclude(id__in=settled_ids)
        .select_related("loan")
    ):
        due += payment.amount
        paid += payment.amount
        rows.append(
            {
                "lender": payment.loan.lender,
                "number": "বাড়তি পেমেন্ট",
                "monthly": _taka(payment.amount),
                "paid": _taka(payment.amount),
                "date": payment.paid_on.strftime("%d-%m-%Y"),
                "state": "দেওয়া হয়েছে",
            }
        )

    return _section(
        "loan",
        "লোনের কিস্তি",
        "এই মাসে যেসব কিস্তির তারিখ পড়েছে।",
        [
            {"key": "lender", "label": "কার কাছ থেকে"},
            {"key": "number", "label": "কিস্তি"},
            {"key": "monthly", "label": "কিস্তির টাকা", "numeric": True},
            {"key": "paid", "label": "দেওয়া হয়েছে", "numeric": True},
            {"key": "date", "label": "তারিখ"},
            {"key": "state", "label": "অবস্থা"},
        ],
        rows,
        due,
        paid,
    )


def _incentives(user, first, last):
    """Bonuses actually awarded — there is no "due" bonus to plan for."""
    rows = []
    total = ZERO
    for incentive in (
        Incentive.objects.filter(
            employee__user=user, status="paid", date_awarded__date__range=(first, last)
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
                "amount": _taka(incentive.amount),
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
        total,
    )


def _other(user, first, last):
    """Bank and cash debits that are not payroll, not a fixed bill, not a loan.

    The same exclusions as the analytics খরচ total, and for the same reason:
    those three are reported from their own tables, so counting the matching
    transaction as well would charge the shop twice for one payment.
    """
    debits = (
        Transaction.objects.filter(
            account__owner=user, type="debit", date__date__range=(first, last)
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
                "amount": _taka(txn.amount),
            }
        )
    return _section(
        "other",
        "ব্যাংকিং ও অন্যান্য খরচ",
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
        total,
    )


# ── the report ──────────────────────────────────────────────────────────


def build(user, month=None, today=None):
    first, last, label = month_bounds(month, today)

    sections = [
        _payroll(user, first, last),
        _fixed(user, first, last),
        _loans(user, first, last),
        _incentives(user, first, last),
        _other(user, first, last),
    ]

    due = sum((Decimal(str(section["due"])) for section in sections), ZERO)
    settled = sum((Decimal(str(section["paid"])) for section in sections), ZERO)
    outstanding = max(ZERO, due - settled)

    closed = business_days.closed_weekdays(user)
    open_days = business_days.open_days_between(first, last, closed)

    profile = (
        UserProfile.objects.filter(user=user).only("company", "company_address").first()
    )
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
                "amount": section["due"],
                "amount_text": section["due_text"],
                "paid_text": section["paid_text"],
                "count": section["count"],
            }
            for section in sections
        ],
        # A section with no rows has nothing to say; one with rows but no money
        # yet is exactly the case this report exists for.
        "sections": [section for section in sections if section["rows"]],
        "grand_total": float(_money(due)),
        "grand_total_text": _taka(due),
        "paid_total_text": _taka(settled),
        "outstanding_total_text": _taka(outstanding),
        # What the shop had to earn, on the days it was open, just to cover it.
        "per_open_day_text": _taka(due / open_days if open_days else ZERO),
    }


def months_available(user, back=12, today=None):
    """The month picker's options — this month and the previous `back`."""
    today = today or date.today()
    out = []
    year, month = today.year, today.month
    for _ in range(back + 1):
        out.append(
            {"key": f"{year}-{month:02d}", "label": f"{MONTHS_BN[month - 1]} {year}"}
        )
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return out
