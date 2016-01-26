from rest_framework import serializers

from concept.models import Concept, ConceptSection
from quiz.serializers import QuizSerializer
from quiz.models import Quiz

from codequiz.models import CodeQuiz
from codequiz.serializers import CodeQuizSerializer

class ConceptSectionSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return ConceptSection.objects.create(**validated_data)

    def to_representation(self, instance):
        """
        Only quiz_ids are stored originally in concept sections
        Fetch quiz details from the quiz_ids
        """
        ret = super(ConceptSectionSerializer, self).to_representation(instance)
        if instance.has_quizzes():
            quiz_ids = ret['data']['quiz_ids']
            quiz_models = Quiz.get_detailed_quizzes_in(quiz_ids)
            quizzes = QuizSerializer(quiz_models, many=True).data
            del ret['data']['quiz_ids']
            ret['data']['quizzes'] = quizzes
        elif instance.has_codequizzes():
            quiz_ids = ret['data']['quiz_ids']
            models = CodeQuiz.objects.filter(pk__in=quiz_ids)
            quizzes = CodeQuizSerializer(models, many=True).data
            del ret['data']['quiz_ids']
            ret['data']['quizzes'] = quizzes
        return ret

    class Meta:
        model = ConceptSection
        fields = ('id', 'type', 'data')


class ConceptSerializer(serializers.ModelSerializer):

    sections = ConceptSectionSerializer(source="conceptsection_set", many=True)

    class Meta:
        model = Concept
        fields = ('id', 'name', 'sections', 'is_published', 'slug', )


class ConceptHeadingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Concept
        fields = ('id', 'name', 'created_at', 'last_modified_at', )
