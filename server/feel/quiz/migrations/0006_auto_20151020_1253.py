# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0005_auto_20151020_1238'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='quiz',
            unique_together=set([('quiz_id', 'version')]),
        ),
    ]
