from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Notebook(models.Model):
    """
    Model for storing notebook entries/notes
    """
    name = models.CharField(max_length=255, help_text="Title of the notebook")
    description = models.TextField(blank=True, null=True, help_text="Detailed description of the notebook")
    tags = models.JSONField(default=list, blank=True, help_text="List of tags for categorization")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notebooks',
        help_text="User who created this notebook"
    )
    
    # Status and organization
    is_active = models.BooleanField(default=True, help_text="Whether this notebook is active")
    is_pinned = models.BooleanField(default=False, help_text="Whether this notebook is pinned to top")
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        verbose_name = "Notebook"
        verbose_name_plural = "Notebooks"
        indexes = [
            models.Index(fields=['created_by', '-updated_at']),
            models.Index(fields=['is_active', 'is_pinned']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.created_by.username}"
    
    def get_tags_display(self):
        """Return tags as comma-separated string"""
        return ", ".join(self.tags) if self.tags else "No tags"
    
    def add_tag(self, tag):
        """Add a new tag if it doesn't exist"""
        if tag and tag not in self.tags:
            self.tags.append(tag)
            self.save(update_fields=['tags', 'updated_at'])
    
    def remove_tag(self, tag):
        """Remove a tag if it exists"""
        if tag in self.tags:
            self.tags.remove(tag)
            self.save(update_fields=['tags', 'updated_at'])
    
    @property
    def tag_count(self):
        """Return number of tags"""
        return len(self.tags)


class NotebookSection(models.Model):
    """
    Model for storing sections/chapters within a notebook
    """
    notebook = models.ForeignKey(
        Notebook, 
        on_delete=models.CASCADE, 
        related_name='sections',
        help_text="Notebook this section belongs to"
    )
    title = models.CharField(max_length=255, help_text="Title of the section")
    content = models.TextField(blank=True, null=True, help_text="Content of the section")
    order = models.PositiveIntegerField(default=0, help_text="Order of this section in the notebook")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Notebook Section"
        verbose_name_plural = "Notebook Sections"
        unique_together = ['notebook', 'order']
    
    def __str__(self):
        return f"{self.notebook.name} - {self.title}"


class NotebookTag(models.Model):
    """
    Model for predefined tags that can be used across notebooks
    """
    name = models.CharField(max_length=50, help_text="Tag name")
    color = models.CharField(
        max_length=7, 
        default="#3B82F6", 
        help_text="Hex color code for this tag"
    )
    description = models.TextField(blank=True, null=True, help_text="Description of what this tag represents")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_tags',
        help_text="User who created this tag"
    )
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0, help_text="Number of times this tag is used")
    
    class Meta:
        ordering = ['-usage_count', 'name']
        verbose_name = "Notebook Tag"
        unique_together = [('created_by', 'name')]
        verbose_name_plural = "Notebook Tags"
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
    
    def decrement_usage(self):
        """Decrement usage count"""
        if self.usage_count > 0:
            self.usage_count -= 1
            self.save(update_fields=['usage_count'])
