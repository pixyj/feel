# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('concept', '0004_auto_20151122_1259'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='ConceptInlineQuiz',
            new_name='ConceptSectionQuiz',
        ),
    ]
