import uuid

from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.views import get_user_and_user_key

from concept.models import Concept, ConceptSection
from concept import serializers



class ConceptDetailView(APIView):
    """
    GET, POST and PUT APIs for individual concepts
    """

    def get(self, request, concept_id, format=None):
        """
        Get concept by concept_id
        """
        try:
            concept = Concept.objects.get(pk=concept_id)
        except (IndexError, ValueError):
            raise Http404

        serializer = serializers.ConceptSerializer(concept)
        data = serializer.data
        return Response(data)


    # def post(self, request, quiz_id, format=None):
    #     """
    #     Create new quiz
    #     Algo:
    #     1. If quiz exists raise 400
    #     2. Validate data
    #     3. If data is invalid raise 400
    #     4. Preprocess data
    #     5. Transaction
    #         1. Save Quiz
    #         2. Save Tags
    #         3. Save Choices
    #         4. Save Answers
    #     6. Return Response
    #     """
    #     return self._save_quiz_and_return_response(request, request.user, self._create_quiz_object)


    # def _create_quiz_object(self, quiz_attrs, data):
    #     """
    #     Used in _save_quiz_and_return_response during `POST` to create a `Quiz` instance. 
    #     """
    #     return Quiz.objects.create(**quiz_attrs)


    # def put(self, request, quiz_id, format=None):
    #     """
    #     ## Algo:

    #     1. If quiz does not exist raise `400`
    #     2. Validate data
    #     3. If data is invalid raise `400`
    #     4. Authorize request -> Ensure first version of quiz is created by same user
    #     5. Preprocess data
    #     6. Transaction:
    #         1. Save Quiz
    #         2. Save Tags
    #         3. Save Choices
    #         4. Save Answers
    #     7. Return Response
    #     """
    #     found = True
    #     try:
    #         quiz_v1 = Quiz.objects.get(pk=quiz_id)
    #     except Quiz.DoesNotExist:
    #         found = False

    #     if not found:
    #         return Response({"quiz_id_exists": True}, status=status.HTTP_400_BAD_REQUEST)

    #     #Authorization
    #     elif quiz_v1.created_by.id != request.user.id:
    #         return Response({"nice_try": True}, status=status.HTTP_403_FORBIDDEN)

    #     return self._save_quiz_and_return_response(request, quiz_v1.created_by, self._get_existing_quiz_object)


    # def _get_existing_quiz_object(self, quiz_attrs, data):
    #     """
    #     Used in _save_quiz_and_return_response during `PUT` to get a `Quiz` object.
    #     """
    #     quiz = Quiz(**quiz_attrs)
    #     quiz.save()
    #     return quiz
        

    # def _save_quiz_and_return_response(self, request, created_by, get_quiz_instance):
    #     """
    #     Workhorse private method that saves data from request (either `POST` or `PUT`) into the database and returns
    #     appopriate HttpResponse
    #     """
    #     data=request.data
    #     data["created_at"] = timezone.now()
    #     serializer = serializers.QuizSerializer(data=request.data)
    #     if not serializer.is_valid():
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #     quiz_fields = ['question_input', 'question_display', 'quiz_type', 'created_at']
    #     quiz_attrs = {}
    #     for field in quiz_fields:
    #         quiz_attrs[field] = data[field]
    #     quiz_attrs['uuid'] = uuid.UUID(data['uuid'])

    #     audit_attrs = {
    #         'created_at': data['created_at'],
    #         'last_modified_at': data['created_at'],
    #         'created_by': created_by,
    #         'last_modified_by': request.user
    #     }
    #     quiz_attrs.update(audit_attrs)
    #     tags = [tag['name'] for tag in data['tags']]
        
    #     #todo - Maybe create separate APIs for answers,choices and tags too?
    #     #import ipdb;ipdb.set_trace()
    #     with transaction.atomic():
    #         quiz = get_quiz_instance(quiz_attrs, data)
            
    #         quiz.shortanswer_set.all().delete()
    #         quiz.choice_set.all().delete()

    #         #import ipdb;ipdb.set_trace()
    #         quiz.tags.all().delete()

    #         quiz.tags.add(*tags)
            
    #         for answer in data['answers']:
    #             answer_attrs = {"quiz": quiz, "answer": answer['answer']}
    #             answer_attrs.update(audit_attrs)
    #             ShortAnswer.objects.create(**answer_attrs)

    #         for choice in data['choices']:
    #             if choice.get('id'):
    #                 del choice['id']

    #             choice_attrs = {"quiz": quiz}
    #             choice_attrs.update(choice)
    #             choice_attrs.update(audit_attrs)
    #             choice_instance = Choice.objects.create(**choice_attrs)
    #             choice['id'] = choice_instance.id

    #     return Response(data)

