from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(
    r"important-documents", views.ImportantDocumentViewSet, basename="important-document"
)

urlpatterns = [
    path("", include(router.urls)),
]
