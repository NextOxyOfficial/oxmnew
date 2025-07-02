from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')
    company = models.CharField(max_length=200, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    store_logo = models.ImageField(
        upload_to='store_logos/', blank=True, null=True)
    banner_image = models.ImageField(
        upload_to='banner_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class UserSettings(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('bn', 'Bangla'),
    ]

    CURRENCY_CHOICES = [
        ('USD', 'USD - US Dollar'),
        ('EUR', 'EUR - Euro'),
        ('GBP', 'GBP - British Pound'),
        ('JPY', 'JPY - Japanese Yen'),
        ('CAD', 'CAD - Canadian Dollar'),
        ('AUD', 'AUD - Australian Dollar'),
        ('CHF', 'CHF - Swiss Franc'),
        ('CNY', 'CNY - Chinese Yuan'),
        ('BDT', 'BDT - Bangladeshi Taka'),
    ]

    # Currency code to symbol mapping
    CURRENCY_SYMBOLS = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CHF': 'CHF',
        'CNY': '¥',
        'BDT': '৳',
    }

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='settings')
    language = models.CharField(
        max_length=5, choices=LANGUAGE_CHOICES, default='en', help_text='User preferred language')
    currency = models.CharField(
        max_length=5, choices=CURRENCY_CHOICES, default='USD')
    currency_symbol = models.CharField(
        max_length=5, default='$', help_text='Currency symbol based on selected currency')
    email_notifications = models.BooleanField(default=True)
    marketing_notifications = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Automatically set currency symbol based on currency code
        if self.currency in self.CURRENCY_SYMBOLS:
            self.currency_symbol = self.CURRENCY_SYMBOLS[self.currency]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s Settings"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        UserSettings.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)

    if hasattr(instance, 'settings'):
        instance.settings.save()
    else:
        UserSettings.objects.create(user=instance)


class Gift(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='gifts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Gifts"
        ordering = ['name']
        # Prevent duplicate gift names per user
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('orders', 'Order Count'),
        ('amount', 'Purchase Amount'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=ACHIEVEMENT_TYPES)
    value = models.PositiveIntegerField(
        help_text='Target value (number of orders or amount in dollars)')
    points = models.PositiveIntegerField(
        help_text='Points awarded when achievement is earned')
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='achievements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Achievements"
        ordering = ['type', 'value']
        # Prevent duplicate achievement names per user
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class Level(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='levels')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Levels"
        ordering = ['name']
        # Prevent duplicate level names per user
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class Brand(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='brands')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Brands"
        ordering = ['name']
        # Prevent duplicate brand names per user
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class PaymentMethod(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='payment_methods')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Payment Methods"
        ordering = ['name']
        # Prevent duplicate payment method names per user
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"
