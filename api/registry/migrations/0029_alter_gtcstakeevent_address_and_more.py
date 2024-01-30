# Generated by Django 4.2.9 on 2024-01-30 13:27

import account.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("registry", "0028_gtcstakeevent_gtc_staking_index_by_staker"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gtcstakeevent",
            name="address",
            field=account.models.EthAddressField(
                db_index=True, max_length=63, null=True
            ),
        ),
        migrations.AlterField(
            model_name="gtcstakeevent",
            name="staker",
            field=account.models.EthAddressField(db_index=True, max_length=63),
        ),
    ]
