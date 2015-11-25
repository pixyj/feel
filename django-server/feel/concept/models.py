import uuid
from django.db import models

from core.models import TimestampedModel
from quiz.models import Quiz


class Concept(TimestampedModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return "{} created by {} - Published? {}".format(self.name, self.created_by, self.is_published)



class ConceptSectionManager(models.Manager):

    def get_queryset(self):
        return super(ConceptSectionManager, self).get_queryset().order_by("position")



class ConceptSection(TimestampedModel):

    PREREQ_QUIZ = 0
    MARKDOWN = 1
    QUIZ = 2
    VIDEO = 3
    VISUALIZATION = 4
    EXTERNAL_RESOURCES = 5
    EXIT_QUIZ = 6

    SECTION_TYPES = (
        (PREREQ_QUIZ, 0),
        (MARKDOWN, 1),
        (QUIZ, 2),
        (VIDEO, 3),
        (VISUALIZATION, 4),
        (EXTERNAL_RESOURCES, 5),
        (EXIT_QUIZ, 6)
    )

    concept = models.ForeignKey(Concept)
    position = models.IntegerField()
    type = models.IntegerField(choices=SECTION_TYPES)

    #Denormalized Field. I did not want to create a new table for each section-type
    #Also, makes the API design match the application state on the client closely.  
    data = models.TextField()

    objects = ConceptSectionManager()

    def get_additional_info(self):
        if self.type == ConceptSection.Quiz:
            return self._get_quiz_info()


    def _get_quiz_info(self):
        data = json.loads(self.data)
        quizzes = data['quizzes']


    def __str__(self):
        return "{} - Section {} at position {}".format(self.concept, self.type, self.position)


    class Meta:
        unique_together = ('concept', 'position', )
