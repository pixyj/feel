from rest_framework import serializers

def set_model_attrs(model, attrs):
    for field, value in attrs.items():
        setattr(model, field, value)
    return model