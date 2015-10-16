from django.db import models
from taggit.managers import TaggableManager

from core.models import TimestampedModel

QUIZ_TYPES = (
    (1, 'SHORT_ANSWER'),
    (2, 'MCQ'),
)

class Quiz(TimestampedModel):

    question_input = models.TextField()
    question_display = models.TextField()
    version = models.IntegerField()

    quiz_type = models.IntegerField(choices=QUIZ_TYPES)

    tags = TaggableManager()

    def __str__(self):
        return "{} - v{} Created by {}".format(self.question_input, self.version, self.created_by)


    class Meta:
        unique_together = ('question_input', 'version')


class ShortAnswer(TimestampedModel):
    quiz = models.ForeignKey(Quiz)
    answer = models.TextField()


    class Meta:
        unique_together = ('quiz', 'answer')


    def __str__(self):
        return "{} is an answer to {} Created by {}".format(self.answer, 
            self.quiz, self.created_by)


class Choice(TimestampedModel):
    quiz = models.ForeignKey(Quiz)
    choice_input = models.TextField()
    choice_display = models.TextField()
    is_correct = models.BooleanField()

    class Meta:
        unique_together = ('quiz', 'choice_input')

    def __str__(self):
        status = "correct" if self.is_correct else "wrong"
        return "{} is a {} choice to {} Created by {}".format(self.choice_input, status, self.quiz, self.created_by)


