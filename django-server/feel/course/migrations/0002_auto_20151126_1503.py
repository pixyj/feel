# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('concept', '0010_auto_20151125_1618'),
        ('course', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConceptDependency',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', auto_created=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(to='course.Course')),
                ('created_by', models.ForeignKey(related_name='conceptdependency_created_by', to=settings.AUTH_USER_MODEL)),
                ('end', models.ForeignKey(related_name='end_set', to='concept.Concept')),
                ('last_modified_by', models.ForeignKey(related_name='conceptdependency_last_modified_by', to=settings.AUTH_USER_MODEL)),
                ('start', models.ForeignKey(related_name='start_set', to='concept.Concept')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.RemoveField(
            model_name='conceptrelationship',
            name='after',
        ),
        migrations.RemoveField(
            model_name='conceptrelationship',
            name='before',
        ),
        migrations.RemoveField(
            model_name='conceptrelationship',
            name='course',
        ),
        migrations.RemoveField(
            model_name='conceptrelationship',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='conceptrelationship',
            name='last_modified_by',
        ),
        migrations.DeleteModel(
            name='ConceptRelationship',
        ),
    ]
