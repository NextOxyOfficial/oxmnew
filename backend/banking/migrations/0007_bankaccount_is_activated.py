from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("banking", "0006_bankaccount_activation_fee"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE banking_bankaccount "
                        "ADD COLUMN IF NOT EXISTS is_activated BOOLEAN;"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                ),
                migrations.RunSQL(
                    sql=(
                        "UPDATE banking_bankaccount "
                        "SET is_activated = TRUE "
                        "WHERE is_activated IS NULL;"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE banking_bankaccount "
                        "ALTER COLUMN is_activated SET DEFAULT TRUE;"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE banking_bankaccount "
                        "ALTER COLUMN is_activated SET NOT NULL;"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="bankaccount",
                    name="is_activated",
                    field=models.BooleanField(default=True),
                )
            ],
        )
    ]
