import uuid;

from django.db import models
from django.contrib.auth.models import User

from taggit.managers import TaggableManager

from core.models import TimestampedModel


QUIZ_TYPES = (
    (1, 'SHORT_ANSWER'),
    (2, 'MCQ'),
)

class Quiz(TimestampedModel):

    quiz_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    version = models.IntegerField()

    question_input = models.TextField()
    question_display = models.TextField()
    
    quiz_type = models.IntegerField(choices=QUIZ_TYPES)

    tags = TaggableManager(blank=True)

    def __str__(self):
        return "{} - v{} Created by {}".format(self.question_input, self.version, self.created_by)


    class Meta:
        unique_together = ('quiz_id', 'version')


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



#https://github.com/pramodliv1/conceptgrapher/blob/master/server/cg/quiz/models.py
#The QuizAttempt model is inspired by the same model from my previous project

SESSION_KEY_MAX_LENGTH = 40 #Equal to session_key max length


class QuizAttempt(models.Model):

    quiz = models.ForeignKey(Quiz)
    user = models.ForeignKey(User, null=True)

    #user_key = user_id if user is logged-in else session_key
    user_key = models.CharField(max_length=SESSION_KEY_MAX_LENGTH)

    attempt_number = models.IntegerField()
    result = models.BooleanField()

    answer = models.TextField(blank=True)
    choices = models.TextField(blank=True) #Denormalized -> Contains choiceIds separated by commas to make writes faster

    created_at = models.DateTimeField()

    class Meta:
        unique_together = ("quiz", "user_key", "attempt_number", )

    def __str__(self):
        if self.user is None:
            user_print = self.user_key
        else:
            user_print = self.user

        return "{} attempted {} - Result: {}".format(user_print, self.quiz, self.result)
