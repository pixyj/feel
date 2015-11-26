# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0010_auto_20151125_1618'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ConceptRelationship',
            fields=[
                ('id', models.AutoField(verbose_name='ID', auto_created=True, serialize=False, primary_key=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('after', models.ForeignKey(related_name='after_set', to='concept.Concept')),
                ('before', models.ForeignKey(related_name='before_set', to='concept.Concept')),
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
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, serialize=False, primary_key=True)),
                ('name', models.TextField(blank=True)),
                ('is_published', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(related_name='course_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(related_name='course_last_modified_by', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CourseConcept',
            fields=[
                ('id', models.AutoField(verbose_name='ID', auto_created=True, serialize=False, primary_key=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('course', models.ForeignKey(to='course.Course')),
                ('created_by', models.ForeignKey(related_name='courseconcept_created_by', to=settings.AUTH_USER_MODEL)),
                ('last_modified_by', models.ForeignKey(related_name='courseconcept_last_modified_by', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='conceptrelationship',
            name='course',
            field=models.ForeignKey(to='course.Course'),
        ),
        migrations.AddField(
            model_name='conceptrelationship',
            name='created_by',
            field=models.ForeignKey(related_name='conceptrelationship_created_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='conceptrelationship',
            name='last_modified_by',
            field=models.ForeignKey(related_name='conceptrelationship_last_modified_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='courseconcept',
            unique_together=set([('course', 'concept')]),
        ),
    ]
