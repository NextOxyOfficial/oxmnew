from django.contrib.auth.models import User
from django.db import models
from django.utils.crypto import get_random_string


class PublicAPIKey(models.Model):
    """
    Model to store public API keys for users to access their product data
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="public_api_key"
    )
    key = models.CharField(
        max_length=64,
        unique=True,
        help_text="Public API key for accessing user's product data",
    )
    name = models.CharField(
        max_length=100,
        default="Default API Key",
        help_text="Human-readable name for this API key",
    )
    is_active = models.BooleanField(
        default=True, help_text="Whether this API key is active and can be used"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(
        null=True, blank=True, help_text="Last time this API key was used"
    )

    # Rate limiting fields
    requests_per_hour = models.PositiveIntegerField(
        default=1000, help_text="Maximum requests per hour for this API key"
    )
    requests_per_day = models.PositiveIntegerField(
        default=10000, help_text="Maximum requests per day for this API key"
    )

    class Meta:
        verbose_name = "Public API Key"
        verbose_name_plural = "Public API Keys"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.key:
            # Generate a unique API key
            self.key = self.generate_key()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_key():
        """Generate a unique API key"""
        return f"pak_{get_random_string(32, 'abcdefghijklmnopqrstuvwxyz0123456789')}"

    def regenerate_key(self):
        """Regenerate the API key"""
        self.key = self.generate_key()
        self.save(update_fields=["key", "updated_at"])
        return self.key

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class APIKeyUsageLog(models.Model):
    """
    Log API key usage for analytics and rate limiting
    """

    api_key = models.ForeignKey(
        PublicAPIKey, on_delete=models.CASCADE, related_name="usage_logs"
    )
    endpoint = models.CharField(
        max_length=100, help_text="The API endpoint that was accessed"
    )
    ip_address = models.GenericIPAddressField(help_text="IP address of the request")
    user_agent = models.TextField(
        blank=True, help_text="User agent string from the request"
    )
    response_status = models.PositiveIntegerField(help_text="HTTP response status code")
    response_time_ms = models.PositiveIntegerField(
        null=True, blank=True, help_text="Response time in milliseconds"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "API Key Usage Log"
        verbose_name_plural = "API Key Usage Logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["api_key", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"{self.api_key.key[:8]}... - {self.endpoint} ({self.response_status})"
