# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid
import taggit.managers
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('taggit', '0003_auto_20151118_0335'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('choice_input', models.TextField()),
                ('choice_display', models.TextField()),
                ('is_correct', models.BooleanField()),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='choice_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='choice_last_modified_by')),
            ],
        ),
        migrations.CreateModel(
            name='Quiz',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('question_input', models.TextField()),
                ('question_display', models.TextField()),
                ('quiz_type', models.IntegerField(choices=[(1, 'SHORT_ANSWER'), (2, 'MCQ')])),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='quiz_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='quiz_last_modified_by')),
                ('tags', taggit.managers.TaggableManager(blank=True, verbose_name='Tags', help_text='A comma-separated list of tags.', through='taggit.TaggedItem', to='taggit.Tag')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('user_key', models.CharField(max_length=40)),
                ('attempt_number', models.IntegerField()),
                ('result', models.BooleanField()),
                ('answer', models.TextField(blank=True)),
                ('choices', models.TextField(blank=True)),
                ('created_at', models.DateTimeField()),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
                ('user', models.ForeignKey(null=True, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ShortAnswer',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('answer', models.TextField()),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='shortanswer_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='shortanswer_last_modified_by')),
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
            name='quizattempt',
            unique_together=set([('quiz', 'user_key', 'attempt_number')]),
        ),
        migrations.AlterUniqueTogether(
            name='choice',
            unique_together=set([('quiz', 'choice_input')]),
        ),
    ]
