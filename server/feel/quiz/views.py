import datetime

from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.db import transaction

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.views import get_user_and_user_key

from quiz.models import Quiz, ShortAnswer, Choice, QuizAttempt
from quiz import serializers





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
            quiz = Quiz.objects.get_latest_quiz_version(quiz_id=quiz_id)
        except (IndexError, ValueError):
            raise Http404


        serializer = serializers.QuizSerializer(quiz)
        data = serializer.data
        data['tags'] = [{"name": tag.name} for tag in quiz.tags.all()]
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
        4. Authorize request -> Ensure first version of quiz is created by same user
        5. Preprocess data
        6. Transaction
                7. Save Quiz
                8. Save Tags
                9. Save Choices
                10. Save Answers
        11. Return Response
        """
        found = True
        try:
            quiz_v1 = Quiz.objects.get(quiz_id=quiz_id, version=1)
        except Quiz.DoesNotExist:
            found = False

        if not found:
            return Response({"quiz_id_exists": True}, status=status.HTTP_400_BAD_REQUEST)

        elif quiz_v1.created_by.id != request.user.id:
            return Response({"nice_try": True}, status=status.HTTP_403_FORBIDDEN)


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
                if choice.get('id'):
                    del choice['id']

                choice_attrs = {"quiz": quiz}
                choice_attrs.update(choice)
                choice_attrs.update(audit_attrs)
                choice_instance = Choice.objects.create(**choice_attrs)
                choice['id'] = choice_instance.id

        return Response(data, status.HTTP_201_CREATED)
    


class QuizAttemptView(APIView):

    def post(self, request, quiz_id, version, format=None):
        user, user_key = get_user_and_user_key(request)
        data = request.data

        try:
            quiz = Quiz.objects.get(quiz_id=quiz_id, version=version)
        except Quiz.DoesNotExist:
            return({"quiz_does_not_exist": True}, status.HTTP_400_BAD_REQUEST)

        #Not using a serializer because POST and GET return different attributes
        #and using a serializer does not reduce the amount of code
        #And the only validation I need is checking if the quiz exists. 
        #Other fields can be blank. 
        attrs = {
            "quiz_id": quiz.id,
            "result": data['result'],
            "answer": data['answer'],
            "choices": ','.join((str(choice_id) for choice_id in data['choices'])),
            "attempt_number": data['attempt_number'],

            "user": user,
            "user_key": user_key,

            "created_at": datetime.datetime.utcnow()
        }
        QuizAttempt.objects.create(**attrs)
        return Response(request.data, status.HTTP_201_CREATED)

    def get(self, request, quiz_id, format=None):
        user, user_key = get_user_and_user_key(request)
        attempts = QuizAttempt.objects.get_user_attempts_by_quiz_id(user_key=user_key, quiz_id=quiz_id)
        serialized_attempts = []
        for a in attempts:
            serializer = serializers.QuizAttemptSerializer(a)
            serialized_attempts.append(serializer.data)

        return Response(serialized_attempts)
