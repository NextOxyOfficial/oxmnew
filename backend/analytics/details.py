"""Drill-downs behind each analytics signal.

The overview answers "what is wrong". These answer "which rows exactly", so the
user can act instead of going hunting. One function per topic, all returning the
same envelope — {title, note, columns, rows} — so the frontend renders any of
them with a single table component rather than seven bespoke views.
"""

from decimal import Decimal

from django.db.models import DecimalField, F, Max, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from banking.models import Loan, RecurringCost, Transaction
from orders.models import Order, OrderItem
from products.models import Product

from . import periods, services

ZERO = Decimal("0")


def _envelope(title, note, columns, rows):
    return {"title": title, "note": note, "columns": columns, "rows": rows}


def _days_ago(value):
    if not value:
        return None
    return (timezone.now().date() - value.date()).days


def dead_stock(user, begin, finish):
    """Products holding money that did not sell in this window.

    `last_sold` is looked up across all time, not just the window — "never sold"
    and "last sold nine months ago" are different problems and the user needs to
    tell them apart.
    """
    sold_ids = {
        pid
        for pid in Order.objects.filter(user=user, created_at__range=(begin, finish))
        .exclude(status__in=services.DEAD_ORDER_STATES)
        .values_list("items__product_id", flat=True)
        if pid
    }

    stuck = (
        Product.objects.filter(user=user, is_active=True, stock__gt=0)
        .exclude(id__in=sold_ids)
        .annotate(tied=F("stock") * F("buy_price"))
        .order_by("-tied")
    )

    # One grouped query for every product's most recent sale, rather than a
    # lookup per row.
    last_sales = {
        row["product_id"]: row["last"]
        for row in OrderItem.objects.filter(
            order__user=user, product_id__in=[p.id for p in stuck]
        )
        .exclude(order__status__in=services.DEAD_ORDER_STATES)
        .values("product_id")
        .annotate(last=Max("order__created_at"))
    }

    rows = []
    for product in stuck:
        last = last_sales.get(product.id)
        age = _days_ago(last)
        rows.append(
            {
                "id": product.id,
                "name": product.name,
                "code": product.product_code or "",
                "stock": product.stock,
                "buy_price": services._money(product.buy_price),
                "sell_price": services._money(product.sell_price),
                "unit_profit": services._money(product.sell_price - product.buy_price),
                "tied_up": services._money(product.stock * product.buy_price),
                "last_sold": last.date().isoformat() if last else None,
                "days_idle": age,
                "never_sold": last is None,
                "href": f"/dashboard/products/{product.id}",
            }
        )

    total = sum(row["tied_up"] for row in rows)
    never = sum(1 for row in rows if row["never_sold"])
    return _envelope(
        "যেসব প্রোডাক্ট বিক্রি হচ্ছে না",
        "মোট %s টাকা আটকে আছে। এর মধ্যে %d টা প্রোডাক্ট কোনোদিনই বিক্রি হয়নি।"
        % (f"{total:,.0f}", never),
        [
            {"key": "name", "label": "প্রোডাক্ট", "type": "link"},
            {"key": "code", "label": "কোড"},
            {"key": "stock", "label": "স্টক", "type": "number"},
            {"key": "buy_price", "label": "কেনা দাম", "type": "money"},
            {"key": "sell_price", "label": "বিক্রির দাম", "type": "money"},
            {"key": "unit_profit", "label": "পিসে লাভ", "type": "money", "tone": "auto"},
            {"key": "tied_up", "label": "আটকে আছে", "type": "money", "tone": "neg"},
            {"key": "idle_text", "label": "শেষ বিক্রি"},
        ],
        [
            {
                **row,
                "idle_text": (
                    "কোনোদিন বিক্রি হয়নি"
                    if row["never_sold"]
                    else "%d দিন আগে" % row["days_idle"]
                ),
            }
            for row in rows
        ],
    )


def low_margin(user, begin, finish):
    """Which products are eating the margin, worst first."""
    rows = (
        OrderItem.objects.filter(
            order__user=user, order__created_at__range=(begin, finish)
        )
        .exclude(order__status__in=services.DEAD_ORDER_STATES)
        .values("product_id", "product_name")
        .annotate(
            qty=Coalesce(Sum("quantity"), Value(0)),
            revenue=Coalesce(
                Sum(F("quantity") * F("unit_price"), output_field=DecimalField()),
                Value(ZERO),
                output_field=DecimalField(),
            ),
            cost=Coalesce(
                Sum(F("quantity") * F("buy_price"), output_field=DecimalField()),
                Value(ZERO),
                output_field=DecimalField(),
            ),
        )
    )

    out = []
    for row in rows:
        revenue = row["revenue"] or ZERO
        profit = revenue - (row["cost"] or ZERO)
        margin = float(profit / revenue * 100) if revenue else 0.0
        qty = row["qty"] or 0
        cost = row["cost"] or ZERO
        out.append(
            {
                "id": row["product_id"],
                "name": row["product_name"],
                "qty": qty,
                # Per-unit figures alongside the totals, so the margin can be
                # checked by eye: (বিক্রি − কেনা) ÷ বিক্রি.
                "unit_buy": services._money(cost / qty) if qty else 0.0,
                "unit_sell": services._money(revenue / qty) if qty else 0.0,
                "cost": services._money(cost),
                "revenue": services._money(revenue),
                "profit": services._money(profit),
                "margin": round(margin, 1),
                "margin_text": "%.1f%%" % margin,
                "href": f"/dashboard/products/{row['product_id']}"
                if row["product_id"]
                else None,
            }
        )
    out.sort(key=lambda r: r["margin"])

    return _envelope(
        "কোন প্রোডাক্টে লাভ কম",
        "সবচেয়ে কম মার্জিনের প্রোডাক্ট উপরে। এগুলোর কেনা দাম কমানো বা বিক্রির দাম "
        "বাড়ানো গেলে পুরো লাভের হার উঠে আসবে।",
        [
            {"key": "name", "label": "প্রোডাক্ট", "type": "link"},
            {"key": "qty", "label": "বিক্রি", "type": "number"},
            {"key": "unit_buy", "label": "কেনা দাম", "type": "money"},
            {"key": "unit_sell", "label": "বিক্রির দাম", "type": "money"},
            {"key": "cost", "label": "মোট কেনা", "type": "money"},
            {"key": "revenue", "label": "মোট বিক্রি", "type": "money"},
            {"key": "profit", "label": "লাভ", "type": "money", "tone": "auto"},
            {"key": "margin_text", "label": "লাভের হার"},
        ],
        out,
    )


def receivables(user, begin, finish):
    """Everyone who owes, not just the top few the overview shows."""
    full = services.receivables_for(user, limit=10_000)
    rows = []
    for row in full["top"]:
        age = (timezone.localdate() - timezone.datetime.fromisoformat(row["oldest"]).date()).days
        rows.append(
            {
                **row,
                "age_text": "%d দিন" % age,
                "age": age,
                "href": f"/dashboard/customers/{row['customer_id']}"
                if row["customer_id"]
                else None,
                "name_link": row["name"],
            }
        )
    return _envelope(
        "কার কাছে কত বাকি",
        "মোট %s টাকা %d জনের কাছে। ৩০ দিনের বেশি পুরনো বাকিগুলো আগে ধরুন।"
        % (f"{services._money(full['total']):,.0f}", full["customers_count"]),
        [
            {"key": "name", "label": "কাস্টমার", "type": "link"},
            {"key": "phone", "label": "ফোন"},
            {"key": "orders", "label": "অর্ডার", "type": "number"},
            {"key": "due", "label": "বাকি", "type": "money", "tone": "neg"},
            {"key": "age_text", "label": "কত দিন"},
        ],
        rows,
    )


def costs(user, begin, finish):
    """Every debit in the window, biggest first."""
    rows = (
        Transaction.objects.filter(
            account__owner=user, type="debit", date__range=(begin, finish)
        )
        .exclude(status="cancelled")
        .select_related("account")
        .order_by("-amount")
    )
    nature_labels = {
        "expense": "খরচ",
        "payment": "পেমেন্ট",
        "withdrawal": "উত্তোলন",
        "income": "আয়",
        "other": "অন্যান্য",
        "": "দেওয়া হয়নি",
    }
    return _envelope(
        "এই সময়ের সব খরচ",
        "সবচেয়ে বড় খরচ উপরে। যেগুলোয় খাত দেওয়া নেই সেগুলো ব্যাংকিং থেকে ঠিক করে নিন।",
        [
            {"key": "purpose", "label": "কী কারণে"},
            {"key": "nature_text", "label": "ধরন"},
            {"key": "category_text", "label": "খাত"},
            {"key": "account_name", "label": "অ্যাকাউন্ট"},
            {"key": "date_text", "label": "তারিখ"},
            {"key": "amount", "label": "টাকা", "type": "money", "tone": "neg"},
        ],
        [
            {
                "id": row.id,
                "purpose": row.purpose,
                "nature_text": nature_labels.get(row.nature or "", "অন্যান্য"),
                "category_text": services.CATEGORY_LABELS.get(
                    row.category or "", row.category or "দেওয়া হয়নি"
                ),
                "account_name": row.account.name,
                "date_text": timezone.localtime(row.date).strftime("%d-%m-%Y"),
                "amount": services._money(row.amount),
            }
            for row in rows
        ],
    )


def unclassified(user, begin, finish):
    """Debits with no nature set — the rows making the report incomplete."""
    rows = (
        Transaction.objects.filter(
            account__owner=user, type="debit", nature="", date__range=(begin, finish)
        )
        .exclude(status="cancelled")
        .select_related("account")
        .order_by("-amount")
    )
    total = sum(services._money(row.amount) for row in rows)
    return _envelope(
        "যেসব খরচে ধরন বসানো নেই",
        "মোট %s টাকা। ব্যাংকিং-এ গিয়ে প্রতিটায় খরচ বা পেমেন্ট বসিয়ে দিলে "
        "খরচের ভাঙন ঠিকঠাক দেখাবে।" % f"{total:,.0f}",
        [
            {"key": "purpose", "label": "কী কারণে"},
            {"key": "account_name", "label": "অ্যাকাউন্ট", "type": "link"},
            {"key": "date_text", "label": "তারিখ"},
            {"key": "amount", "label": "টাকা", "type": "money", "tone": "neg"},
        ],
        [
            {
                "id": row.id,
                "purpose": row.purpose,
                "account_name": row.account.name,
                "name": row.account.name,
                "href": f"/dashboard/banking/{row.account_id}",
                "date_text": timezone.localtime(row.date).strftime("%d-%m-%Y"),
                "amount": services._money(row.amount),
            }
            for row in rows
        ],
    )


def targets(user, begin, finish):
    """Day-by-day sales against the break-even line."""
    day_count = (finish.date() - begin.date()).days + 1
    sales = services.sales_for(user, begin, finish)
    cost = services.costs_for(user, begin, finish)
    plan = services.build_targets(sales, cost, day_count)

    orders = (
        Order.objects.filter(user=user, created_at__range=(begin, finish))
        .exclude(status__in=services.DEAD_ORDER_STATES)
        .order_by("created_at")
    )
    per_day = {}
    for order in orders:
        key = timezone.localtime(order.created_at).date()
        entry = per_day.setdefault(key, {"revenue": ZERO, "orders": 0})
        entry["revenue"] += order.total_amount
        entry["orders"] += 1

    need = plan["breakeven_daily_revenue"]
    rows = []
    for day in sorted(per_day, reverse=True):
        got = services._money(per_day[day]["revenue"])
        rows.append(
            {
                "date_text": day.strftime("%d-%m-%Y"),
                "orders": per_day[day]["orders"],
                "revenue": got,
                "need": need,
                "gap": got - need,
                "status_text": "টার্গেট হয়েছে" if got >= need else "কম হয়েছে",
            }
        )

    return _envelope(
        "দিনে দিনে টার্গেট",
        "খরচ উঠতে প্রতিদিন %s টাকা বিক্রি দরকার। যেদিন কম হয়েছে সেদিন লাল।"
        % f"{need:,.0f}",
        [
            {"key": "date_text", "label": "তারিখ"},
            {"key": "orders", "label": "অর্ডার", "type": "number"},
            {"key": "revenue", "label": "বিক্রি", "type": "money"},
            {"key": "need", "label": "দরকার ছিল", "type": "money"},
            {"key": "gap", "label": "কম/বেশি", "type": "money", "tone": "auto"},
            {"key": "status_text", "label": "অবস্থা"},
        ],
        rows,
    )


def loans(user, begin, finish):
    """Every running loan, the one closest to its due date first."""
    rows = []
    for loan in Loan.objects.filter(user=user).select_related("account").order_by("status"):
        due = loan.next_due_date
        rows.append(
            {
                "id": loan.id,
                "name": loan.lender,
                "purpose": loan.purpose or "—",
                "installment": services._money(loan.installment_amount),
                "remaining_amount": services._money(loan.remaining_amount),
                "progress_text": "%d/%d কিস্তি (%.0f%%)"
                % (loan.paid_count, loan.installment_count, loan.progress_pct),
                "due_text": (
                    "শেষ"
                    if loan.status == "closed"
                    else "%s%s"
                    % (
                        due.strftime("%d-%m-%Y") if due else "—",
                        " · %d দিন দেরি" % loan.days_overdue if loan.is_overdue else "",
                    )
                ),
                "href": "/dashboard/banking/loans",
            }
        )
    monthly = sum(
        services._money(loan.installment_amount)
        for loan in Loan.objects.filter(user=user, status="active")
    )
    return _envelope(
        "লোন আর কিস্তির হিসাব",
        "প্রতি মাসে মোট %s টাকা কিস্তি দিতে হয়। এই টাকাটা দিনের টার্গেটেও ধরা আছে।"
        % f"{monthly:,.0f}",
        [
            {"key": "name", "label": "কার কাছে", "type": "link"},
            {"key": "purpose", "label": "কী জন্য"},
            {"key": "installment", "label": "মাসিক কিস্তি", "type": "money", "tone": "neg"},
            {"key": "remaining_amount", "label": "এখনো বাকি", "type": "money", "tone": "neg"},
            {"key": "progress_text", "label": "কতটা শোধ"},
            {"key": "due_text", "label": "পরের তারিখ"},
        ],
        rows,
    )


def fixed_costs(user, begin, finish):
    """Every fixed monthly bill and whether this month's is settled."""
    rows = []
    for cost in RecurringCost.objects.filter(user=user).select_related("account"):
        rows.append(
            {
                "id": cost.id,
                "name": cost.title,
                "amount": services._money(cost.amount),
                "due_text": cost.due_date.strftime("%d-%m-%Y"),
                "state_text": (
                    "এই মাসের দেওয়া হয়েছে"
                    if cost.paid_this_month
                    else "%d দিন দেরি" % cost.days_overdue
                    if cost.is_overdue
                    else "এখনো দেওয়া হয়নি"
                ),
                "account_name": cost.account.name if cost.account else "—",
                "href": "/dashboard/employees/office-rent",
            }
        )
    monthly = sum(
        row["amount"]
        for row in rows
    )
    return _envelope(
        "নির্দিষ্ট মাসিক খরচ",
        "প্রতি মাসে মোট %s টাকা দিতেই হয়। বিক্রি হোক বা না হোক, তাই এটা দিনের "
        "টার্গেটেও ধরা আছে।" % f"{monthly:,.0f}",
        [
            {"key": "name", "label": "কী খরচ", "type": "link"},
            {"key": "amount", "label": "মাসে", "type": "money", "tone": "neg"},
            {"key": "due_text", "label": "কবে দিতে হয়"},
            {"key": "state_text", "label": "অবস্থা"},
            {"key": "account_name", "label": "অ্যাকাউন্ট"},
        ],
        rows,
    )


TOPICS = {
    "fixed_costs": fixed_costs,
    "loans": loans,
    "dead_stock": dead_stock,
    "low_margin": low_margin,
    "receivables": receivables,
    "costs": costs,
    "unclassified": unclassified,
    "targets": targets,
}


def build(user, topic, preset="this_month", start=None, end=None):
    handler = TOPICS.get(topic)
    if handler is None:
        return None
    first, last, _ = periods.resolve(preset, start, end)
    begin, finish = periods.as_range(first, last)
    return handler(user, begin, finish)
