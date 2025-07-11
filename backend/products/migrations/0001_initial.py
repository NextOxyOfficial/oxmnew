# Generated by Django 4.2.7 on 2025-06-28 07:50

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import products.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('suppliers', '0005_fix_payment_table'),
        ('core', '0011_level'),
    ]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('location', models.CharField(help_text='Storage location', max_length=200)),
                ('details', models.TextField(blank=True, help_text='Product description and details', null=True)),
                ('has_variants', models.BooleanField(default=False, help_text='True if product has color/size variants')),
                ('buy_price', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('sell_price', models.DecimalField(decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('stock', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='core.category')),
                ('supplier', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='suppliers.supplier')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('name', 'user')},
            },
        ),
        migrations.CreateModel(
            name='ProductSale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('customer_name', models.CharField(blank=True, max_length=200, null=True)),
                ('customer_phone', models.CharField(blank=True, max_length=20, null=True)),
                ('customer_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('sale_date', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sales', to='products.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='product_sales', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-sale_date'],
            },
        ),
        migrations.CreateModel(
            name='ProductVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('color', models.CharField(max_length=50)),
                ('size', models.CharField(max_length=50)),
                ('weight', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('weight_unit', models.CharField(blank=True, choices=[('g', 'Grams'), ('kg', 'Kilograms'), ('lb', 'Pounds'), ('oz', 'Ounces')], max_length=5, null=True)),
                ('custom_variant', models.CharField(blank=True, help_text='Custom variant description', max_length=100, null=True)),
                ('buy_price', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('sell_price', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ('stock', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='products.product')),
            ],
            options={
                'ordering': ['color', 'size'],
                'unique_together': {('product', 'color', 'size', 'custom_variant')},
            },
        ),
        migrations.CreateModel(
            name='ProductStockMovement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('movement_type', models.CharField(choices=[('in', 'Stock In'), ('out', 'Stock Out'), ('adjustment', 'Adjustment'), ('sale', 'Sale'), ('return', 'Return')], max_length=20)),
                ('quantity', models.IntegerField(help_text='Positive for stock in, negative for stock out')),
                ('previous_stock', models.PositiveIntegerField()),
                ('new_stock', models.PositiveIntegerField()),
                ('reason', models.CharField(blank=True, max_length=200, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stock_movements', to='products.product')),
                ('reference_sale', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='products.productsale')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stock_movements', to=settings.AUTH_USER_MODEL)),
                ('variant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='stock_movements', to='products.productvariant')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddField(
            model_name='productsale',
            name='variant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sales', to='products.productvariant'),
        ),
        migrations.CreateModel(
            name='ProductPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to=products.models.product_photo_upload_path)),
                ('alt_text', models.CharField(blank=True, max_length=200, null=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='products.product')),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),
    ]
