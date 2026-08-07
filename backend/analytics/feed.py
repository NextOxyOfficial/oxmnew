"""Everything the dashboard's short reports need, in one request.

Ten separate list calls would each pay for auth, pagination and a round trip
just to show five rows. This assembles the same rows server-side, where the
joins are cheap, and returns one payload.

Only the *recent activity* lists live here. Money totals, targets and the focus
engine stay in `services.py` — the dashboard reads those through the normal
analytics overview so the two screens can never disagree.
"""

from calendar import monthrange
from datetime import date

from banking.models import Loan, RecurringCost, Transaction
from customers.models import Customer, SMSLog
from django.utils import timezone

from core import business_days
from notebook.models import NotebookSection
from orders.models import Order
from products.models import Product
from suppliers.models import Payment as SupplierPayment
from suppliers.models import Purchase
from vehicles.models import Vehicle

LIMIT = 5


def _next_month(due, day):
    """Same day one month on, clamped so the 31st survives a short month."""
    year = due.year + (due.month == 12)
    month = 1 if due.month == 12 else due.month + 1
    return date(year, month, min(day, monthrange(year, month)[1]))


def _money(value):
    return float(value or 0)


def inventory_value(user):
    """What the shelf cost, what it should fetch, and the gap between them.

    Variants hold their own price and stock, so a product with variants has to
    be summed from them — reading the parent's columns would count zero.
    """
    bought = sold = 0.0
    units = 0
    products = (
        Product.objects.filter(user=user, is_active=True)
        .prefetch_related("variants")
        .only("id", "buy_price", "sell_price", "stock", "has_variants")
    )
    for product in products:
        if product.has_variants:
            for variant in product.variants.all():
                bought += float(variant.buy_price) * variant.stock
                sold += float(variant.sell_price) * variant.stock
                units += variant.stock
        else:
            bought += float(product.buy_price) * product.stock
            sold += float(product.sell_price) * product.stock
            units += product.stock

    # Vehicles are serial-tracked, so they are not in Product.stock at all.
    for vehicle in Vehicle.objects.filter(user=user, status="in_stock").only(
        "buy_price", "sell_price"
    ):
        bought += float(vehicle.buy_price)
        sold += float(vehicle.sell_price)
        units += 1

    return {
        "buy_value": round(bought, 2),
        "sell_value": round(sold, 2),
        "potential_profit": round(sold - bought, 2),
        "margin_pct": round((sold - bought) / sold * 100, 1) if sold else 0.0,
        "units": units,
        "product_count": len(products),
    }


def recent_sales(user):
    rows = (
        Order.objects.filter(user=user)
        .select_related("customer")
        .order_by("-created_at")[:LIMIT]
    )
    return [
        {
            "id": order.id,
            "order_number": order.order_number,
            "customer": order.customer.name if order.customer_id else "ওয়াক-ইন",
            "total": _money(order.total_amount),
            "due": _money(order.due_amount),
            "at": order.created_at,
        }
        for order in rows
    ]


def recent_sms(user):
    rows = (
        SMSLog.objects.filter(user=user)
        .select_related("customer")
        .order_by("-created_at")[:LIMIT]
    )
    return [
        {
            "id": log.id,
            "customer": log.customer.name if log.customer_id else "—",
            "phone": log.phone_number,
            "status": log.status,
            # A full SMS body would push the card off screen.
            "preview": (log.message or "")[:70],
            "at": log.sent_at or log.created_at,
        }
        for log in rows
    ]


def recent_banking(user):
    rows = (
        Transaction.objects.filter(account__owner=user)
        .select_related("account")
        .order_by("-date")[:LIMIT]
    )
    return [
        {
            "id": txn.id,
            "account": txn.account.name,
            "type": txn.type,
            "nature": txn.nature,
            "amount": _money(txn.amount),
            "purpose": txn.purpose,
            "at": txn.date,
        }
        for txn in rows
    ]


def recent_customers(user):
    rows = Customer.objects.filter(user=user).order_by("-created_at")[:LIMIT]
    return [
        {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "at": customer.created_at,
        }
        for customer in rows
    ]


def recent_supplier_activity(user):
    """Purchases and payments woven into one stream, newest first.

    A supplier relationship is one conversation — "I bought, then I paid" — so
    splitting it into two lists would make the reader do the merging.
    """
    events = []
    for purchase in (
        Purchase.objects.filter(user=user, is_active=True)
        .select_related("supplier")
        .order_by("-date", "-created_at")[:LIMIT]
    ):
        events.append(
            {
                "id": f"p{purchase.id}",
                "kind": "purchase",
                "supplier": purchase.supplier.name,
                "supplier_id": purchase.supplier_id,
                "amount": _money(purchase.amount),
                "note": (purchase.products or "")[:60],
                "at": purchase.date,
            }
        )
    for payment in (
        SupplierPayment.objects.filter(user=user, is_active=True)
        .select_related("supplier")
        .order_by("-date", "-created_at")[:LIMIT]
    ):
        events.append(
            {
                "id": f"m{payment.id}",
                "kind": "payment",
                "supplier": payment.supplier.name,
                "supplier_id": payment.supplier_id,
                "amount": _money(payment.amount),
                "note": payment.get_method_display(),
                "at": payment.date,
            }
        )
    events.sort(key=lambda row: row["at"], reverse=True)
    return events[:LIMIT]


def recent_vehicles(user):
    """Bikes that moved — sold ones first, then whatever was booked in."""
    rows = Vehicle.objects.filter(user=user).select_related("product", "customer")
    rows = sorted(
        rows.order_by("-updated_at")[:LIMIT],
        key=lambda v: v.sold_at or v.updated_at,
        reverse=True,
    )
    return [
        {
            "id": vehicle.id,
            "name": vehicle.product.name,
            "identifier": vehicle.identifier,
            "status": vehicle.status,
            "customer": vehicle.customer.name if vehicle.customer_id else None,
            "amount": _money(vehicle.sold_price or vehicle.sell_price),
            "at": vehicle.sold_at or vehicle.updated_at,
        }
        for vehicle in rows
    ]


def recent_notes(user):
    rows = (
        NotebookSection.objects.filter(notebook__created_by=user)
        .select_related("notebook")
        .order_by("-updated_at")[:LIMIT]
    )
    return [
        {
            "id": section.id,
            "notebook_id": section.notebook_id,
            "notebook": section.notebook.name,
            "title": section.title,
            "preview": (section.content or "").strip()[:80],
            "at": section.updated_at,
        }
        for section in rows
    ]


def upcoming_costs(user, today=None):
    """Fixed bills and loan installments that fall due next, soonest first.

    Answers "কী আসছে আর কত দিন পর" in one list, because the shopkeeper does not
    care whether the money is owed to a landlord or a bank — only when it leaves.
    """
    today = today or timezone.localdate()
    closed = business_days.closed_weekdays(user)
    rows = []

    for cost in RecurringCost.objects.filter(user=user, is_active=True).select_related(
        "account"
    ):
        due = cost.due_date
        if cost.paid_this_month:
            # This month is settled, so the next one the shop owes is next
            # month's — skipping it entirely would leave the card blank on the
            # very day everything is up to date.
            due = _next_month(due, cost.due_day)
        rows.append(
            {
                "id": f"c{cost.id}",
                "kind": "fixed",
                "title": cost.title,
                "category": cost.category,
                "amount": _money(cost.amount),
                "due_date": due,
                "days_left": (due - today).days,
                "open_days_left": business_days.open_days_left(due, closed, today),
                "paid_this_month": cost.paid_this_month,
                "href": "/dashboard/employees/office-rent",
            }
        )

    for loan in Loan.objects.filter(user=user, status="active"):
        due = loan.next_due_date
        if not due:
            continue
        rows.append(
            {
                "id": f"l{loan.id}",
                "kind": "loan",
                "title": f"{loan.lender} — কিস্তি",
                "category": "loan",
                "amount": _money(loan.installment_amount),
                "due_date": due,
                "days_left": (due - today).days,
                "open_days_left": business_days.open_days_left(due, closed, today),
                "paid_this_month": False,
                "href": "/dashboard/banking/loans",
            }
        )

    # No horizon cut-off: a shop with one quarterly bill should still see it
    # rather than an empty card. Soonest first, capped so the list stays short.
    rows.sort(key=lambda row: row["due_date"])
    return rows[:6]


def build_feed(user):
    from analytics import coach, restock, services

    # Built once and shared: the coach lines and the upcoming-cost card both
    # read today's report, and it is the most expensive thing here.
    today = services.build_overview(user, preset="today")

    return {
        "coach": coach.build_messages(user, today=today),
        "restock": restock.restock_for_feed(user),
        "inventory": inventory_value(user),
        "recent_sales": recent_sales(user),
        "recent_sms": recent_sms(user),
        "recent_banking": recent_banking(user),
        "recent_customers": recent_customers(user),
        "recent_suppliers": recent_supplier_activity(user),
        "recent_vehicles": recent_vehicles(user),
        "recent_notes": recent_notes(user),
        "upcoming_costs": upcoming_costs(user),
    }
