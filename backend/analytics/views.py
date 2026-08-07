from core.scoping import owner_for, require_permission
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import details, feed, periods, services


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_permission("analytics.view", "dashboard.money")
def overview(request):
    """The whole analytics report for one period, in a single round trip.

    One endpoint rather than six: every figure on the screen is compared against
    the same window, and splitting it would let the sections disagree with each
    other while the user watches them load.
    """
    data = services.build_overview(
        request.user,
        preset=request.query_params.get("period", "this_month"),
        start=request.query_params.get("start"),
        end=request.query_params.get("end"),
    )
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def period_options(request):
    """Presets the UI offers, so the labels live in one place."""
    return Response(
        [{"value": value, "label": label} for value, label in periods.PRESETS.items()]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_permission("analytics.view")
def detail(request):
    """Rows behind one analytics signal, e.g. every idle product.

    All topics share one response shape ({title, note, columns, rows}) so the
    frontend renders any of them with a single table instead of a view per topic.
    """
    topic = request.query_params.get("topic", "")
    data = details.build(
        request.user,
        topic,
        preset=request.query_params.get("period", "this_month"),
        start=request.query_params.get("start"),
        end=request.query_params.get("end"),
    )
    if data is None:
        return Response(
            {"error": "এই বিষয়ের বিস্তারিত নেই।"}, status=404
        )
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_permission("analytics.view", "dashboard.money")
def dashboard_feed(request):
    """Recent activity across every module, for the dashboard's short reports.

    One request instead of ten: each list is only five rows, so the round trips
    would have cost more than the queries.
    """
    return Response(feed.build_feed(request.user))
