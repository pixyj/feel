# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0006_auto_20151124_1436'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='conceptexitquiz',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='conceptexitquiz',
            name='concept',
        ),
        migrations.RemoveField(
            model_name='conceptexitquiz',
            name='quiz',
        ),
        migrations.AlterUniqueTogether(
            name='conceptprereqquiz',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='conceptprereqquiz',
            name='concept',
        ),
        migrations.RemoveField(
            model_name='conceptprereqquiz',
            name='quiz',
        ),
        migrations.AlterField(
            model_name='conceptsection',
            name='type',
            field=models.IntegerField(choices=[(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6)]),
        ),
        migrations.DeleteModel(
            name='ConceptExitQuiz',
        ),
        migrations.DeleteModel(
            name='ConceptPrereqQuiz',
        ),
    ]
