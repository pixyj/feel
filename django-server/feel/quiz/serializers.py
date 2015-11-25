from rest_framework import serializers

from quiz.models import Quiz, ShortAnswer, Choice, QuizAttempt
from core.serializers import TagSerializer

class ShortAnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShortAnswer
        fields = ('id', 'answer')


class ChoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Choice
        fields = ('id', 'choice_input', 'choice_display', 'is_correct')

class QuizSerializer(serializers.ModelSerializer):

    answers = ShortAnswerSerializer(source="shortanswer_set", many=True)
    choices = ChoiceSerializer(source="choice_set", many=True)

    class Meta:
        model = Quiz
        fields = ('uuid', 'question_input', 'question_display', 'quiz_type', 'created_at', 'answers', 'choices')


class QuizAttemptSerializer(serializers.ModelSerializer):

    class Meta:
        model = QuizAttempt
        fields = ('user_key', 'attempt_number', 'result', 'answer', 'choices', )
