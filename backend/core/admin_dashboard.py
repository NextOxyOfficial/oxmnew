"""Stats for the OxyManager admin dashboard.

Everything here is defensive: a missing app, a renamed field or an empty
table must degrade to a dash, never take the admin down — this runs on
every admin index page load.
"""

from datetime import timedelta

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models import F, Sum
from django.urls import reverse
from django.utils import timezone


def _safe(fn, default=None):
    try:
        return fn()
    except Exception:
        return default


def _model(path):
    """'orders.Order' -> model class, or None if the app isn't installed."""
    try:
        return apps.get_model(*path.split("."))
    except Exception:
        return None


def _money(value):
    if value in (None, ""):
        return "0"
    try:
        return f"{float(value):,.0f}"
    except Exception:
        return str(value)


def _admin_url(app_label, model_name):
    try:
        return reverse(f"admin:{app_label}_{model_name}_changelist")
    except Exception:
        return "#"


def dashboard_context(request):
    """Context processor: only does work on the admin index page.

    Registered in TEMPLATES.OPTIONS.context_processors. Guarded so it costs
    nothing on API requests and can never break a page if a query fails.
    """
    path = getattr(request, "path", "") or ""
    if not path.endswith("/admin/") or not getattr(request, "user", None):
        return {}
    if not request.user.is_authenticated or not request.user.is_staff:
        return {}
    try:
        return build_dashboard(request)
    except Exception:
        return {}


def build_dashboard(request):
    """Return {oxm_kpis, oxm_alerts} for templates/admin/index.html."""
    User = get_user_model()
    now = timezone.now()
    today = now.date()
    month_start = today.replace(day=1)

    Product = _model("products.Product")
    Order = _model("orders.Order")
    Customer = _model("customers.Customer")
    Employee = _model("employees.Employee")
    BankAccount = _model("banking.BankAccount")

    kpis = []
    alerts = []

    # ── Sales: today and this month ──────────────────────────
    if Order is not None:
        today_total = _safe(
            lambda: Order.objects.filter(created_at__date=today).aggregate(
                t=Sum("total_amount")
            )["t"]
        )
        today_count = _safe(
            lambda: Order.objects.filter(created_at__date=today).count(), 0
        )
        kpis.append({
            "label": "আজকের বিক্রি",
            "value": f"৳{_money(today_total)}",
            "meta": f"{today_count} টা অর্ডার",
            "icon": "fas fa-receipt",
            "tone": "accent",
        })

        month_total = _safe(
            lambda: Order.objects.filter(
                created_at__date__gte=month_start
            ).aggregate(t=Sum("total_amount"))["t"]
        )
        kpis.append({
            "label": "এই মাসের বিক্রি",
            "value": f"৳{_money(month_total)}",
            "meta": f"{month_start.strftime('%d %b')} থেকে আজ পর্যন্ত",
            "icon": "fas fa-chart-line",
            "tone": "success",
        })

        due_total = _safe(lambda: Order.objects.aggregate(t=Sum("due_amount"))["t"])
        due_count = _safe(lambda: Order.objects.filter(due_amount__gt=0).count(), 0)
        if due_total:
            kpis.append({
                "label": "মোট বাকি",
                "value": f"৳{_money(due_total)}",
                "meta": f"{due_count} টা অর্ডারে",
                "icon": "fas fa-hand-holding-usd",
                "tone": "danger",
            })
        if due_count:
            alerts.append({
                "label": f"{due_count} টা অর্ডারে টাকা বাকি আছে",
                "icon": "fas fa-hand-holding-usd",
                "url": _admin_url("orders", "order"),
                "tone": "danger",
            })

        pending = _safe(lambda: Order.objects.filter(status="pending").count(), 0)
        if pending:
            alerts.append({
                "label": f"{pending} টা অর্ডার এখনো অপেক্ষমাণ",
                "icon": "fas fa-clock",
                "url": _admin_url("orders", "order") + "?status__exact=pending",
                "tone": "warn",
            })

    # ── Stock health ─────────────────────────────────────────
    if Product is not None:
        kpis.append({
            "label": "প্রোডাক্ট",
            "value": _safe(lambda: Product.objects.count(), 0),
            "meta": "মোট আইটেম",
            "icon": "fas fa-box",
            "tone": "muted",
        })

        # Only products that actually track stock can run out.
        out_of_stock = _safe(
            lambda: Product.objects.filter(
                stock__lte=0, no_stock_required=False, has_variants=False
            ).count(),
            0,
        )
        low_stock = _safe(
            lambda: Product.objects.filter(
                stock__gt=0, stock__lte=10, no_stock_required=False, has_variants=False
            ).count(),
            0,
        )
        if out_of_stock:
            alerts.append({
                "label": f"{out_of_stock} টা প্রোডাক্টের স্টক শেষ",
                "icon": "fas fa-times-circle",
                "url": _admin_url("products", "product"),
                "tone": "danger",
            })
        if low_stock:
            alerts.append({
                "label": f"{low_stock} টা প্রোডাক্টের স্টক কমে এসেছে",
                "icon": "fas fa-exclamation-triangle",
                "url": _admin_url("products", "product"),
                "tone": "warn",
            })

        # Money sitting on the shelf (buy price x stock).
        stock_value = _safe(
            lambda: Product.objects.filter(no_stock_required=False)
            .annotate(v=F("stock") * F("buy_price"))
            .aggregate(t=Sum("v"))["t"]
        )
        if stock_value:
            kpis.append({
                "label": "স্টকের দাম",
                "value": f"৳{_money(stock_value)}",
                "meta": "কেনা দামে",
                "icon": "fas fa-warehouse",
                "tone": "muted",
            })

    # ── People ───────────────────────────────────────────────
    if Customer is not None:
        kpis.append({
            "label": "কাস্টমার",
            "value": _safe(lambda: Customer.objects.count(), 0),
            "meta": "মোট",
            "icon": "fas fa-user-friends",
            "tone": "muted",
        })
    if Employee is not None:
        active = _safe(lambda: Employee.objects.filter(status="active").count(), 0)
        kpis.append({
            "label": "কর্মচারী",
            "value": _safe(lambda: Employee.objects.count(), 0),
            "meta": f"{active} জন সক্রিয়",
            "icon": "fas fa-id-badge",
            "tone": "muted",
        })

    # ── Bank ─────────────────────────────────────────────────
    if BankAccount is not None:
        balance = _safe(lambda: BankAccount.objects.aggregate(t=Sum("balance"))["t"])
        if balance is not None:
            kpis.append({
                "label": "ব্যাংক ব্যালেন্স",
                "value": f"৳{_money(balance)}",
                "meta": "সব অ্যাকাউন্ট মিলিয়ে",
                "icon": "fas fa-university",
                "tone": "success",
            })

    # ── Accounts ─────────────────────────────────────────────
    week_ago = now - timedelta(days=7)
    kpis.append({
        "label": "ইউজার",
        "value": _safe(lambda: User.objects.count(), 0),
        "meta": _safe(
            lambda: f"{User.objects.filter(last_login__gte=week_ago).count()} জন এই সপ্তাহে সক্রিয়",
            "",
        ),
        "icon": "fas fa-users",
        "tone": "muted",
    })

    return {"oxm_kpis": kpis, "oxm_alerts": alerts}
