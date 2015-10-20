# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0004_auto_20151019_1933'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='quiz',
            unique_together=set([]),
        ),
    ]
