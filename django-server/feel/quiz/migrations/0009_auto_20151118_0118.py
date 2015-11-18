# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0008_auto_20151024_1624'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quiz',
            name='id',
            field=models.UUIDField(primary_key=True, editable=False, serialize=False, default=uuid.uuid4),
        ),
    ]
