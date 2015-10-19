from rest_framework import serializers

from quiz.models import Quiz, ShortAnswer, Choice
from core.serializers import TagSerializer

class ShortAnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShortAnswer
        fields = ('id', 'answer', 'created_at')


class ChoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Choice
        fields = ('id', 'choice_input', 'choice_display', 'is_correct', 'created_at')

class QuizSerializer(serializers.ModelSerializer):

    answers = ShortAnswerSerializer(source="shortanswer_set", many=True)
    choices = ChoiceSerializer(source="choice_set", many=True)
    tags = TagSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ('id', 'quiz_id', 'version', 'question_input', 'question_display', 'quiz_type', 'tags', 'created_at', 'answers', 'choices')