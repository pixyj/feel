# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0010_auto_20151118_0217'),
        ('concept', '0003_auto_20151120_0415'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConceptExitQuiz',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ConceptInlineQuiz',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
                ('section', models.ForeignKey(to='concept.ConceptSection')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ConceptPrereqQuiz',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AlterUniqueTogether(
            name='conceptprereqquiz',
            unique_together=set([('concept', 'quiz')]),
        ),
        migrations.AlterUniqueTogether(
            name='conceptinlinequiz',
            unique_together=set([('concept', 'quiz')]),
        ),
        migrations.AlterUniqueTogether(
            name='conceptexitquiz',
            unique_together=set([('concept', 'quiz')]),
        ),
    ]
