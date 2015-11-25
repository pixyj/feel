# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0009_concept_is_published'),
    ]

    operations = [
        migrations.AlterField(
            model_name='concept',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='concept',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='conceptsection',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='conceptsection',
            name='last_modified_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
