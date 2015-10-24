# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import taggit.managers
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('taggit', '0002_auto_20150616_2121'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created_at', models.DateTimeField()),
                ('last_modified_at', models.DateTimeField()),
                ('choice_input', models.TextField()),
                ('choice_display', models.TextField()),
                ('is_correct', models.BooleanField()),
                ('created_by', models.ForeignKey(related_name='choice_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(related_name='choice_last_modified_by', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Quiz',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created_at', models.DateTimeField()),
                ('last_modified_at', models.DateTimeField()),
                ('question_input', models.TextField()),
                ('question_display', models.TextField()),
                ('version', models.IntegerField()),
                ('quiz_type', models.IntegerField(choices=[(1, 'SHORT_ANSWER'), (2, 'MCQ')])),
                ('created_by', models.ForeignKey(related_name='quiz_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(related_name='quiz_last_modified_by', to=settings.AUTH_USER_MODEL)),
                ('tags', taggit.managers.TaggableManager(verbose_name='Tags', to='taggit.Tag', help_text='A comma-separated list of tags.', through='taggit.TaggedItem')),
            ],
        ),
        migrations.CreateModel(
            name='ShortAnswer',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created_at', models.DateTimeField()),
                ('last_modified_at', models.DateTimeField()),
                ('answer', models.TextField()),
                ('created_by', models.ForeignKey(related_name='shortanswer_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(related_name='shortanswer_last_modified_by', to=settings.AUTH_USER_MODEL)),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
            ],
        ),
        migrations.AddField(
            model_name='choice',
            name='quiz',
            field=models.ForeignKey(to='quiz.Quiz'),
        ),
        migrations.AlterUniqueTogether(
            name='shortanswer',
            unique_together=set([('quiz', 'answer')]),
        ),
        migrations.AlterUniqueTogether(
            name='quiz',
            unique_together=set([('question_input', 'version')]),
        ),
        migrations.AlterUniqueTogether(
            name='choice',
            unique_together=set([('quiz', 'choice_input')]),
        ),
    ]
