# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0007_auto_20151022_2015'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='quiz',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='quiz',
            name='quiz_id',
        ),
        migrations.RemoveField(
            model_name='quiz',
            name='version',
        ),
    ]
