from django.db import models
from django.contrib.auth.models import User

#To get all sql queries sent by Django from py shell
import logging
l = logging.getLogger('django.db.backends')
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

class TimestampedModel(models.Model):
    
    created_at = models.DateTimeField()
    last_modified_at = models.DateTimeField()

    created_by = models.ForeignKey(User, related_name="%(class)s_created_by")
    last_modified_by = models.ForeignKey(User, related_name="%(class)s_last_modified_by")


    class Meta:
        abstract = True
