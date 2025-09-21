from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotebookViewSet, NotebookSectionViewSet, NotebookTagViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'notebooks', NotebookViewSet, basename='notebook')
router.register(r'sections', NotebookSectionViewSet, basename='notebook-section')
router.register(r'tags', NotebookTagViewSet, basename='notebook-tag')

app_name = 'notebook'

urlpatterns = [
    path('', include(router.urls)),  # Remove extra 'api/' prefix
]
