# Generated by Django 4.2.7 on 2025-07-09 08:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_customdomain_dnsrecord'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customdomain',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
