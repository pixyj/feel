from rest_framework import serializers

from core.serializers import set_model_attrs

from course.models import Course, CourseConcept, ConceptDependency



class CourseConceptSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return CourseConcept.objects.create(**validated_data)

    class Meta:
        model = CourseConcept
        fields = ('concept', )



class ConceptDependencySerializer(serializers.ModelSerializer):

    class Meta:
        model = ConceptDependency
        fields = ('start', 'end', )

class CourseSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return Course.objects.create(**validated_data)

    def update(self, course, validated_data):
        set_model_attrs(course, validated_data)
        course.save()
        return course


    class Meta:
        model = Course
        fields = ('id', 'name', 'is_published', 'slug', 
                    'intro', 'how_to_learn', 'where_to_go_from_here')
        