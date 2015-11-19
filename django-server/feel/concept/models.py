import uuid
from django.db import models

from core.models import TimestampedModel
from jsonfield import JSONField


class Concept(TimestampedModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()

    def __str__(self):
        return "{} created by {} ".format(self.name, self.created_by)



class ConceptSection(TimestampedModel):

    MARKDOWN = 1
    QUIZ = 2
    VIDEO = 3
    VISUALIZATION = 4

    SECTION_TYPES = (
        (MARKDOWN, 1),
        (QUIZ, 2),
        (VIDEO, 3),
        (VISUALIZATION, 4),
    )

    concept = models.ForeignKey(Concept)
    position = models.IntegerField()
    section_type = models.IntegerField(choices=SECTION_TYPES)
    data = JSONField()

    def __str__(self):
        return "{} - Section {} at position {}".format(self.concept, self.section_type, self.position)


    class Meta:
        unique_together = ('concept', 'position', )