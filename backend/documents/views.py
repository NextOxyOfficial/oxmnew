from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from core.scoping import HasPermission, owner_for

from .models import ImportantDocument
from .serializers import (
    ImportantDocumentSerializer,
    ImportantDocumentUpdateSerializer,
)


class ImportantDocumentViewSet(viewsets.ModelViewSet):
    """The shop's own papers. Scoped to one owner, never shared."""

    required_permissions = {
        "GET": "documents.use",
        "POST": "documents.use",
        "PUT": "documents.use",
        "PATCH": "documents.use",
        "DELETE": "documents.use",
    }

    permission_classes = [permissions.IsAuthenticated, HasPermission]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["doc_type", "is_pinned"]
    search_fields = ["title", "reference_number", "issued_by", "notes"]
    ordering_fields = ["created_at", "expiry_date", "title"]

    def get_queryset(self):
        # owner_for() — not request.user — so a staff login reads its
        # employer's cabinet and never its own empty one.
        return ImportantDocument.objects.filter(
            owner=owner_for(self.request)
        ).select_related("uploaded_by")

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return ImportantDocumentUpdateSerializer
        return ImportantDocumentSerializer

    def perform_create(self, serializer):
        # The paper belongs to the shop; the login that uploaded it is only
        # recorded for the audit trail.
        serializer.save(
            owner=owner_for(self.request), uploaded_by=self.request.user
        )

    def perform_destroy(self, instance):
        """Delete the row and the blob together.

        Django stopped removing files on delete in 1.3; without this the media
        dir grows forever with papers the owner believes they deleted.
        """
        stored = instance.file
        super().perform_destroy(instance)
        if stored:
            stored.delete(save=False)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Counts for the KPI strip, computed in one pass over the DB."""
        today = timezone.localdate()
        soon = today + timedelta(days=ImportantDocument.EXPIRING_SOON_DAYS)
        qs = self.get_queryset()

        aggregates = qs.aggregate(
            total=Count("id"),
            expired=Count("id", filter=Q(expiry_date__lt=today)),
            expiring=Count(
                "id", filter=Q(expiry_date__gte=today, expiry_date__lte=soon)
            ),
            permanent=Count("id", filter=Q(expiry_date__isnull=True)),
        )
        aggregates["valid"] = (
            aggregates["total"]
            - aggregates["expired"]
            - aggregates["expiring"]
            - aggregates["permanent"]
        )

        by_type = list(
            qs.values("doc_type").annotate(count=Count("id")).order_by("-count")
        )
        labels = dict(ImportantDocument.DOC_TYPES)
        for row in by_type:
            row["label"] = labels.get(row["doc_type"], row["doc_type"])

        return Response({**aggregates, "by_type": by_type})

    @action(detail=False, methods=["get"], url_path="expiring")
    def expiring(self, request):
        """Papers already lapsed or lapsing within the window — soonest first."""
        today = timezone.localdate()
        soon = today + timedelta(days=ImportantDocument.EXPIRING_SOON_DAYS)
        qs = self.get_queryset().filter(expiry_date__lte=soon).order_by("expiry_date")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="toggle-pin")
    def toggle_pin(self, request, pk=None):
        document = self.get_object()
        document.is_pinned = not document.is_pinned
        document.save(update_fields=["is_pinned", "updated_at"])
        return Response(self.get_serializer(document).data, status=status.HTTP_200_OK)
