from rest_framework import serializers

from core.serializers import TagSerializer, set_model_attrs

from course.models import Course, CourseConcept, ConceptDependency




class CourseConceptSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return CourseConcept.objects.create(**validated_data)

    class Meta:
        model = CourseConcept
        fields = ('course_id', 'concept_id', )



class CourseSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return Course.objects.create(**validated_data)

    def update(self, course, validated_data):
        set_model_attrs(course, validated_data)
        course.save()
        return course


    class Meta:
        model = Course
        fields = ('id', 'name', 'is_published', )
        



