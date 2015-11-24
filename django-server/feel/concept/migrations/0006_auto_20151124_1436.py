# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0005_auto_20151122_1300'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='conceptsectionquiz',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='conceptsectionquiz',
            name='concept',
        ),
        migrations.RemoveField(
            model_name='conceptsectionquiz',
            name='quiz',
        ),
        migrations.RemoveField(
            model_name='conceptsectionquiz',
            name='section',
        ),
        migrations.DeleteModel(
            name='ConceptSectionQuiz',
        ),
    ]
