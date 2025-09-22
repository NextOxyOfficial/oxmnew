from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Notebook, NotebookSection, NotebookTag


class NotebookTagSerializer(serializers.ModelSerializer):
    """Serializer for NotebookTag model"""
    
    class Meta:
        model = NotebookTag
        fields = [
            'id', 'name', 'color', 'description', 
            'usage_count', 'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'created_by']


class NotebookSectionSerializer(serializers.ModelSerializer):
    """Serializer for NotebookSection model"""
    
    class Meta:
        model = NotebookSection
        fields = [
            'id', 'title', 'content', 'order', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotebookListSerializer(serializers.ModelSerializer):
    """Serializer for listing notebooks (minimal fields)"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tag_count = serializers.ReadOnlyField()
    sections_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Notebook
        fields = [
            'id', 'name', 'description', 'tags', 'tag_count',
            'is_active', 'is_pinned', 'sections_count',
            'created_at', 'updated_at', 'created_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_username', 'tag_count']
    
    def get_sections_count(self, obj):
        return obj.sections.count()


class NotebookDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed notebook view"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tag_count = serializers.ReadOnlyField()
    sections = NotebookSectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Notebook
        fields = [
            'id', 'name', 'description', 'tags', 'tag_count',
            'is_active', 'is_pinned', 'sections',
            'created_at', 'updated_at', 'created_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_username', 'tag_count']


class NotebookCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating notebooks"""
    
    class Meta:
        model = Notebook
        fields = [
            'name', 'description', 'tags', 'is_active', 'is_pinned'
        ]
    
    def validate_name(self, value):
        """Validate notebook name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Notebook name cannot be empty.")
        return value.strip()
    
    def validate_tags(self, value):
        """Validate and clean tags"""
        if not value:
            return []
        
        # Clean tags - remove empty strings and duplicates
        cleaned_tags = []
        for tag in value:
            if isinstance(tag, str) and tag.strip():
                tag_clean = tag.strip().lower()
                if tag_clean not in cleaned_tags:
                    cleaned_tags.append(tag_clean)
        
        return cleaned_tags
    
    def create(self, validated_data):
        """Create notebook - user assignment handled in view"""
        # Don't set created_by here - let the view handle it in perform_create
        return super().create(validated_data)


class NotebookSectionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating notebook sections"""
    
    class Meta:
        model = NotebookSection
        fields = ['notebook', 'title', 'content', 'order']
    
    def validate_title(self, value):
        """Validate section title"""
        if not value or not value.strip():
            raise serializers.ValidationError("Section title cannot be empty.")
        return value.strip()
    
    def validate_notebook(self, value):
        """Ensure user owns the notebook"""
        request = self.context.get('request')
        if request and value.created_by != request.user:
            raise serializers.ValidationError("You can only add sections to your own notebooks.")
        return value


class NotebookStatsSerializer(serializers.Serializer):
    """Serializer for notebook statistics"""
    total_notebooks = serializers.IntegerField()
    active_notebooks = serializers.IntegerField()
    pinned_notebooks = serializers.IntegerField()
    total_sections = serializers.IntegerField()
    most_used_tags = serializers.ListField(child=serializers.CharField())
    recent_notebooks = NotebookListSerializer(many=True)
