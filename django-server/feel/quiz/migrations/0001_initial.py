# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2015-12-07 05:44
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('choice_input', models.TextField()),
                ('choice_display', models.TextField()),
                ('is_correct', models.BooleanField()),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='choice_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='choice_last_modified_by', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Quiz',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('question_input', models.TextField()),
                ('question_display', models.TextField()),
                ('quiz_type', models.IntegerField(choices=[(1, 'SHORT_ANSWER'), (2, 'MCQ')])),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_last_modified_by', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_key', models.CharField(db_index=True, max_length=40)),
                ('attempt_number', models.IntegerField()),
                ('result', models.BooleanField()),
                ('answer', models.TextField(blank=True)),
                ('choices', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(db_index=True)),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.Quiz')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ShortAnswer',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('answer', models.TextField()),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shortanswer_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shortanswer_last_modified_by', to=settings.AUTH_USER_MODEL)),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.Quiz')),
            ],
        ),
        migrations.AddField(
            model_name='choice',
            name='quiz',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.Quiz'),
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
