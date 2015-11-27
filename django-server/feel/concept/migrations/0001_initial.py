# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Concept',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('name', models.TextField(blank=True)),
                ('is_published', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='concept_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='concept_last_modified_by')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ConceptSection',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_modified_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(serialize=False, default=uuid.uuid4, primary_key=True, editable=False)),
                ('position', models.IntegerField()),
                ('type', models.IntegerField(choices=[(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6)])),
                ('data', models.TextField()),
                ('concept', models.ForeignKey(to='concept.Concept')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='conceptsection_created_by')),
                ('last_modified_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='conceptsection_last_modified_by')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='conceptsection',
            unique_together=set([('concept', 'position')]),
        ),
    ]
