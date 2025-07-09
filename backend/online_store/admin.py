from django.contrib import admin
from django.utils.html import format_html
from .models import OnlineProduct, OnlineOrder, OnlineOrderItem, StoreSettings


@admin.register(OnlineProduct)
class OnlineProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'buy_price_display', 'sell_price_display', 'profit_display', 'profit_margin_display', 'category', 'is_published', 'created_at']
    list_filter = ['is_published', 'category', 'user', 'created_at']
    search_fields = ['name', 'description', 'user__username', 'product__name']
    readonly_fields = ['name', 'description', 'price', 'category', 'image_url', 'buy_price_display', 'sell_price_display', 'profit_display', 'profit_margin_display', 'stock_display', 'created_at', 'updated_at']
    
    # Show the essential fields plus financial details
    fieldsets = (
        ('Product Selection', {
            'fields': ('product', 'is_published'),
            'description': 'Select an existing product to publish to the online store.'
        }),
        ('Product Information', {
            'fields': ('name', 'description', 'category', 'image_url'),
            'description': 'Information automatically populated from the selected product.',
            'classes': ('collapse',)
        }),
        ('Financial Details', {
            'fields': ('buy_price_display', 'sell_price_display', 'price', 'profit_display', 'profit_margin_display'),
            'description': 'Financial information from the original product.'
        }),
        ('Inventory', {
            'fields': ('stock_display',),
            'description': 'Stock information from the original product.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def buy_price_display(self, obj):
        """Display the buy price from the original product"""
        if obj.product:
            return f"${obj.product.buy_price}"
        return "N/A"
    buy_price_display.short_description = "Buy Price"
    buy_price_display.admin_order_field = 'product__buy_price'
    
    def sell_price_display(self, obj):
        """Display the sell price from the original product"""
        if obj.product:
            return f"${obj.product.sell_price}"
        return "N/A"
    sell_price_display.short_description = "Sell Price"
    sell_price_display.admin_order_field = 'product__sell_price'
    
    def profit_display(self, obj):
        """Calculate and display profit per unit"""
        if obj.product and obj.product.buy_price is not None and obj.product.sell_price is not None:
            profit = obj.product.sell_price - obj.product.buy_price
            color = "green" if profit > 0 else "red" if profit < 0 else "orange"
            return format_html('<span style="color: {}; font-weight: bold;">${:.2f}</span>', color, profit)
        return format_html('<span style="color: gray;">-</span>')
    profit_display.short_description = "Profit/Unit"
    
    def profit_margin_display(self, obj):
        """Calculate and display profit margin percentage"""
        if obj.product and obj.product.buy_price is not None and obj.product.sell_price is not None and obj.product.sell_price > 0:
            profit = obj.product.sell_price - obj.product.buy_price
            margin = (profit / obj.product.sell_price) * 100
            color = "green" if margin > 20 else "orange" if margin > 10 else "red"
            return format_html('<span style="color: {}; font-weight: bold;">{:.1f}%</span>', color, margin)
        return format_html('<span style="color: gray;">-</span>')
    profit_margin_display.short_description = "Profit Margin"
    
    def stock_display(self, obj):
        """Display stock from the original product"""
        if obj.product:
            stock = obj.product.stock
            color = "green" if stock > 10 else "orange" if stock > 0 else "red"
            return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, stock)
        return "N/A"
    stock_display.short_description = "Stock"
    stock_display.admin_order_field = 'product__stock'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "product":
            from products.models import Product
            
            # Get all products for this user
            user_products = Product.objects.filter(user=request.user)
            
            # Filter out already published products
            already_published = OnlineProduct.objects.filter(user=request.user).values_list('product_id', flat=True)
            available_products = user_products.exclude(id__in=already_published)
            
            # If no products for current user and user is superuser, show all products
            if user_products.count() == 0 and request.user.is_superuser:
                kwargs["queryset"] = Product.objects.all()
            else:
                kwargs["queryset"] = available_products
            
            kwargs["empty_label"] = "Choose a product to publish..."
                
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only for new objects
            obj.user = request.user
        super().save_model(request, obj, form, change)


class OnlineOrderItemInline(admin.TabularInline):
    model = OnlineOrderItem
    extra = 0
    readonly_fields = ['total']


@admin.register(OnlineOrder)
class OnlineOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'user', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'user', 'created_at']
    search_fields = ['customer_name', 'customer_email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OnlineOrderItemInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only for new objects
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'contact_email', 'contact_phone', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only for new objects
            obj.user = request.user
        super().save_model(request, obj, form, change)
