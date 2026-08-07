"""Branded admin site for OxyManager.

Swaps the stock ``admin.site`` class in place (see backend/urls.py) so every
existing ``@admin.register`` keeps working while the dashboard gains a real
at-a-glance summary instead of the default bare app list.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone


class OxmAdminSite(admin.AdminSite):
    site_header = "OxyManager অ্যাডমিন"
    site_title = "OxyManager"
    index_title = "ব্যবস্থাপনা প্যানেল"

    def index(self, request, extra_context=None):
        """Add a KPI strip to the dashboard.

        Every stat is wrapped individually: a missing table or a renamed
        field must never take the whole admin down.
        """
        extra_context = extra_context or {}
        extra_context["oxm_kpis"] = self._collect_kpis()
        return super().index(request, extra_context)

    # ── internals ────────────────────────────────────────────
    @staticmethod
    def _safe(fn, default="—"):
        try:
            value = fn()
            return default if value is None else value
        except Exception:
            return default

    def _collect_kpis(self):
        User = get_user_model()
        today = timezone.now().date()
        kpis = []

        def count(model_path, label, meta=""):
            def _run():
                from django.apps import apps

                app_label, model_name = model_path.split(".")
                model = apps.get_model(app_label, model_name)
                return model.objects.count()

            value = self._safe(_run)
            if value != "—":
                kpis.append({"label": label, "value": value, "meta": meta})

        count("employees.Employee", "কর্মচারী", "মোট")
        count("customers.Customer", "কাস্টমার", "মোট")
        count("products.Product", "প্রোডাক্ট", "মোট")
        count("orders.Order", "অর্ডার", "মোট")

        kpis.append(
            {
                "label": "ইউজার",
                "value": self._safe(lambda: User.objects.count()),
                "meta": self._safe(
                    lambda: f"আজ লগইন {User.objects.filter(last_login__date=today).count()}",
                    default="",
                ),
            }
        )

        def _balance():
            from django.apps import apps

            model = apps.get_model("banking", "BankAccount")
            total = model.objects.aggregate(t=Sum("balance"))["t"]
            return f"{total:,.0f}" if total is not None else "0"

        balance = self._safe(_balance)
        if balance != "—":
            kpis.append(
                {"label": "ব্যাংক ব্যালেন্স", "value": balance, "meta": "সব অ্যাকাউন্ট"}
            )

        return kpis
