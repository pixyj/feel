# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0002_auto_20151202_1758'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conceptdependency',
            name='end',
            field=models.ForeignKey(to='course.CourseConcept', related_name='end_set'),
        ),
        migrations.AlterField(
            model_name='conceptdependency',
            name='start',
            field=models.ForeignKey(to='course.CourseConcept', related_name='start_set'),
        ),
    ]
