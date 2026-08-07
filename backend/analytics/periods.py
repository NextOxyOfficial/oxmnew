"""Date ranges for the analytics screen, and the previous range to compare with.

Every comparison needs two windows of the *same length*, otherwise "this week vs
last week" silently compares seven days against three and the percentages lie.
The previous window is therefore always derived from the current one's duration,
never from a calendar rule.
"""

from datetime import date, datetime, time, timedelta

from django.utils import timezone

PRESETS = {
    "today": "আজ",
    "yesterday": "গতকাল",
    "this_week": "এই সপ্তাহ",
    "last_week": "গত সপ্তাহ",
    "this_month": "এই মাস",
    "last_month": "গত মাস",
    "last_7": "গত ৭ দিন",
    "last_30": "গত ৩০ দিন",
    "this_year": "এই বছর",
}

COMPARE_LABELS = {
    "today": "গতকাল",
    "yesterday": "তার আগের দিন",
    "this_week": "গত সপ্তাহ",
    "last_week": "তার আগের সপ্তাহ",
    "this_month": "গত মাস",
    "last_month": "তার আগের মাস",
    "last_7": "তার আগের ৭ দিন",
    "last_30": "তার আগের ৩০ দিন",
    "this_year": "গত বছর",
    "custom": "ঠিক আগের সমান সময়",
}


def _start_of_week(day):
    """Weeks start on Saturday in Bangladesh, not Monday."""
    return day - timedelta(days=(day.weekday() + 2) % 7)


def _month_start(day):
    return day.replace(day=1)


def resolve(preset="this_month", start=None, end=None):
    """Return (start_date, end_date, label) for the requested window.

    `start`/`end` are only read when preset == "custom"; anything unrecognised
    falls back to this month rather than erroring, so a stale bookmark still
    renders a page.
    """
    today = timezone.localdate()

    if preset == "custom" and start and end:
        try:
            first = date.fromisoformat(start)
            last = date.fromisoformat(end)
        except ValueError:
            first, last = _month_start(today), today
        if last < first:
            first, last = last, first
        return first, last, "নিজের সময়"

    if preset == "today":
        return today, today, PRESETS["today"]
    if preset == "yesterday":
        day = today - timedelta(days=1)
        return day, day, PRESETS["yesterday"]
    if preset == "this_week":
        return _start_of_week(today), today, PRESETS["this_week"]
    if preset == "last_week":
        this_week = _start_of_week(today)
        return this_week - timedelta(days=7), this_week - timedelta(days=1), PRESETS["last_week"]
    if preset == "last_month":
        first_this = _month_start(today)
        last_prev = first_this - timedelta(days=1)
        return _month_start(last_prev), last_prev, PRESETS["last_month"]
    if preset == "last_7":
        return today - timedelta(days=6), today, PRESETS["last_7"]
    if preset == "last_30":
        return today - timedelta(days=29), today, PRESETS["last_30"]
    if preset == "this_year":
        return today.replace(month=1, day=1), today, PRESETS["this_year"]

    return _month_start(today), today, PRESETS["this_month"]


def previous(first, last):
    """The window of equal length sitting immediately before this one."""
    span = (last - first).days + 1
    prev_last = first - timedelta(days=1)
    return prev_last - timedelta(days=span - 1), prev_last


def as_range(first, last):
    """Aware datetimes covering the whole of both days, for __range filters."""
    tz = timezone.get_current_timezone()
    begin = timezone.make_aware(datetime.combine(first, time.min), tz)
    finish = timezone.make_aware(datetime.combine(last, time.max), tz)
    return begin, finish


def days_in(first, last):
    return max(1, (last - first).days + 1)
