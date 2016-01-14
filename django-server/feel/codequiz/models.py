import json
import requests

from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField

from core.models import TimestampedModel, UUIDModel


class CodeQuiz(TimestampedModel, UUIDModel):
    problem_statement = models.TextField(default="", blank=True)
    bootstrap_code = models.TextField(default="", blank=True)
    time_limit = models.IntegerField(default=5000)
    memory_limit = models.IntegerField(default=262144)
    test_cases = JSONField()

    @property
    def input_list(self):
        inputs = [test_case['input'].strip() for test_case in self.test_cases]
        return json.dumps(inputs)

    @property
    def output_list(self):
        return [test_case['output'].strip() for test_case in self.test_cases]

    def __str__(self):
        return self.problem_statement


EVALUATION_STATE = (
    (0, 'NOT_EVALUATED'),
    (1, 'EVALUATING'),
    (2, 'EVALUATED'),
    (3, 'EVALUATION_FAILED'),
)
SESSION_KEY_MAX_LENGTH = 40  # Equal to session_key max length
SUBMIT_URL = 'http://api.hackerrank.com/checker/submission.json'


class CodeQuizAttempt(UUIDModel):
    codequiz = models.ForeignKey(CodeQuiz)
    user = models.ForeignKey(User, null=True)
    # user_key = user_id if user is logged-in else session_key
    user_key = models.CharField(max_length=SESSION_KEY_MAX_LENGTH, db_index=True)

    state = models.IntegerField(choices=EVALUATION_STATE, default=0)
    code = models.TextField(db_index=True)
    result = models.BooleanField(default=False)
    response = JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def get_answered_codequiz_count_in(cls, user_key, ids):
        return CodeQuizAttempt.objects.filter(pk__in=ids, 
                                              user_key=user_key, 
                                              result=True)\
                                        .count()

    @property
    def outputs(self):
        return [output.strip() for output in self.response['result']['stdout']]

    def submit(self):
        assert(self.state in [0, 3])
        payload = {
            'source': self.code,
            'lang': '30',  # HackerRank code for Python 3
            'testcases': self.codequiz.input_list,
            'api_key': settings.HACKERRANK_API_KEY,
            'format': 'json',
            'wait': 'true'
        }
        session = requests.Session()
        http_response = session.post(SUBMIT_URL, data=payload)
        response = http_response.json()
        self.response = response
        outputs = None
        if http_response.status_code == 200:
            self.state = 2
            outputs = self.outputs
            if self.codequiz.output_list == outputs:
                self.result = True
        else:
            self.state = 3
        self.save()
        return outputs

    @classmethod
    def get_user_attempts_in_quizzes(klass, user_key, quiz_ids):
        return CodeQuizAttempt.objects.filter(user_key=user_key)\
                                      .filter(codequiz__in=quiz_ids)\
                                      .filter(state=2)

    def __str__(self):
        if self.user is None:
            user_print = self.user_key
        else:
            user_print = self.user
        s = "{} - {} attempted {} - Result: {}"
        return s.format(self.created_at, user_print, self.codequiz,
                        self.result)

    class Meta:
        unique_together = ("codequiz", "user_key", "code", )
