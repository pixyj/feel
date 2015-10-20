import datetime

from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.decorators import login_required

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from quiz.models import Quiz, ShortAnswer, Choice
from quiz import serializers

from django.db import transaction



class QuizList(APIView):
    """
    Collection API. Only GET method defined here
    """

    permission_classes = (IsAuthenticated, )


    def get(self, request, format=None):
        """
        List latest version of all quizzes
        """
        quizzes = Quiz.objects.prefetch_related('shortanswer_set').\
                               prefetch_related('choice_set').\
                               filter(created_by=request.user).\
                               order_by("-created_at")

        highest_versions = {}
        for quiz in quizzes:
            if quiz.quiz_id in highest_versions:
                existing_quiz = highest_versions[quiz.quiz_id]
                if existing_quiz.version > quiz.version:
                    continue
                
            highest_versions[quiz.quiz_id] = quiz

        quizzes = highest_versions.values()
            
        serializer = serializers.QuizSerializer(quizzes, many=True)
        return Response(serializer.data)



    

class QuizDetail(APIView):
    """
    Detail API. 
    """

    def get(self, request, quiz_id, format=None):
        """
        Get Latest Version of individual quiz by quiz_id
        """
        try:
            quiz = Quiz.objects.filter(quiz_id=quiz_id).\
                                order_by("-version").\
                                prefetch_related('shortanswer_set').\
                                prefetch_related('choice_set')[0]
        except (IndexError, ValueError):
            raise Http404


        serializer = serializers.QuizSerializer(quiz)
        data = serializer.data
        data['tags'] = [tag.name for tag in quiz.tags.all()]
        return Response(data)


    def post(self, request, quiz_id, format=None):
        """
        Create *first* version of new quiz
        Algo:
        1. If quiz exists raise 400
        2. Validate data
        3. If data is invalid raise 400
        4. Preprocess data
        5. Transaction
                6. Save Quiz
                7. Save Tags
                8. Save Choices
                9. Save Answers
        10. Return Response
        """
        found = True
        try:
            quiz = Quiz.objects.get(quiz_id=quiz_id)
        except Quiz.DoesNotExist:
            found = False

        if found:
            return Response({"quiz_id_exists": True}, status=status.HTTP_400_BAD_REQUEST)

        return self._save_quiz_and_return_response(request, request.user)


    def put(self, request, quiz_id, format=None):
        """
        Create new versions of existing quiz. We store the version in the database so that the client
        can make concurrent http requests without worrying whether the request to save version `n` is processed
        by the server after the request to save version `n+1`. So irrespective of the order in which the different
        versions are processed, by the server, the highest version will be used in the GET APIs. 
        We may have to run a periodic job to compact this table, if the table grows too large. 

        Algo:
        1. If quiz does not exist raise 400
        2. Validate data
        3. If data is invalid raise 400
        4. Preprocess data
        5. Transaction
                6. Save Quiz
                7. Save Tags
                8. Save Choices
                9. Save Answers
        10. Return Response
        """
        found = True
        try:
            quiz_v1 = Quiz.objects.get(quiz_id=quiz_id, version=1)
        except Quiz.DoesNotExist:
            found = False

        if not found:
            return Response({"quiz_id_exists": True}, status=status.HTTP_400_BAD_REQUEST)


        return self._save_quiz_and_return_response(request, quiz_v1.created_by)


    def _save_quiz_and_return_response(self, request, created_by):
        data=request.data
        data["created_at"] = datetime.datetime.utcnow()
        serializer = serializers.QuizSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


        quiz_fields = ['quiz_id', 'version', 'question_input', 'question_display', 'quiz_type', 'created_at']
        quiz_attrs = {}
        for field in quiz_fields:
            quiz_attrs[field] = data[field]

        audit_attrs = {
            'created_at': data['created_at'],
            'last_modified_at': data['created_at'],
            'created_by': created_by,
            'last_modified_by': request.user
        }
        quiz_attrs.update(audit_attrs)
        tags = [tag['name'] for tag in data['tags']]
        
        with transaction.atomic():
            quiz = Quiz.objects.create(**quiz_attrs)
            
            quiz.tags.add(*tags)
            for answer in data['answers']:
                answer_attrs = {"quiz": quiz, "answer": answer['answer']}
                answer_attrs.update(audit_attrs)
                ShortAnswer.objects.create(**answer_attrs)

            for choice in data['choices']:
                choice_attrs = {"quiz": quiz}
                choice_attrs.update(choice)
                choice_attrs.update(audit_attrs)
                Choice.objects.create(**choice_attrs)

        return Response(data)
    