# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quizattempt',
            name='user_key',
            field=models.CharField(max_length=40, db_index=True),
        ),
    ]
