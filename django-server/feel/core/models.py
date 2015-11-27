import uuid

from django.db import models
from django.contrib.auth.models import User

#To get all sql queries sent by Django from py shell
import logging
l = logging.getLogger('django.db.backends')
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())



class TimestampedModelManager(models.Manager):

    def get_queryset(self):
        return super(TimestampedModelManager, self).get_queryset().order_by("-created_at")



class TimestampedModel(models.Model):
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name="%(class)s_created_by")
    
    last_modified_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(User, related_name="%(class)s_last_modified_by")

    objects = TimestampedModelManager()

    class Meta:
        abstract = True


class UUIDModel(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
