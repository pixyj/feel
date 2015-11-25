# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0007_auto_20151124_1440'),
    ]

    operations = [
        migrations.AlterField(
            model_name='concept',
            name='name',
            field=models.TextField(blank=True),
        ),
    ]
