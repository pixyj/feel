from rest_framework import serializers

from core.serializers import set_model_attrs
from .models import CodeQuiz

class CodeQuizSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return CodeQuiz.objects.create(**validated_data)
        
    def update(self, codequiz, validated_data):
        set_model_attrs(codequiz, validated_data)
        codequiz.save()
        return codequiz

    class Meta:
        model = CodeQuiz
        fields = ('id', 'problem_statement', 'bootstrap_code', 'time_limit', 'memory_limit', )


class CodeQuizAttemptSerializer(object):

    def __init__(self, collection, many=True):
        self.data = []
        for item in collection:
            attrs = {
                "quizId": item.codequiz.id,
                "result": item.result,
                "createdAt": item.created_at
            }
            self.data.append(attrs)

