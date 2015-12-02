# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0002_auto_20151202_0953'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quizattempt',
            name='created_at',
            field=models.DateTimeField(db_index=True),
        ),
    ]
