# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import taggit.managers


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0003_auto_20151019_1548'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quiz',
            name='tags',
            field=taggit.managers.TaggableManager(blank=True, to='taggit.Tag', through='taggit.TaggedItem', verbose_name='Tags', help_text='A comma-separated list of tags.'),
        ),
    ]
