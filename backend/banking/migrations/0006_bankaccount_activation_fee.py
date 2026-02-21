from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("banking", "0005_bankaccount_account_number"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE banking_bankaccount "
                        "ADD COLUMN IF NOT EXISTS activation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00;"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="bankaccount",
                    name="activation_fee",
                    field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
                )
            ],
        ),
    ]
