from rest_framework import serializers

from taggit.models import Tag

class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag
        fields = ('name', )


def set_model_attrs(model, attrs):
    for field, value in attrs.items():
        setattr(model, field, value)
    return model