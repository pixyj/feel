# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ConceptDependency',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Course',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('name', models.CharField(max_length=256, unique=True)),
                ('is_published', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='course_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='course_last_modified_by')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CourseConcept',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('course', models.ForeignKey(to='course.Course')),
            ],
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='course',
            field=models.ForeignKey(to='course.Course'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='created_by',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='conceptdependency_created_by'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='end',
            field=models.ForeignKey(to='concept.Concept', related_name='end_set'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='last_modified_by',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='conceptdependency_last_modified_by'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='start',
            field=models.ForeignKey(to='concept.Concept', related_name='start_set'),
        ),
        migrations.AlterUniqueTogether(
            name='courseconcept',
            unique_together=set([('course', 'concept')]),
        ),
    ]
