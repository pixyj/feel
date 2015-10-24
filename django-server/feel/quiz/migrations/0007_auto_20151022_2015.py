# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('quiz', '0006_auto_20151020_1253'),
    ]

    operations = [
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.AutoField(primary_key=True, auto_created=True, verbose_name='ID', serialize=False)),
                ('user_key', models.CharField(max_length=40)),
                ('attempt_number', models.IntegerField()),
                ('result', models.BooleanField()),
                ('answer', models.TextField(blank=True)),
                ('choices', models.TextField(blank=True)),
                ('created_at', models.DateTimeField()),
                ('quiz', models.ForeignKey(to='quiz.Quiz')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, null=True)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='quizattempt',
            unique_together=set([('quiz', 'user_key', 'attempt_number')]),
        ),
    ]
