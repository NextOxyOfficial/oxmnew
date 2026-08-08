"""How much has to be *sold* to cover a day — in units, not in taka of revenue.

The break-even used to be quoted as revenue: "sell ৳3,05,655 today". For a
motorbike shop that number is close to meaningless. It is derived from a
blended margin, and this shop's margin is not one number — it is two:

  * a bike is a large ticket at a thin margin, so revenue overstates what it
    contributes; one sale can be ৳2,00,000 of "revenue" and ৳12,000 of profit,
  * a spare part is a small ticket at a fat margin, so revenue understates it.

Quote the target in revenue and the shopkeeper gets a figure that swings wildly
depending on which of the two they happened to sell last — the same day's costs
"need" ৳3 lakh of bikes or ৳40,000 of parts.

Profit does not have that problem: costs are covered by profit, whatever was
sold to earn it. So the target is stated as profit, and then translated back
into the only terms that can actually be acted on — how many bikes, or how many
parts, at what this shop really earns on each.

The averages come from the shop's own recent sales, not from a list price, so
they already carry its real discounting.
"""

from datetime import timedelta
from decimal import Decimal

from django.db.models import DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from orders.models import OrderItem
from vehicles.models import Vehicle

ZERO = Decimal("0.00")

#: How far back to read the shop's own economics. Long enough that a slow week
#: does not erase the bike average — a shop may sell one a fortnight — short
#: enough that last year's prices do not set today's target.
LOOKBACK_DAYS = 180

#: Below this, an "average" is one lucky sale rather than a rate worth quoting.
MIN_SAMPLE = 2

DEAD_ORDER_STATES = ["cancelled", "refunded", "draft"]


def _avg_vehicle_profit(user, since):
    rows = Vehicle.objects.filter(
        user=user, status="sold", sold_at__gte=since, sold_price__isnull=False
    ).aggregate(
        profit=Coalesce(
            Sum(F("sold_price") - F("buy_price")), Value(ZERO),
            output_field=DecimalField(),
        ),
    )
    count = Vehicle.objects.filter(
        user=user, status="sold", sold_at__gte=since, sold_price__isnull=False
    ).count()
    if count < MIN_SAMPLE:
        return None, count
    return (rows["profit"] or ZERO) / count, count


def _avg_part_profit(user, since):
    """Per piece, not per line: a line of ten filters is ten chances to sell."""
    rows = (
        OrderItem.objects.filter(order__user=user, order__created_at__gte=since)
        .exclude(order__status__in=DEAD_ORDER_STATES)
        .aggregate(
            profit=Coalesce(
                Sum((F("unit_price") - F("buy_price")) * F("quantity")),
                Value(ZERO),
                output_field=DecimalField(),
            ),
            units=Coalesce(Sum("quantity"), Value(0)),
        )
    )
    units = rows["units"] or 0
    if units < MIN_SAMPLE:
        return None, units
    return (rows["profit"] or ZERO) / Decimal(units), units


def _units_for(need, per_unit):
    """How many sales cover `need`, rounded up — half a bike helps nobody."""
    if per_unit is None or per_unit <= 0:
        return None
    whole = int(need / per_unit)
    return whole + (1 if need % per_unit else 0)


def what_it_takes(user, need_profit, earned_profit=ZERO, today=None):
    """The day's target as profit, and what that means in things to sell.

    `need_profit` is one open day's charged cost — see
    services.charged_costs_for. Anything already earned in the window is
    subtracted first, so the answer is always "what is still left to do".
    """
    today = today or timezone.now()
    since = today - timedelta(days=LOOKBACK_DAYS)

    need_profit = Decimal(str(need_profit or 0))
    earned_profit = Decimal(str(earned_profit or 0))
    remaining = max(ZERO, need_profit - earned_profit)

    vehicle_avg, vehicle_n = _avg_vehicle_profit(user, since)
    part_avg, part_n = _avg_part_profit(user, since)

    lines = []
    if vehicle_avg:
        lines.append(
            {
                "key": "vehicle",
                "label": "মোটর বাইক",
                "avg_profit": float(vehicle_avg),
                "units": _units_for(remaining, vehicle_avg),
                "sample": vehicle_n,
                "note": f"একটায় গড়ে ৳{vehicle_avg:,.0f} লাভ থাকে",
            }
        )
    if part_avg:
        lines.append(
            {
                "key": "part",
                "label": "পার্টস",
                "avg_profit": float(part_avg),
                "units": _units_for(remaining, part_avg),
                "sample": part_n,
                "note": f"একটায় গড়ে ৳{part_avg:,.0f} লাভ থাকে",
            }
        )

    if remaining <= 0:
        headline = "আজকের খরচ উঠে গেছে"
    elif len(lines) > 1:
        # "or", not "and": either one on its own clears the day. Stating it as
        # a combination would read as a quota the shop has to hit twice.
        headline = " বা ".join(
            f"{line['units']} টা {line['label']}" for line in lines
        )
    elif lines:
        headline = f"{lines[0]['units']} টা {lines[0]['label']}"
    else:
        # Nothing sold recently enough to average. Quoting a made-up unit count
        # would be worse than saying only the taka figure.
        headline = ""

    return {
        "need_profit": float(need_profit),
        "earned_profit": float(earned_profit),
        "remaining_profit": float(remaining),
        "covered": remaining <= 0,
        "lines": lines,
        "headline": headline,
        "lookback_days": LOOKBACK_DAYS,
    }
