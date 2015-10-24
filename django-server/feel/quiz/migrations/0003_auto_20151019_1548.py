# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0002_quiz_quiz_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quiz',
            name='quiz_id',
            field=models.UUIDField(db_index=True, default=uuid.uuid4),
        ),
    ]
