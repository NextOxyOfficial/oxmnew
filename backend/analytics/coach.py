"""Short spoken-Bangla nudges for the top of the dashboard.

The figures below already say *what* happened. These say what to do about it,
in the voice a shopkeeper would use — one sentence, one number, one emoji.

Every line is derived from a real number and names it, so nothing here is
motivational filler the reader can't check.
"""

from django.utils import timezone

from analytics import periods, services
from core import business_days


# Figures stay in Latin digits. The app's Bangla face renders ১ as a smudge,
# and an unreadable money figure is worse than none — only the words around
# the numbers are Bangla.


def _group(digits):
    """Lakh-crore grouping: 1234567 → 12,34,567.

    Python's `{:,}` groups in thousands, which is not how taka is written —
    1,234,567 reads wrong to anyone counting in lakh.
    """
    if len(digits) <= 3:
        return digits
    head, tail = digits[:-3], digits[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return ",".join(parts) + "," + tail


def _money(value):
    return "৳" + _group(str(int(round(value or 0))))


def _num(value):
    """Whole numbers stay whole; a percentage keeps its one decimal."""
    return f"{value:g}" if isinstance(value, float) else str(int(value))


def _net_for(user, preset):
    """Just the profit/loss for one window, without building a whole report."""
    first, last, _ = periods.resolve(preset)
    begin, finish = periods.as_range(first, last)
    sales = services.sales_for(user, begin, finish)
    costs = services.costs_for(user, begin, finish)
    net = sales["gross_profit"] - costs["total"]
    return {"net": {"profit": float(net), "is_profit": net >= 0}}


def build_messages(user, today=None):
    """Ranked nudges — the most actionable first, capped so the strip stays short.

    `today` can be passed in when the caller has already built it, which the
    feed does — otherwise the dashboard pays for the same ~55-query report
    twice on every load.
    """
    today = today or services.build_overview(user, preset="today")
    # Only yesterday's net result is needed, and a full overview costs ~55
    # queries to produce it — the comparison window, dead stock, the focus
    # engine, all discarded. Two aggregates give the same number.
    yesterday = _net_for(user, "yesterday")

    messages = []

    def add(tone, emoji, title, detail):
        messages.append(
            {"tone": tone, "emoji": emoji, "title": title, "detail": detail}
        )

    y_net = yesterday["net"]
    t_sales = today["sales"]
    targets = today["targets"]
    commitment = today["monthly_commitment"]

    # On a day the shop is shut there is no target to miss, and telling the
    # owner to sell more would be nonsense — so the day's nudges are replaced
    # by the one thing that is still true: the bills kept running.
    closed = business_days.closed_weekdays(user)
    is_closed_today = (timezone.localdate().weekday() in closed)

    # The break-even already carries the shop's share of rent and payroll —
    # charged_costs_for spreads them across the month's open days — so this is
    # the whole target. It used to be max()'d against the commitment on its
    # own, back when the two were computed separately and could disagree.
    daily_need = targets.get("daily_profit_needed", 0)
    shortfall = max(0, daily_need - t_sales["gross_profit"])
    to_do = today.get("to_do") or {}

    # 1. Yesterday's result is the frame for today.
    if not y_net["is_profit"] and abs(y_net["profit"]) > 0:
        add(
            "danger",
            "😟",
            f"গতকাল {_money(abs(y_net['profit']))} লোকসান হয়েছিল",
            f"আজ একটু বেশি নজর দিন — {_money(abs(y_net['profit']) + shortfall)} "
            "লাভ করলে গতকালেরটাও উঠে যাবে।",
        )
    elif y_net["is_profit"] and y_net["profit"] > 0:
        add(
            "good",
            "🎉",
            f"গতকাল {_money(y_net['profit'])} লাভ হয়েছিল",
            "ধারাটা ধরে রাখুন — আজও একই গতিতে চললে মাসটা ভালো যাবে।",
        )

    # 2. Where today stands against the day's break-even.
    if is_closed_today:
        add(
            "info",
            "🛍️",
            "আজ দোকান বন্ধ",
            f"বন্ধের দিনেও দিনে {_money(commitment['daily'])} খরচ চলতে থাকে — "
            "খোলার দিনগুলোর টার্গেটে সেটা ধরাই আছে।",
        )
    elif shortfall > 0:
        add(
            "warn",
            "🎯",
            f"আজ আরও {_money(shortfall)} লাভ দরকার",
            (
                f"দিনের খরচ উঠতে {_money(daily_need)} লাভ লাগে, এখন পর্যন্ত "
                f"হয়েছে {_money(t_sales['gross_profit'])}।"
            )
            + (f" মানে {to_do['headline']}।" if to_do.get("headline") else ""),
        )
    elif t_sales["revenue"] > 0:
        add(
            "good",
            "✅",
            "আজকের টার্গেট পেরিয়ে গেছে",
            f"{_num(t_sales['orders_count'])} টা অর্ডারে "
            f"{_money(t_sales['gross_profit'])} লাভ — আজকের খরচ উঠে গেছে।",
        )

    # 3. Money already earned but not collected. Nothing to sell, just to ask for.
    receivables = today["receivables"]
    if receivables["total"] > 0:
        add(
            "warn",
            "📞",
            f"{_money(receivables['total'])} বাকি আটকে আছে",
            f"{_num(receivables['customers_count'])} জন কাস্টমারের কাছে। একটা ফোন "
            "বা এসএমএসেই কিছু টাকা ঘরে আসতে পারে।",
        )

    # 4. The next bill, so it never arrives as a surprise.
    from analytics.feed import upcoming_costs

    upcoming = upcoming_costs(user)
    if upcoming:
        nearest = upcoming[0]
        days = nearest["days_left"]
        when = "আজই" if days == 0 else f"{_num(abs(days))} দিন " + (
            "পেরিয়ে গেছে" if days < 0 else "পর"
        )
        add(
            "danger" if days < 0 else "info",
            "🗓️",
            f"{nearest['title']} — {when}",
            f"{_money(nearest['amount'])} সরিয়ে রাখুন, নইলে মাসের হিসাব এলোমেলো "
            "হয়ে যাবে।",
        )

    # 5. Stock that is not moving — cash sitting on a shelf. `dead_stock` is
    # the row list itself, so the total has to be summed here.
    dead = today.get("dead_stock") or []
    dead_value = sum(row.get("tied_up", 0) for row in dead)
    if dead_value > 0:
        add(
            "info",
            "📦",
            f"{_money(dead_value)} টাকার মাল পড়ে আছে",
            f"{_num(len(dead))} টা আইটেম অনেক দিন বিক্রি হয়নি। ছাড় দিলে টাকাটা "
            "ছাড়া পাবে।",
        )

    # 6. Margin, because a busy day at a thin margin still loses money.
    margin = targets.get("margin_pct", 0)
    if t_sales["revenue"] > 0 and margin < 15:
        add(
            "warn",
            "📉",
            f"লাভের হার কম — মাত্র {_num(margin)}%",
            "100 টাকা বিক্রিতে এই কটা টাকাই থাকছে। কেনা দাম বা বিক্রির দাম একবার "
            "দেখে নিন।",
        )

    if not messages:
        add(
            "good",
            "👍",
            "সব ঠিকঠাক চলছে",
            "আলাদা করে নজর দেওয়ার মতো কিছু নেই — বিক্রিতে মন দিন।",
        )

    return messages[:6]
