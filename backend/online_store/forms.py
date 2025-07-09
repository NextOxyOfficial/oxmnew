from django import forms
from .models import OnlineProduct
from products.models import Product


class OnlineProductForm(forms.ModelForm):
    class Meta:
        model = OnlineProduct
        fields = ['product', 'is_published']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Only show products for the current user (will be set in admin)
        if hasattr(self, 'request') and self.request:
            # Filter to show only products that aren't already published
            already_published = OnlineProduct.objects.filter(user=self.request.user).values_list('product_id', flat=True)
            available_products = Product.objects.filter(user=self.request.user).exclude(id__in=already_published)
            
            if self.instance and self.instance.pk:
                # If editing, include the current product in the queryset
                available_products = available_products | Product.objects.filter(id=self.instance.product.id)
            
            self.fields['product'].queryset = available_products
            self.fields['product'].empty_label = "Select a product to publish..."
        
        # Add help text
        self.fields['product'].help_text = "Select an existing product from your inventory to publish to the online store."
        self.fields['is_published'].help_text = "Check this to make the product visible in your online store."
