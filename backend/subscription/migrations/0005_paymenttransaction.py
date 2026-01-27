from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("subscription", "0004_alter_usersmscredit_user"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentTransaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "sp_order_id",
                    models.CharField(blank=True, max_length=200, null=True, unique=True),
                ),
                (
                    "customer_order_id",
                    models.CharField(max_length=200, unique=True),
                ),
                (
                    "payment_type",
                    models.CharField(
                        choices=[
                            ("subscription", "Subscription"),
                            ("sms_package", "SMS Package"),
                            ("unknown", "Unknown"),
                        ],
                        default="unknown",
                        max_length=20,
                    ),
                ),
                (
                    "amount",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("currency", models.CharField(blank=True, max_length=10)),
                ("is_successful", models.BooleanField(default=False)),
                ("is_applied", models.BooleanField(default=False)),
                ("applied_at", models.DateTimeField(blank=True, null=True)),
                ("raw_response", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
