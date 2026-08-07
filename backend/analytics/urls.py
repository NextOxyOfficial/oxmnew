from django.urls import path

from . import views

urlpatterns = [
    path("analytics/overview/", views.overview, name="analytics-overview"),
    path("analytics/periods/", views.period_options, name="analytics-periods"),
    path("analytics/detail/", views.detail, name="analytics-detail"),
    path("analytics/feed/", views.dashboard_feed, name="analytics-feed"),
    path(
        "analytics/monthly-expenses/",
        views.monthly_expenses,
        name="analytics-monthly-expenses",
    ),
]
