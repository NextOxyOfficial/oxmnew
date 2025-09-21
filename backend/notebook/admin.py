from django.contrib import admin
from django.utils.html import format_html
from .models import Notebook, NotebookSection, NotebookTag


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'created_by', 
        'tag_display', 
        'is_pinned', 
        'is_active', 
        'created_at', 
        'updated_at'
    ]
    list_filter = [
        'is_active', 
        'is_pinned', 
        'created_at', 
        'updated_at',
        'created_by'
    ]
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'tag_count']
    filter_horizontal = []
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'tags')
        }),
        ('Status', {
            'fields': ('is_active', 'is_pinned')
        }),
        ('Ownership', {
            'fields': ('created_by',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'tag_count'),
            'classes': ('collapse',)
        }),
    )
    
    def tag_display(self, obj):
        if obj.tags:
            tags_html = []
            for tag in obj.tags[:3]:  # Show first 3 tags
                tags_html.append(f'<span style="background: #3B82F6; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">{tag}</span>')
            if len(obj.tags) > 3:
                tags_html.append(f'<span style="color: #666;">+{len(obj.tags) - 3} more</span>')
            return format_html(' '.join(tags_html))
        return format_html('<span style="color: #999;">No tags</span>')
    tag_display.short_description = 'Tags'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new notebook
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class NotebookSectionInline(admin.TabularInline):
    model = NotebookSection
    extra = 0
    fields = ['title', 'order', 'content']
    ordering = ['order']


@admin.register(NotebookSection)
class NotebookSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'notebook', 'order', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at', 'notebook']
    search_fields = ['title', 'content', 'notebook__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Section Information', {
            'fields': ('notebook', 'title', 'order')
        }),
        ('Content', {
            'fields': ('content',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(NotebookTag)
class NotebookTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'usage_count', 'created_by', 'created_at']
    list_filter = ['created_at', 'created_by', 'usage_count']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'usage_count']
    
    fieldsets = (
        ('Tag Information', {
            'fields': ('name', 'color', 'description')
        }),
        ('Ownership', {
            'fields': ('created_by',)
        }),
        ('Statistics', {
            'fields': ('usage_count', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def color_display(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border-radius: 3px; display: inline-block;"></div> {}',
            obj.color,
            obj.color
        )
    color_display.short_description = 'Color'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new tag
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# Add inline sections to notebook admin
NotebookAdmin.inlines = [NotebookSectionInline]
