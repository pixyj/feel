# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0008_auto_20151125_1009'),
    ]

    operations = [
        migrations.AddField(
            model_name='concept',
            name='is_published',
            field=models.BooleanField(default=False),
        ),
    ]
