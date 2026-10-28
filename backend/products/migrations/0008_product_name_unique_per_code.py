"""Allow one name under several product codes.

The old rule was unique (user, name): a shop could not stock "Engine Oil" twice
even with two different codes. It is replaced by two partial constraints —
(user, name, code) for products that have a code, and (user, name) for those
that do not.

Safe on existing data by construction: every row already satisfied the stricter
(user, name) rule, and any subset of rows unique on (user, name) is also unique
on (user, name, code).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0007_alter_productphoto_image"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="product",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(
                condition=models.Q(("product_code__isnull", False))
                & ~models.Q(("product_code", "")),
                fields=("user", "name", "product_code"),
                name="uniq_product_name_code_per_shop",
            ),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(
                condition=models.Q(("product_code__isnull", True))
                | models.Q(("product_code", "")),
                fields=("user", "name"),
                name="uniq_product_name_per_shop_without_code",
            ),
        ),
    ]
