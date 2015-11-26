import uuid
import json

from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.views import get_user_and_user_key, get_audit_attrs

from course.models import Course, CourseConcept, ConceptRelationship
from course.serializers import CourseSerializer

class CourseDetailView(APIView):
    """
    GET, POST and PUT APIs for a single course
    """

    def get(self, request, course_id, format=None):
        """
        Get course by course_id
        """
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404

        serializer = CourseSerializer(course)
        data = serializer.data
        return Response(data)

    @method_decorator(login_required)
    def post(self, request):

        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.data
        audit_attrs = get_audit_attrs(request.user)
        validated_data.update(audit_attrs)
        
        course = serializer.create(validated_data)
        serializer = CourseSerializer(course)
        return Response(serializer.data, status.HTTP_201_CREATED)

    @method_decorator(login_required)
    def put(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404

        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.user.id != course.created_by.id:
            return Response({"permission": "denied"}, status=status.HTTP_403_FORBIDDEN)

        validated_data = serializer.data
        audit_attrs = get_audit_attrs(course.created_by, request.user)
        validated_data.update(audit_attrs)
        serializer.update(course, validated_data)
        return Response(serializer.data, status.HTTP_200_OK)
