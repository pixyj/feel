from django.db import models
from django.contrib.postgres.fields import JSONField

from core.models import TimestampedModel, UUIDModel, SlugModel

class CodeQuiz(TimestampedModel, UUIDModel):
    problem_statement = models.TextField(default="", blank=True)
    bootstrap_code = models.TextField(default="", blank=True)
    time_limit = models.IntegerField(default=5000)
    memory_limit = models.IntegerField(default=262144)
    test_cases = JSONField()

    def __str__(self):
        return "{} created by {}".format(self.problem_statement, 
            self.created_by)
