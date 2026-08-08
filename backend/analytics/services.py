"""Business analytics: where the money came from, where it went, and what to do.

Deliberately rule-based, not statistical. A shopkeeper needs an answer they can
act on today ("collect from these four customers"), and a rule they can check by
hand is one they will trust. Every number here traces back to a row they entered.
"""

from decimal import Decimal

from django.db.models import DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce

from banking.models import (
    Loan,
    LoanPayment,
    RecurringCost,
    RecurringCostPayment,
    Transaction,
)
from customers.models import Customer
from employees.models import Employee, Incentive, SalaryRecord
from orders.models import Order
from products.models import Product
from vehicles.models import Vehicle

from core import business_days

from . import periods

ZERO = Decimal("0")

# Orders in these states never happened as far as the books are concerned.
DEAD_ORDER_STATES = ["cancelled", "refunded", "draft"]

CATEGORY_LABELS = {
    "rent": "ভাড়া",
    "utilities": "বিদ্যুৎ-গ্যাস-পানি",
    "internet": "ইন্টারনেট / ফোন",
    "salary": "বেতন",
    "transport": "যাতায়াত",
    "marketing": "মার্কেটিং",
    "supplies": "টুকিটাকি জিনিস",
    "maintenance": "মেরামত",
    "tax": "ট্যাক্স / ফি",
    "other": "অন্যান্য",
    "": "খাত দেওয়া হয়নি",
}


def _money(value):
    """Everything leaving this module is a plain float — the API layer would
    otherwise ship Decimals as strings and the frontend maths would go wrong."""
    return float(value or 0)


def _sum(queryset, field="amount"):
    return queryset.aggregate(
        total=Coalesce(Sum(field), Value(ZERO), output_field=DecimalField())
    )["total"] or ZERO


def _change(current, previous):
    """Percent change, and a direction the UI can colour.

    Growing from zero is reported as None rather than infinity — "up ∞%" tells
    the user nothing.
    """
    current, previous = Decimal(str(current)), Decimal(str(previous))
    if previous == 0:
        return {
            "current": _money(current),
            "previous": 0.0,
            "change": _money(current),
            "change_pct": None,
        }
    delta = current - previous
    return {
        "current": _money(current),
        "previous": _money(previous),
        "change": _money(delta),
        "change_pct": round(float(delta / previous * 100), 1),
    }


# ── the pieces ──────────────────────────────────────────────────────────


def sales_for(user, begin, finish):
    orders = Order.objects.filter(user=user, created_at__range=(begin, finish)).exclude(
        status__in=DEAD_ORDER_STATES
    )
    revenue = _sum(orders, "total_amount")
    cogs = _sum(orders, "total_buy_price")
    count = orders.count()
    return {
        "revenue": revenue,
        "cogs": cogs,
        "gross_profit": revenue - cogs,
        "orders_count": count,
        "avg_order_value": (revenue / count) if count else ZERO,
        "collected": _sum(orders, "paid_amount"),
    }


def costs_for(user, begin, finish):
    """Money spent, split the way the user asked: খরচ and পেমেন্ট side by side."""
    debits = (
        Transaction.objects.filter(
            account__owner=user,
            type="debit",
            date__range=(begin, finish),
        )
        .exclude(status="cancelled")
        # Loan installments are reported from LoanPayment instead; counting the
        # transaction as well would charge the shop twice for the same money.
        .filter(loan_payment__isnull=True)
        # A withdrawal takes the shop's own money out; it is not a business
        # cost, so it never reaches the expense report.
        .exclude(nature="withdrawal")
        # Fixed monthly bills are reported from RecurringCostPayment; counting
        # the transaction too would charge the shop twice.
        .filter(recurring_payment__isnull=True)
    )

    # "other" is still money that left the till, so it rides with খরচ rather
    # than falling out of the total unnoticed.
    expense = _sum(debits.filter(Q(nature="expense") | Q(nature="other")))
    payment = _sum(debits.filter(nature="payment"))
    # Rows entered before the nature field existed. Counted as cost (the money
    # did leave), but surfaced separately so the user knows to classify them.
    unclassified = _sum(debits.filter(Q(nature="") | Q(nature__isnull=True)))

    salaries = _sum(
        SalaryRecord.objects.filter(
            employee__user=user, status="paid", payment_date__range=(begin, finish)
        ),
        "net_salary",
    )
    incentives = _sum(
        Incentive.objects.filter(
            employee__user=user, status="paid", date_awarded__range=(begin, finish)
        )
    )
    loan_paid = _sum(
        LoanPayment.objects.filter(
            loan__user=user, paid_on__range=(begin.date(), finish.date())
        )
    )
    recurring_paid = _sum(
        RecurringCostPayment.objects.filter(
            cost__user=user, paid_on__range=(begin.date(), finish.date())
        )
    )

    by_category = []
    rows = (
        debits.values("category")
        .annotate(total=Coalesce(Sum("amount"), Value(ZERO), output_field=DecimalField()))
        .order_by("-total")
    )
    for row in rows:
        key = row["category"] or ""
        by_category.append(
            {
                "category": key,
                # A category the user typed themselves is not "অন্যান্য" — it is
                # whatever they named it. Only the known keys get translated;
                # anything else is shown verbatim, which is the whole point of
                # letting them add their own.
                "label": CATEGORY_LABELS.get(key, key or "খাত দেওয়া হয়নি"),
                "amount": _money(row["total"]),
            }
        )
    # Payroll never passes through a bank transaction row, so it is appended
    # rather than aggregated — otherwise the breakdown would not add up to the
    # total the user sees above it.
    if salaries:
        by_category.append(
            {"category": "salary", "label": CATEGORY_LABELS["salary"], "amount": _money(salaries)}
        )
    if incentives:
        by_category.append(
            {"category": "incentive", "label": "ইনসেনটিভ", "amount": _money(incentives)}
        )
    if loan_paid:
        by_category.append(
            {"category": "loan", "label": "লোনের কিস্তি", "amount": _money(loan_paid)}
        )
    if recurring_paid:
        by_category.append(
            {
                "category": "recurring",
                "label": "অফিস ভাড়া ও নির্দিষ্ট খরচ",
                "amount": _money(recurring_paid),
            }
        )
    by_category.sort(key=lambda row: row["amount"], reverse=True)

    total = (
        expense + payment + unclassified + salaries + incentives + loan_paid
        + recurring_paid
    )
    return {
        "expense": expense,
        "payment": payment,
        "unclassified": unclassified,
        "salaries": salaries,
        "incentives": incentives,
        "loan": loan_paid,
        "recurring": recurring_paid,
        "total": total,
        "by_category": by_category,
    }


def receivables_for(user, limit=8):
    """Who owes money, oldest first — this is the তাগাদা list.

    Not period-scoped on purpose: an unpaid bill from three months ago is more
    urgent than one from yesterday, and filtering it out of the current window
    would hide exactly the debt that needs chasing.
    """
    unpaid = (
        Order.objects.filter(user=user, total_amount__gt=F("paid_amount"))
        .exclude(status__in=DEAD_ORDER_STATES)
        .select_related("customer")
        .order_by("created_at")
    )

    by_customer = {}
    for order in unpaid:
        key = order.customer_id or f"guest:{order.customer_name or order.order_number}"
        due = order.total_amount - order.paid_amount
        entry = by_customer.setdefault(
            key,
            {
                "customer_id": order.customer_id,
                "name": (order.customer.name if order.customer else order.customer_name)
                or "নাম নেই",
                "phone": (order.customer.phone if order.customer else order.customer_phone),
                "due": ZERO,
                "orders": 0,
                "oldest": order.created_at,
            },
        )
        entry["due"] += due
        entry["orders"] += 1
        if order.created_at < entry["oldest"]:
            entry["oldest"] = order.created_at

    rows = sorted(by_customer.values(), key=lambda r: r["due"], reverse=True)
    total = sum((r["due"] for r in rows), ZERO)

    return {
        "total": total,
        "customers_count": len(rows),
        "top": [
            {
                "customer_id": r["customer_id"],
                "name": r["name"],
                "phone": r["phone"],
                "due": _money(r["due"]),
                "orders": r["orders"],
                "oldest": r["oldest"].date().isoformat(),
            }
            for r in rows[:limit]
        ],
    }


def inventory_for(user):
    """Money sitting on the shelf. Stock is not a loss, but it is cash you
    cannot spend, which is why it belongs next to the profit figure."""
    products = Product.objects.filter(user=user, is_active=True)
    product_value = products.aggregate(
        total=Coalesce(
            Sum(F("stock") * F("buy_price"), output_field=DecimalField()),
            Value(ZERO),
            output_field=DecimalField(),
        )
    )["total"] or ZERO

    bikes = Vehicle.objects.filter(user=user, status="in_stock")
    bike_value = _sum(bikes, "buy_price")

    return {
        "product_value": product_value,
        "vehicle_value": bike_value,
        "vehicle_count": bikes.count(),
        "total": product_value + bike_value,
    }


def dead_stock_for(user, begin, finish, limit=6):
    """Products holding money that did not move in this period."""
    sold_ids = set(
        Order.objects.filter(user=user, created_at__range=(begin, finish))
        .exclude(status__in=DEAD_ORDER_STATES)
        .values_list("items__product_id", flat=True)
    )
    rows = (
        Product.objects.filter(user=user, is_active=True, stock__gt=0)
        .exclude(id__in=[pid for pid in sold_ids if pid])
        .annotate(tied=F("stock") * F("buy_price"))
        .order_by("-tied")[:limit]
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "stock": p.stock,
            "tied_up": _money(p.stock * p.buy_price),
        }
        for p in rows
    ]


# ── the brain ───────────────────────────────────────────────────────────


def charged_costs_for(costs, commitment, open_days, open_month_days):
    """What the window's trading actually has to carry.

    A month's rent is paid on one day, but it is not that day's cost — it buys
    the whole month. Charging it to the day it left the bank produced a shop
    that "lost ৳56,961 today" and needed ৳3,05,655 of sales to break even,
    while the day before and after looked free. The number moved with the
    landlord's calendar, not with the shop's trading.

    So costs are split by how they behave, not by where they are stored:

    * **periodic** — rent, bills, payroll, loan instalments. Owed every month
      regardless of trading, so each open day carries its share of the month.
    * **variable** — stock, transport, repairs, a bonus. Spent on a day
      because of that day, so charged to it.

    Payroll comes from the commitment (what the staff are owed) rather than
    from salary payments, which is why salary rows are not in `variable`:
    counting both would charge the shop twice for the same wages — exactly the
    double count this replaced, where rent was billed once as cash out and
    again as its monthly share.
    """
    variable = (
        costs["expense"] + costs["payment"] + costs["unclassified"]
        + costs["incentives"]
    )
    # `commitment` has already been through _money, so it arrives as a float
    # while `costs` is still Decimal. Everything is normalised here rather than
    # leaving the mix to bite whichever caller multiplies first.
    month_days = Decimal(open_month_days or 30)
    monthly_total = Decimal(str(commitment["total"] or 0))
    daily_share = monthly_total / month_days
    periodic = daily_share * Decimal(open_days or 0)
    variable = Decimal(str(variable or 0))

    # Decimal out, not float: these feed the same arithmetic as `costs`, and
    # _money() is applied once at the response boundary.
    return {
        "variable": variable,
        "periodic": periodic,
        "daily_share": daily_share,
        "total": variable + periodic,
    }


def build_targets(sales, charged, day_count):
    """What the shop must sell per open day just to stop losing money.

    Break-even is driven by gross margin, not by revenue: selling more at a thin
    margin can raise turnover and still lose money, which is exactly the trap
    this is meant to expose.

    `charged` comes from `charged_costs_for`, so the monthly commitments are
    already spread — this function must never add them again.

    `day_count` is the number of *trading* days in the window, never its length
    — see core.business_days. A shop closed on Fridays still owes a full
    month's rent, so those costs have to be recovered across the days it is
    actually open, or the target is one it can never hit.
    """
    revenue = sales["revenue"]
    margin_ratio = (sales["gross_profit"] / revenue) if revenue else ZERO
    daily_cost = charged["total"] / day_count if day_count else ZERO

    if margin_ratio > 0:
        breakeven_daily = daily_cost / margin_ratio
    else:
        breakeven_daily = ZERO

    daily_revenue = revenue / day_count if day_count else ZERO
    # A modest, reachable goal rather than an arbitrary round number: cover the
    # costs, then a fifth again on top as actual earnings.
    profit_target_daily = daily_cost * Decimal("0.2")
    target_daily_revenue = (
        (daily_cost + profit_target_daily) / margin_ratio if margin_ratio > 0 else ZERO
    )

    return {
        # The honest target: costs are covered by profit, whatever was sold to
        # earn it. Revenue only works as a target when the margin is a single
        # number, and for a shop selling both bikes and parts it is not.
        "daily_profit_needed": _money(daily_cost),
        "daily_profit": _money(
            sales["gross_profit"] / day_count if day_count else ZERO
        ),
        "profit_gap": _money(
            (sales["gross_profit"] / day_count if day_count else ZERO) - daily_cost
        ),
        "daily_cost": _money(daily_cost),
        "daily_revenue": _money(daily_revenue),
        "breakeven_daily_revenue": _money(breakeven_daily),
        "target_daily_revenue": _money(target_daily_revenue),
        "margin_pct": round(float(margin_ratio * 100), 1),
        "gap": _money(daily_revenue - breakeven_daily),
        # With no costs recorded there is nothing to fall short of, so a shop
        # that has simply not entered its expenses yet is not "behind target".
        "on_track": (
            (sales["gross_profit"] / day_count if day_count else ZERO) >= daily_cost
        ),
        "has_margin": margin_ratio > 0,
        "has_costs": charged["total"] > 0,
        # The monthly commitments' share of one open day, named so the UI can
        # explain where a target came from without redoing the arithmetic.
        "monthly_share_daily": _money(charged["daily_share"]),
        "variable_daily": _money(
            charged["variable"] / day_count if day_count else ZERO
        ),
        # Kept under the old name: the analytics screen labels this row.
        "loan_share_daily": _money(charged["daily_share"]),
        "open_days": day_count,
    }


def build_focus(
    sales, costs, net_profit, targets, receivables, dead_stock, comparison, loans,
    fixed,
):
    """The "what should I do about it" list, most urgent first.

    Each item names the number that triggered it so the user can verify the
    advice instead of trusting it.
    """
    signals = []

    def add(severity, title, detail, action, topic=None):
        signals.append(
            {
                "severity": severity,
                "title": title,
                "detail": detail,
                "action": action,
                # Names the drill-down this signal can open. None means the
                # headline already says everything there is to say.
                "topic": topic,
            }
        )

    revenue = sales["revenue"]

    # 1. The headline: are we losing money at all?
    if net_profit < 0:
        biggest = costs["by_category"][0] if costs["by_category"] else None
        add(
            "danger",
            "এই সময়টায় লোকসান হয়েছে",
            "বিক্রি থেকে লাভ %s, কিন্তু খরচ %s। ঘাটতি %s।"
            % (
                f"{_money(sales['gross_profit']):,.0f}",
                f"{_money(costs['total']):,.0f}",
                f"{abs(_money(net_profit)):,.0f}",
            ),
            (
                "সবচেয়ে বড় খরচ %s (%s টাকা) — এটা কমানো যায় কিনা দেখুন।"
                % (biggest["label"], f"{biggest['amount']:,.0f}")
                if biggest
                else "খরচগুলো ব্যাংকিং-এ তুলুন, তাহলে কোথায় বেশি যাচ্ছে বোঝা যাবে।"
            ),
            topic="costs",
        )

    # 2. Thin or negative margin — the quiet killer.
    if revenue > 0 and targets["margin_pct"] < 10:
        add(
            "danger" if targets["margin_pct"] < 0 else "warn",
            "লাভের হার খুব কম (%.1f%%)" % targets["margin_pct"],
            "100 টাকা বিক্রিতে মাত্র %.1f টাকা থাকছে। বেশি বিক্রি করেও লোকসান হতে পারে।"
            % targets["margin_pct"],
            "কেনা দাম কমান, নয়তো বিক্রির দাম বাড়ান। কোন প্রোডাক্টে মার্জিন কম সেটা নিচে দেখুন।",
            topic="low_margin",
        )

    # 3. Not selling enough to cover the running cost.
    if targets["has_margin"] and not targets["on_track"] and targets["breakeven_daily_revenue"]:
        add(
            "warn",
            "দিনে যা বিক্রি দরকার তা হচ্ছে না",
            "খরচ উঠতে দিনে %s টাকা বিক্রি লাগে, হচ্ছে %s টাকা।"
            % (
                f"{targets['breakeven_daily_revenue']:,.0f}",
                f"{targets['daily_revenue']:,.0f}",
            ),
            "প্রতিদিন আরও %s টাকা বিক্রি করতে হবে।"
            % f"{abs(targets['gap']):,.0f}",
            topic="targets",
        )

    # 4. Money already earned but not collected.
    if receivables["total"] > 0:
        top = receivables["top"][0] if receivables["top"] else None
        add(
            "warn" if receivables["total"] < revenue else "danger",
            "বাকি টাকা আটকে আছে",
            "%d জন কাস্টমারের কাছে মোট %s টাকা পাওনা।"
            % (receivables["customers_count"], f"{_money(receivables['total']):,.0f}"),
            (
                "সবচেয়ে বেশি বাকি %s (%s টাকা) — আগে তাকে তাগাদা দিন।"
                % (top["name"], f"{top['due']:,.0f}")
                if top
                else "তাগাদার তালিকা নিচে আছে।"
            ),
            topic="receivables",
        )

    # 4b. A missed installment is the most expensive kind of late payment.
    if loans["overdue_count"]:
        add(
            "danger",
            "লোনের কিস্তি বাকি পড়ে গেছে",
            "%d টা লোনের কিস্তি সময়মতো দেওয়া হয়নি, মোট %s টাকা।"
            % (loans["overdue_count"], f"{_money(loans['overdue_amount']):,.0f}"),
            "দেরি হলে জরিমানা বাড়ে — আগে এগুলো শোধ করুন।",
            topic="loans",
        )
    elif loans["monthly_due"]:
        add(
            "info",
            "প্রতি মাসে লোনের কিস্তি দিতে হয়",
            "মাসে %s টাকা কিস্তি, এখনো %s টাকা বাকি আছে।"
            % (
                f"{_money(loans['monthly_due']):,.0f}",
                f"{_money(loans['outstanding']):,.0f}",
            ),
            "দিনের টার্গেটে এই কিস্তিটাও ধরা আছে।",
            topic="loans",
        )

    # 4c. Rent and other fixed bills that have not been settled this month.
    if fixed["overdue_count"]:
        add(
            "danger",
            "মাসিক খরচ বাকি পড়ে গেছে",
            "%d টা নির্দিষ্ট খরচের টাকা এখনো দেওয়া হয়নি, মোট %s টাকা।"
            % (fixed["overdue_count"], f"{_money(fixed['unpaid_amount']):,.0f}"),
            "অফিস ভাড়ার পেজ থেকে শোধ করে দিন।",
            topic="fixed_costs",
        )

    # 5. Costs outrunning sales.
    rev_change = comparison["revenue"]["change_pct"]
    cost_change = comparison["cost"]["change_pct"]
    if rev_change is not None and cost_change is not None and cost_change > rev_change + 5:
        add(
            "warn",
            "বিক্রির চেয়ে খরচ দ্রুত বাড়ছে",
            "বিক্রি বেড়েছে %.1f%%, খরচ বেড়েছে %.1f%%।" % (rev_change, cost_change),
            "নতুন কোন খরচ যোগ হয়েছে খরচের ভাঙনে দেখে নিন।",
            topic="costs",
        )

    # 6. Stock that is not moving.
    if dead_stock:
        stuck = sum(row["tied_up"] for row in dead_stock)
        add(
            "info",
            "কিছু প্রোডাক্ট বিক্রি হচ্ছে না",
            "%d টা প্রোডাক্টে %s টাকা আটকে আছে, এই সময়ে একটাও বিক্রি হয়নি।"
            % (len(dead_stock), f"{stuck:,.0f}"),
            "ছাড় দিয়ে ছেড়ে দিন, নইলে টাকাটা স্টকেই পড়ে থাকবে।",
            topic="dead_stock",
        )

    # 7. Unclassified spending makes every other number less trustworthy.
    if costs["unclassified"] > 0:
        add(
            "info",
            "কিছু খরচের খাত দেওয়া নেই",
            "%s টাকার খরচে ধরন বা খাত বসানো হয়নি।"
            % f"{_money(costs['unclassified']):,.0f}",
            "ব্যাংকিং-এ গিয়ে ওগুলোয় খরচ বা পেমেন্ট বসিয়ে দিন, তাহলে হিসাব পরিষ্কার হবে।",
            topic="unclassified",
        )

    # 8. Nothing wrong — say so, instead of showing an empty box.
    if not signals:
        add(
            "good",
            "সব ঠিক আছে",
            "এই সময়ে লাভ %s টাকা, খরচও নিয়ন্ত্রণে।" % f"{_money(net_profit):,.0f}",
            "এভাবেই চালিয়ে যান। বাকি টাকা জমলে তাগাদা দিতে ভুলবেন না।",
        )

    order = {"danger": 0, "warn": 1, "info": 2, "good": 3}
    signals.sort(key=lambda s: order.get(s["severity"], 9))
    return signals


# ── the whole report ────────────────────────────────────────────────────


def loans_for(user):
    """Loan commitments — the fixed monthly bill the shop cannot skip."""
    active = list(Loan.objects.filter(user=user, status="active").select_related("account"))
    overdue = [loan for loan in active if loan.is_overdue]
    upcoming = sorted(
        (loan for loan in active if loan.next_due_date),
        key=lambda loan: loan.next_due_date,
    )
    return {
        "active_count": len(active),
        "monthly_due": sum((loan.installment_amount for loan in active), ZERO),
        "outstanding": sum((loan.remaining_amount for loan in active), ZERO),
        "overdue_count": len(overdue),
        "overdue_amount": sum((loan.installment_amount for loan in overdue), ZERO),
        "next": [
            {
                "id": loan.id,
                "lender": loan.lender,
                "installment": _money(loan.installment_amount),
                "due_date": loan.next_due_date.isoformat(),
                "days_overdue": loan.days_overdue,
                "is_overdue": loan.is_overdue,
                "remaining_count": loan.remaining_count,
                "remaining_amount": _money(loan.remaining_amount),
                "progress_pct": loan.progress_pct,
            }
            for loan in upcoming[:6]
        ],
    }


def fixed_costs_for(user):
    """Monthly bills the shop owes regardless of sales — rent and the like."""
    rows = list(RecurringCost.objects.filter(user=user, is_active=True))
    unpaid = [row for row in rows if not row.paid_this_month]
    overdue = [row for row in rows if row.is_overdue]
    return {
        "count": len(rows),
        "monthly_total": sum((row.amount for row in rows), ZERO),
        "unpaid_count": len(unpaid),
        "unpaid_amount": sum((row.amount for row in unpaid), ZERO),
        "overdue_count": len(overdue),
        "items": [
            {
                "id": row.id,
                "title": row.title,
                "amount": _money(row.amount),
                "due_date": row.due_date.isoformat(),
                "paid_this_month": row.paid_this_month,
                "is_overdue": row.is_overdue,
                "days_overdue": row.days_overdue,
            }
            for row in rows
        ],
    }


def monthly_commitment_for(user, loans, fixed, open_month_days=30):
    """What it costs to keep the shop open for a month, before buying stock.

    Payroll is read from the employee records rather than from salaries already
    paid: the question is what will be owed, not what has gone out so far.

    The daily share is spread over trading days: a closed Friday earns nothing
    but still costs its share of the rent.
    """
    payroll = (
        Employee.objects.filter(user=user, status="active").aggregate(
            total=Coalesce(Sum("salary"), Value(ZERO), output_field=DecimalField())
        )["total"]
        or ZERO
    )
    total = payroll + loans["monthly_due"] + fixed["monthly_total"]
    return {
        "payroll": _money(payroll),
        "employees": Employee.objects.filter(user=user, status="active").count(),
        "loan": _money(loans["monthly_due"]),
        "fixed": _money(fixed["monthly_total"]),
        "total": _money(total),
        "daily": _money(total / Decimal(open_month_days or 30)),
        "open_month_days": open_month_days,
    }


def build_overview(user, preset="this_month", start=None, end=None):
    first, last, label = periods.resolve(preset, start, end)
    prev_first, prev_last = periods.previous(first, last)

    begin, finish = periods.as_range(first, last)
    prev_begin, prev_finish = periods.as_range(prev_first, prev_last)

    sales = sales_for(user, begin, finish)
    costs = costs_for(user, begin, finish)
    prev_sales = sales_for(user, prev_begin, prev_finish)
    prev_costs = costs_for(user, prev_begin, prev_finish)

    # The shop's own calendar, resolved once and threaded through everything
    # that divides by a day count.
    closed = business_days.closed_weekdays(user)
    calendar_days = periods.days_in(first, last)
    day_count = business_days.open_days_between(first, last, closed)
    open_month_days = business_days.open_days_in_month(last, closed)
    prev_day_count = business_days.open_days_between(prev_first, prev_last, closed)

    loans = loans_for(user)
    fixed = fixed_costs_for(user)
    commitment = monthly_commitment_for(user, loans, fixed, open_month_days)

    # What the window's trading actually carries: monthly commitments spread
    # over the month's open days, day-of spending charged to its own day. The
    # cash figure (`costs["total"]`) is still reported — it answers "কত টাকা
    # বেরিয়েছে" — but it is not what a day is judged against.
    charged = charged_costs_for(costs, commitment, day_count, open_month_days)
    prev_charged = charged_costs_for(
        prev_costs, commitment, prev_day_count, open_month_days
    )

    net_profit = sales["gross_profit"] - charged["total"]
    prev_net = prev_sales["gross_profit"] - prev_charged["total"]
    cash_profit = sales["gross_profit"] - costs["total"]

    targets = build_targets(sales, charged, day_count)
    # …and what that profit means in things the shop can actually go and sell.
    from analytics.mix import what_it_takes

    to_do = what_it_takes(
        user,
        targets["daily_profit_needed"],
        targets["daily_profit"],
    )

    comparison = {
        "revenue": _change(sales["revenue"], prev_sales["revenue"]),
        "gross_profit": _change(sales["gross_profit"], prev_sales["gross_profit"]),
        "cost": _change(charged["total"], prev_charged["total"]),
        "net_profit": _change(net_profit, prev_net),
        "orders": _change(sales["orders_count"], prev_sales["orders_count"]),
    }

    receivables = receivables_for(user)
    dead_stock = dead_stock_for(user, begin, finish)
    # The other half of the stock story: what to bring more of.
    from analytics.restock import restock_suggestions

    restock_rows = restock_suggestions(user, begin, finish)

    return {
        "period": {
            "preset": preset,
            "label": label,
            "start": first.isoformat(),
            "end": last.isoformat(),
            # `days` stays the window's length — it is what the heading says.
            # `open_days` is what every per-day figure is actually divided by.
            "days": calendar_days,
            "open_days": day_count,
            "closed_days": sorted(closed),
            "closed_label": business_days.describe(closed),
        },
        "compare_with": {
            "label": periods.COMPARE_LABELS.get(preset, "আগের সমান সময়"),
            "start": prev_first.isoformat(),
            "end": prev_last.isoformat(),
        },
        "sales": {
            "revenue": _money(sales["revenue"]),
            "cogs": _money(sales["cogs"]),
            "gross_profit": _money(sales["gross_profit"]),
            "orders_count": sales["orders_count"],
            "avg_order_value": _money(sales["avg_order_value"]),
            "collected": _money(sales["collected"]),
        },
        "costs": {
            "expense": _money(costs["expense"]),
            "payment": _money(costs["payment"]),
            "unclassified": _money(costs["unclassified"]),
            "salaries": _money(costs["salaries"]),
            "incentives": _money(costs["incentives"]),
            "loan": _money(costs["loan"]),
            "recurring": _money(costs["recurring"]),
            # Cash that actually left in this window. True, and the figure the
            # খরচ report and the bank statement agree with — but lumpy, because
            # a month's rent lands on one day.
            "cash_out": _money(costs["total"]),
            # What this window's trading carries: monthly commitments spread
            # over the month's open days, day-of spending on its own day. This
            # is what every target and the profit figure are judged against.
            "total": _money(charged["total"]),
            "variable": _money(charged["variable"]),
            "periodic": _money(charged["periodic"]),
            "monthly_share_daily": _money(charged["daily_share"]),
            "by_category": costs["by_category"],
        },
        "net": {
            "profit": _money(net_profit),
            "is_profit": net_profit >= 0,
            # Same figure on a cash basis: useful on the day a big bill is
            # paid, misleading as a measure of how the day traded.
            "cash_profit": _money(cash_profit),
            "margin_pct": (
                round(float(net_profit / sales["revenue"] * 100), 1)
                if sales["revenue"]
                else 0.0
            ),
        },
        "comparison": comparison,
        "targets": targets,
        "to_do": to_do,
        "receivables": receivables,
        "inventory": {k: _money(v) if k != "vehicle_count" else v
                      for k, v in inventory_for(user).items()},
        "loans": {
            **{
                key: _money(value)
                for key, value in loans.items()
                if key in ("monthly_due", "outstanding", "overdue_amount")
            },
            "active_count": loans["active_count"],
            "overdue_count": loans["overdue_count"],
            "next": loans["next"],
        },
        "monthly_commitment": commitment,
        "fixed_costs": {
            "count": fixed["count"],
            "monthly_total": _money(fixed["monthly_total"]),
            "unpaid_count": fixed["unpaid_count"],
            "unpaid_amount": _money(fixed["unpaid_amount"]),
            "overdue_count": fixed["overdue_count"],
            "items": fixed["items"],
        },
        "dead_stock": dead_stock,
        "restock": restock_rows,
        "focus": build_focus(
            sales,
            costs,
            net_profit,
            targets,
            receivables,
            dead_stock,
            comparison,
            loans,
            fixed,
        ),
        "customers_count": Customer.objects.filter(user=user).count(),
    }
