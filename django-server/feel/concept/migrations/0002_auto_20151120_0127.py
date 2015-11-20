# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='conceptsection',
            old_name='section_type',
            new_name='type',
        ),
    ]
