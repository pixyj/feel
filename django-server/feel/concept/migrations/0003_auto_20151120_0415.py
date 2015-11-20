# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0002_auto_20151120_0127'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conceptsection',
            name='data',
            field=models.TextField(),
        ),
    ]
