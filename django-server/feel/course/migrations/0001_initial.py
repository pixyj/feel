# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0002_auto_20151127_1618'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ConceptDependency',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, serialize=False, editable=False, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='Course',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, serialize=False, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=256)),
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
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, serialize=False, editable=False, primary_key=True)),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('course', models.ForeignKey(to='course.Course')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='courseconcept_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='courseconcept_last_modified_by')),
            ],
        ),
        migrations.CreateModel(
            name='CourseSlug',
            fields=[
                ('slug', models.CharField(max_length=40, serialize=False, primary_key=True)),
                ('course', models.ForeignKey(to='course.Course')),
            ],
            options={
                'abstract': False,
            },
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
            field=models.ForeignKey(to='course.CourseConcept', related_name='end_set'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='last_modified_by',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='conceptdependency_last_modified_by'),
        ),
        migrations.AddField(
            model_name='conceptdependency',
            name='start',
            field=models.ForeignKey(to='course.CourseConcept', related_name='start_set'),
        ),
        migrations.AlterUniqueTogether(
            name='courseconcept',
            unique_together=set([('course', 'concept')]),
        ),
        migrations.AlterUniqueTogether(
            name='conceptdependency',
            unique_together=set([('course', 'start', 'end')]),
        ),
    ]
