from django.db import models
from django.contrib.auth.models import User

class TimestampedModel(models.Model):
    
    created_at = models.DateTimeField()
    last_modified_at = models.DateTimeField()

    created_by = models.ForeignKey(User, related_name="%(class)s_created_by")
    last_modified_by = models.ForeignKey(User, related_name="%(class)s_last_modified_by")


    class Meta:
        abstract = True