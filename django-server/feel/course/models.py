import uuid
from django.db import models

from core.models import TimestampedModel
from concept.models import Concept


class Course(TimestampedModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return "{} created by {} - Published? {}".format(self.name, self.created_by, self.is_published)



class CourseConcept(TimestampedModel):
    course = models.ForeignKey(Course)
    concept = models.ForeignKey(Concept)

    def __str__(self):
        return "{} belonging to {}".format(self.concept, self.course)

    class Meta:
        unique_together = ("course", "concept", )



class ConceptDependency(TimestampedModel):
    course = models.ForeignKey(Course)
    start = models.ForeignKey(Concept, related_name="start_set")
    end = models.ForeignKey(Concept, related_name="end_set")

    def __str__(self):
        return "{} -> {} in {}".format(self.start, self.end, self. course)
