import uuid

from django.db import models
from django.contrib.auth.models import User

#from taggit.managers import TaggableManager

from core.models import TimestampedModel, UUIDModel


QUIZ_TYPES = (
    (1, 'SHORT_ANSWER'),
    (2, 'MCQ'),
)

class Quiz(TimestampedModel, UUIDModel):

    question_input = models.TextField(blank=True)
    question_display = models.TextField(blank=True)
    
    quiz_type = models.IntegerField(choices=QUIZ_TYPES)

    #tags = TaggableManager(blank=True)

    @classmethod
    def get_detailed_quizzes_in(klass, ids):
        return Quiz.objects.filter(pk__in=ids).prefetch_related('shortanswer_set').prefetch_related('choice_set')


    def __str__(self):
        return "{} - Created by {}".format(self.question_input, self.created_by)




class ShortAnswer(TimestampedModel, UUIDModel):

    quiz = models.ForeignKey(Quiz)
    answer = models.TextField(blank=True)


    class Meta:
        unique_together = ('quiz', 'answer')


    def __str__(self):
        return "{} is an answer to {} Created by {}".format(self.answer, 
            self.quiz, self.created_by)


class Choice(TimestampedModel, UUIDModel):
    
    quiz = models.ForeignKey(Quiz)
    choice_input = models.TextField(blank=True)
    choice_display = models.TextField(blank=True)
    is_correct = models.BooleanField()

    class Meta:
        unique_together = ('quiz', 'choice_input')

    def __str__(self):
        status = "correct" if self.is_correct else "wrong"
        return "{} is a {} choice to {} - Created by {}".format(self.choice_input, 
            status, self.quiz, self.created_by)




class QuizUserAttemptManager(models.Manager):

    def _get_choices(self, choice_string_list):
        if choice_string_list == "":
            return {}

        choice_ids = [int(choice_id) for choice_id in choice_string_list.split(",")]

        queryset = Choice.objects.filter(pk__in=choice_ids).only("id", "choice_display")
        choices = [(choice.id, choice.choice_display, ) for choice in queryset]
        return dict(choices)


    def get_user_attempts_by_quiz_id(self, user_key, quiz_id):
        attempts = QuizAttempt.objects.filter(user_key=user_key, quiz_id=quiz_id)

        choice_string_list = ','.join((attempt.choices for attempt in attempts))
        choices_by_id = self._get_choices(choice_string_list)
        
        for attempt in attempts:
            choice_ids = [int(choice_id) for choice_id in attempt.choices.split(",")]
            attempt.choices = [
            {
                "id": choice_id, 
                "choice_display": choices_by_id[choice_id]
            } for choice_id in choice_ids]
        return attempts


    def get_user_attempts_in_quizzes(self, user_key, quiz_ids):
        return QuizAttempt.objects.filter(user_key=user_key).filter(quiz__in=quiz_ids)

    #todo -> ensure multiple correct attempts for same quiz is 
    #either avoided or remove duplicates in this query. 
    def get_answered_quiz_count_in(self, user_key, quiz_ids):
        return self.get_user_attempts_in_quizzes(user_key, quiz_ids).filter(result=True).count()


    def attribute_to_user(self, user, user_key):
        return self.filter(user_key=user_key).update(user_key=user.id, user=user)



#https://github.com/pramodliv1/conceptgrapher/blob/master/server/cg/quiz/models.py
#The QuizAttempt model is inspired by the same model from my previous project
SESSION_KEY_MAX_LENGTH = 40 #Equal to session_key max length

class QuizAttempt(UUIDModel):

    quiz = models.ForeignKey(Quiz)
    user = models.ForeignKey(User, null=True)
    #user_key = user_id if user is logged-in else session_key
    user_key = models.CharField(max_length=SESSION_KEY_MAX_LENGTH, db_index=True)

    attempt_number = models.IntegerField()
    result = models.BooleanField()

    answer = models.TextField(blank=True)
    choices = models.TextField(blank=True) #Denormalized -> Contains choiceIds separated by commas to make writes faster

    created_at = models.DateTimeField(db_index=True)

    objects = QuizUserAttemptManager()

    class Meta:
        unique_together = ("quiz", "user_key", "attempt_number", )

    def __str__(self):
        if self.user is None:
            user_print = self.user_key
        else:
            user_print = self.user

        return "{} - {} attempted {} - Result: {}".format(self.created_at, user_print, self.quiz, self.result)


################################################################################
#
#       signal_receivers, placed at end of file to due to circular imports
#
################################################################################

from . import signal_receivers
