# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import jsonfield.fields
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Concept',
            fields=[
                ('created_at', models.DateTimeField()),
                ('last_modified_at', models.DateTimeField()),
                ('uuid', models.UUIDField(primary_key=True, serialize=False, editable=False, default=uuid.uuid4)),
                ('name', models.TextField()),
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
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('created_at', models.DateTimeField()),
                ('last_modified_at', models.DateTimeField()),
                ('position', models.IntegerField()),
                ('section_type', models.IntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4)])),
                ('data', jsonfield.fields.JSONField()),
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
