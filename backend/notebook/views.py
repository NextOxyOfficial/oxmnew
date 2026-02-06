from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from collections import Counter

from .models import Notebook, NotebookSection, NotebookTag
from .serializers import (
    NotebookListSerializer, NotebookDetailSerializer, NotebookCreateUpdateSerializer,
    NotebookSectionSerializer, NotebookSectionCreateUpdateSerializer,
    NotebookTagSerializer, NotebookStatsSerializer
)


class NotebookViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notebooks"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-updated_at']
    filterset_fields = ['is_active', 'is_pinned']
    
    def get_queryset(self):
        """Return notebooks for current user only"""
        return Notebook.objects.filter(created_by=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return NotebookListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return NotebookCreateUpdateSerializer
        else:
            return NotebookDetailSerializer
    
    def perform_create(self, serializer):
        """Set current user as notebook creator"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Toggle pin status of a notebook"""
        notebook = self.get_object()
        notebook.is_pinned = not notebook.is_pinned
        notebook.save(update_fields=['is_pinned', 'updated_at'])
        
        return Response({
            'id': notebook.id,
            'is_pinned': notebook.is_pinned,
            'message': f"Notebook {'pinned' if notebook.is_pinned else 'unpinned'} successfully"
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of a notebook"""
        notebook = self.get_object()
        notebook.is_active = not notebook.is_active
        notebook.save(update_fields=['is_active', 'updated_at'])
        
        return Response({
            'id': notebook.id,
            'is_active': notebook.is_active,
            'message': f"Notebook {'activated' if notebook.is_active else 'deactivated'} successfully"
        })
    
    @action(detail=True, methods=['post'])
    def add_tag(self, request, pk=None):
        """Add a tag to notebook"""
        notebook = self.get_object()
        tag = request.data.get('tag', '').strip()
        
        if not tag:
            return Response({'error': 'Tag cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        if tag.lower() not in [t.lower() for t in notebook.tags]:
            notebook.tags.append(tag.lower())
            notebook.save(update_fields=['tags', 'updated_at'])
            
            return Response({
                'id': notebook.id,
                'tags': notebook.tags,
                'message': f"Tag '{tag}' added successfully"
            })
        else:
            return Response({'error': 'Tag already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def remove_tag(self, request, pk=None):
        """Remove a tag from notebook"""
        notebook = self.get_object()
        tag = request.data.get('tag', '').strip()
        
        if not tag:
            return Response({'error': 'Tag cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Case insensitive removal
            for existing_tag in notebook.tags:
                if existing_tag.lower() == tag.lower():
                    notebook.tags.remove(existing_tag)
                    break
            else:
                return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)
            
            notebook.save(update_fields=['tags', 'updated_at'])
            
            return Response({
                'id': notebook.id,
                'tags': notebook.tags,
                'message': f"Tag '{tag}' removed successfully"
            })
        except ValueError:
            return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notebook statistics for current user"""
        user_notebooks = self.get_queryset()
        
        # Collect all tags from user's notebooks
        all_tags = []
        for notebook in user_notebooks:
            all_tags.extend(notebook.tags)
        
        # Get most used tags (top 10)
        tag_counter = Counter(all_tags)
        most_used_tags = [tag for tag, count in tag_counter.most_common(10)]
        
        stats_data = {
            'total_notebooks': user_notebooks.count(),
            'active_notebooks': user_notebooks.filter(is_active=True).count(),
            'pinned_notebooks': user_notebooks.filter(is_pinned=True).count(),
            'total_sections': NotebookSection.objects.filter(notebook__created_by=request.user).count(),
            'most_used_tags': most_used_tags,
            'recent_notebooks': user_notebooks.order_by('-updated_at')[:5]
        }
        
        serializer = NotebookStatsSerializer(stats_data)
        return Response(serializer.data)


class NotebookSectionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notebook sections"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['order', 'created_at', 'updated_at']
    ordering = ['order']
    filterset_fields = ['notebook']
    
    def get_queryset(self):
        """Return sections for current user's notebooks only"""
        return NotebookSection.objects.filter(notebook__created_by=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return NotebookSectionCreateUpdateSerializer
        else:
            return NotebookSectionSerializer
    
    @action(detail=True, methods=['post'])
    def move_up(self, request, pk=None):
        """Move section up in order"""
        section = self.get_object()
        previous_section = NotebookSection.objects.filter(
            notebook=section.notebook,
            order__lt=section.order
        ).order_by('-order').first()
        
        if previous_section:
            # Swap orders
            section.order, previous_section.order = previous_section.order, section.order
            section.save(update_fields=['order'])
            previous_section.save(update_fields=['order'])
            
            return Response({'message': 'Section moved up successfully'})
        else:
            return Response({'error': 'Section is already at the top'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def move_down(self, request, pk=None):
        """Move section down in order"""
        section = self.get_object()
        next_section = NotebookSection.objects.filter(
            notebook=section.notebook,
            order__gt=section.order
        ).order_by('order').first()
        
        if next_section:
            # Swap orders
            section.order, next_section.order = next_section.order, section.order
            section.save(update_fields=['order'])
            next_section.save(update_fields=['order'])
            
            return Response({'message': 'Section moved down successfully'})
        else:
            return Response({'error': 'Section is already at the bottom'}, status=status.HTTP_400_BAD_REQUEST)


class NotebookTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing predefined tags"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'usage_count', 'created_at']
    ordering = ['-usage_count', 'name']
    
    def get_queryset(self):
        """Return tags created by current user"""
        return NotebookTag.objects.filter(created_by=self.request.user)
    
    def get_serializer_class(self):
        return NotebookTagSerializer
    
    def perform_create(self, serializer):
        """Set current user as tag creator"""
        serializer.save(created_by=self.request.user)
