# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0009_auto_20151118_0118'),
    ]

    operations = [
        migrations.RenameField(
            model_name='quiz',
            old_name='id',
            new_name='uuid',
        ),
    ]
