"""Which days the shop is actually open, and what that does to every target.

A shop that closes on Friday cannot sell on Friday — but the rent, the salary
and the loan installment do not pause for it. Dividing a month's costs by 30
therefore hands the shopkeeper a daily target they can never hit: the four or
five closed days earn nothing, and the shortfall is quietly blamed on the days
they *were* open.

So the rule everywhere in the app is: **costs accrue on every calendar day,
revenue is only possible on open days.** Every per-day figure is divided by the
open-day count, never by the length of the window.

Weekday numbers are Python's `date.weekday()` — Monday 0 through Sunday 6 — so
the value stored in settings can be compared to a date without translation. The
UI orders them Saturday-first because that is where a Bangladeshi week starts,
but the stored numbers are unaffected by that.
"""

from datetime import date, timedelta

#: Saturday first: the order a Bangladeshi shopkeeper reads a week in. The
#: number is still Python's weekday(), so nothing downstream has to convert.
WEEKDAYS = [
    (5, "শনিবার", "Sat"),
    (6, "রবিবার", "Sun"),
    (0, "সোমবার", "Mon"),
    (1, "মঙ্গলবার", "Tue"),
    (2, "বুধবার", "Wed"),
    (3, "বৃহস্পতিবার", "Thu"),
    (4, "শুক্রবার", "Fri"),
]

WEEKDAY_NAMES = {number: bangla for number, bangla, _ in WEEKDAYS}


def clean(values):
    """Keep only real weekday numbers, de-duplicated and in week order.

    Anything else — a string, a 9, a null from an old record — is dropped
    rather than raising, because a bad value in settings should not be able to
    take the dashboard down.
    """
    keep = set()
    for value in values or []:
        try:
            number = int(value)
        except (TypeError, ValueError):
            continue
        if 0 <= number <= 6:
            keep.add(number)
    # Never let a shop mark all seven days closed: every per-day figure would
    # divide by zero, and a shop that is never open has nothing to report.
    if len(keep) >= 7:
        return []
    return [number for number, _, _ in WEEKDAYS if number in keep]


def closed_weekdays(user):
    """The weekday numbers this shop is shut on, as a set."""
    from core.models import UserSettings

    if user is None or not getattr(user, "is_authenticated", True):
        return set()
    settings = UserSettings.objects.filter(user=user).only("closed_days").first()
    if settings is None:
        return set()
    return set(clean(settings.closed_days))


def is_open(day, closed):
    return day.weekday() not in closed


def open_days_between(first, last, closed):
    """How many trading days sit in [first, last].

    Never returns zero: a window made entirely of closed days would otherwise
    turn every per-day figure into a division by zero, and the honest answer
    for "what must I earn per day" over a closed stretch is the whole amount,
    not infinity.
    """
    if last < first:
        first, last = last, first
    if not closed:
        return max(1, (last - first).days + 1)

    total = 0
    day = first
    while day <= last:
        if day.weekday() not in closed:
            total += 1
        day += timedelta(days=1)
    return max(1, total)


def open_days_in_month(day, closed):
    """Trading days in the calendar month containing `day`."""
    first = day.replace(day=1)
    if first.month == 12:
        next_first = first.replace(year=first.year + 1, month=1)
    else:
        next_first = first.replace(month=first.month + 1)
    return open_days_between(first, next_first - timedelta(days=1), closed)


def next_open_day(day, closed):
    """`day` itself when the shop is open, otherwise the next day it is.

    Bounded at seven steps — `clean()` guarantees at least one open weekday, so
    the loop always terminates, but the bound makes that guarantee local.
    """
    for _ in range(7):
        if day.weekday() not in closed:
            return day
        day += timedelta(days=1)
    return day


def open_days_left(target, closed, today=None):
    """Trading days between today and `target`, excluding today.

    Negative when the date has passed, so a caller can keep using the sign the
    way it uses `days_left`.
    """
    today = today or date.today()
    if target <= today:
        return -open_days_between(target, today, closed) if target < today else 0
    return open_days_between(today + timedelta(days=1), target, closed)


def describe(closed):
    """"শুক্রবার ও শনিবার বন্ধ" — or an empty string when the shop never closes."""
    names = [WEEKDAY_NAMES[number] for number in clean(closed)]
    if not names:
        return ""
    if len(names) == 1:
        return f"{names[0]} বন্ধ"
    return f"{'、'.join(names[:-1]).replace('、', ', ')} ও {names[-1]} বন্ধ"


def summary(user):
    """The block every report attaches so the UI can explain its own numbers."""
    closed = closed_weekdays(user)
    return {
        "closed_days": sorted(closed),
        "open_per_week": 7 - len(closed),
        "label": describe(closed),
    }
