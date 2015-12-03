import uuid
import json

from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db import IntegrityError
from django.utils import timezone
from django.utils.decorators import method_decorator

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.views import get_user_and_user_key, get_audit_attrs

from course.models import Course, CourseSlug, CourseConcept, ConceptDependency
from course.serializers import CourseSerializer, CourseConceptSerializer
from course.serializers import ConceptDependencySerializer

from concept.models import Concept


def get_course_or_404(id_or_slug):
    try:
        pk = uuid.UUID(id_or_slug)
        return get_object_or_404(Course, id=pk)
    except ValueError:
        try:
            courseslug = CourseSlug.objects.get(slug=id_or_slug)
            return courseslug.course
        except CourseSlug.DoesNotExist:
            raise Http404



class CourseDetailView(APIView):
    """
    GET, POST and PUT APIs for a single course
    """

    def get(self, request, pk, format=None):
        """
        Get course by course_id
        """
        course = get_course_or_404(pk)

        if not course.is_published and request.user != course.created_by:
            return Response({"Have": "a little patience", "url": "https://youtu.be/273eSvOwpKk"}, 
                status=status.HTTP_403_FORBIDDEN)

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
    def put(self, request, pk):
        course = get_course_or_404(pk)
        if course.created_by.id != request.user.id:
            return Response({"permission": "denied"}, status=status.HTTP_403_FORBIDDEN)


        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.user.id != course.created_by.id:
            return Response({"permission": "denied"}, status=status.HTTP_403_FORBIDDEN)

        validated_data = serializer.data
        audit_attrs = get_audit_attrs(course.created_by, request.user)
        validated_data.update(audit_attrs)

        previous_is_published = course.is_published
        course = serializer.update(course, validated_data)

        response = serializer.data
        if previous_is_published != course.is_published:
            #import ipdb; ipdb.set_trace()
            response = dict(serializer.data)
            if course.is_published:
                courseslug = course.publish_and_slugify()
            else:
                courseslug = None
                course.unpublish()
            if courseslug is not None:
                response['slug'] = courseslug.slug
            else:
                response['slug'] = None


        return Response(response, status.HTTP_200_OK)



class ConceptView(APIView):

    def get(self, request, course_id):
        course = get_course_or_404(course_id)

        concepts = []
        for c in course.concepts:
            concepts.append({
                "id": c.concept.id,
                "name": c.concept.name,
                "is_published": c.concept.is_published
            })
        return Response(concepts)


    @method_decorator(login_required)
    def post(self, request, course_id):
        course = get_course_or_404(course_id)
        if course.created_by.id != request.user.id:
            return Response({"permission": "denied"}, status=status.HTTP_403_FORBIDDEN)


        audit_attrs = get_audit_attrs(request.user)

        concept_data = {"name": request.data['name'], "is_published": False}
        concept_data.update(audit_attrs)

        with transaction.atomic():
            concept = Concept.objects.create(**concept_data)
            courseconcept = CourseConcept.objects.create(concept=concept, course=course, **audit_attrs)

        return Response({"id": concept.id}, status=status.HTTP_201_CREATED)



class ConceptDetailView(APIView):

    def get(self, request, course_id, format=None):
        pass



class DependencyView(APIView):
    
    def get(self, request, course_id):
        course = get_course_or_404(course_id)
        concepts = course.concepts
        concept_ids = {}
        for c in concepts:
            concept_ids[c.id] = c.concept.id

        deps = course.dependencies
        serialized_deps = []
        for dep in deps:
            serialized_deps.append({
                "start": concept_ids[dep.start_id],
                "end": concept_ids[dep.end_id]
            })
        return Response(serialized_deps)


    @method_decorator(login_required)
    def post(self, request, course_id):
        course = get_course_or_404(course_id)
        if course.created_by.id != request.user.id:
            return Response({"permission": "denied"}, status=status.HTTP_403_FORBIDDEN)

        audit_attrs = get_audit_attrs(request.user)


        try:
            start = course.courseconcept_set.get(concept=request.data['from'])
            end = course.courseconcept_set.get(concept=request.data['to'])
            dep = ConceptDependency.objects.create(course=course, start=start, end=end, **audit_attrs)

        except CourseConcept.DoesNotExist:
            return Response({"Concept does not exist"}, status.HTTP_400_BAD_REQUEST)

        except IntegrityError:
            return Response({"Dependency exists"}, status.HTTP_400_BAD_REQUEST)

        return Response({"id": dep.id}, status=status.HTTP_201_CREATED)


