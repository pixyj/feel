from rest_framework import serializers

from core.serializers import TagSerializer

from course.models import Course, CourseConcept, ConceptRelationship



class CourseConceptSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return CourseConcept.objects.create(**validated_data)

    class Meta:
        model = CourseConcept
        fields = ('course_id', 'concept_id', )



class CourseSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return Course.objects.create(**validated_data)

    class Meta:
        model = Course
        fields = ('uuid', 'name', 'is_published', )
        



