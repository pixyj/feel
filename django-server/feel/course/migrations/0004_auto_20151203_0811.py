# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0003_auto_20151203_0552'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='conceptdependency',
            unique_together=set([('course', 'start', 'end')]),
        ),
    ]
