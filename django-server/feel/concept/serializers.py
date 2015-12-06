from rest_framework import serializers

from core.serializers import TagSerializer

from concept.models import Concept, ConceptSection



class ConceptSectionSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return ConceptSection.objects.create(**validated_data)


    class Meta:
        model = ConceptSection
        fields = ('id', 'type', 'data', )


class ConceptSerializer(serializers.ModelSerializer):

    sections = ConceptSectionSerializer(source="conceptsection_set", many=True)

    class Meta:
        model = Concept
        fields = ('id', 'name', 'sections', 'is_published', 'slug', )
        



