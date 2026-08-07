"""What to buy more of, and how many pieces.

Dead stock says what *not* to reorder. This is the other half: the products
that keep selling out. A shopkeeper who only sees "you sold 40 of these" still
has to work out how many to bring in — so the number here is the shortfall,
not the sales figure.

The model is deliberately simple, because the input is: daily sales rate over
the window, multiplied by how many days of cover the shop wants, minus what is
already on the shelf. No forecasting curve to explain or mistrust.
"""

from datetime import timedelta

from django.db.models import F, Sum
from orders.models import Order, OrderItem
from products.models import Product

from core import business_days

#: Days of stock to hold. Two weeks is short enough that money isn't parked on
#: a shelf, long enough to survive a slow resupply.
COVER_DAYS = 14

#: Below this a "trend" is one lucky sale, not a pattern worth acting on.
MIN_UNITS_SOLD = 2

DEAD_ORDER_STATES = ["cancelled", "refunded", "draft"]


def _bn(value):
    """Latin digits — the Bangla ১ is unreadable in the app's typeface."""
    return str(value)


def _calendar_days_for(open_days, closed):
    """How many days on the wall calendar contain `open_days` trading days.

    The stock rate is measured per trading day, but "আর 5 দিনেই শেষ" is read
    against a calendar. For a Friday-closed shop, 5 trading days is a week.
    """
    if open_days <= 0 or not closed:
        return open_days
    from datetime import timedelta
    from django.utils import timezone

    day = timezone.localdate()
    counted = 0
    walked = 0
    while counted < open_days and walked < 400:
        day += timedelta(days=1)
        walked += 1
        if day.weekday() not in closed:
            counted += 1
    return walked


def restock_suggestions(user, begin, finish, limit=6):
    """Fast movers whose shelf will not last the cover window.

    Returns rows carrying both the evidence (what sold, how fast) and the
    recommendation (how many to bring in), so the advice can be checked.
    """
    # Trading days, not calendar days: stock only moves when the door is open,
    # so a Friday-closed shop that sold 40 pieces sold them in 26 days, not 30.
    # Dividing by 30 would understate the rate and under-order every week.
    closed = business_days.closed_weekdays(user)
    days = business_days.open_days_between(begin.date(), finish.date(), closed)

    sold = (
        OrderItem.objects.filter(
            order__user=user,
            order__created_at__range=(begin, finish),
        )
        .exclude(order__status__in=DEAD_ORDER_STATES)
        .values("product_id")
        .annotate(units=Sum("quantity"), revenue=Sum("total_price"))
        .filter(units__gte=MIN_UNITS_SOLD)
        .order_by("-units")
    )
    if not sold:
        return []

    by_id = {row["product_id"]: row for row in sold if row["product_id"]}
    products = {
        p.id: p
        for p in Product.objects.filter(
            id__in=by_id, user=user, is_active=True, no_stock_required=False
        )
    }

    rows = []
    for product_id, stats in by_id.items():
        product = products.get(product_id)
        if product is None:
            continue

        units = stats["units"] or 0
        per_day = units / days
        # Variants keep their own stock, so the parent column would read zero.
        on_hand = product.total_stock
        needed = per_day * COVER_DAYS
        shortfall = needed - on_hand
        if shortfall <= 0:
            continue

        # Round up to a whole piece — half a bike helps nobody.
        suggest = int(shortfall) + (1 if shortfall % 1 else 0)
        open_left = int(on_hand / per_day) if per_day else 0
        days_left = _calendar_days_for(open_left, closed)

        rows.append(
            {
                "id": product.id,
                "name": product.name,
                "sold": units,
                "revenue": float(stats["revenue"] or 0),
                "per_day": round(per_day, 2),
                "in_stock": on_hand,
                "days_left": days_left,
                "suggest_qty": suggest,
                "buy_cost": float(product.average_buy_price) * suggest,
                # The sentence the UI shows verbatim, so the wording lives with
                # the numbers that justify it.
                "note": (
                    f"{_bn(days)} দিনে {_bn(units)} পিস গেছে, স্টকে আছে "
                    f"{_bn(on_hand)} — আর {_bn(days_left)} দিনেই শেষ"
                ),
            }
        )

    # Whatever runs out soonest is the thing to order first.
    rows.sort(key=lambda row: (row["days_left"], -row["sold"]))
    return rows[:limit]


def restock_for_feed(user, days=90, limit=5):
    """The dashboard card's version — a fixed recent window, no period picker.

    Ninety days rather than thirty: a shop with a slow month would otherwise
    show no trend at all, and a bike moves far less often than a spare part.
    """
    from django.utils import timezone

    finish = timezone.now()
    begin = finish - timedelta(days=days)
    return restock_suggestions(user, begin, finish, limit=limit)
