from rest_framework import serializers

from concept.models import Concept, ConceptSection

from core.serializers import TagSerializer

class ConceptSectionSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConceptSection
        fields = ('id', 'position', 'section_type', 'data', )

class ConceptSerializer(serializers.ModelSerializer):

    sections = ConceptSectionSerializer(source="conceptsection_set", many=True)

    class Meta:
        model = Concept
        fields = ('uuid', 'name', 'sections', )
        



