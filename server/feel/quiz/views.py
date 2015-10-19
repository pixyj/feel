from django.shortcuts import render
from django.http import Http404
from django.contrib.auth.decorators import login_required

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


from quiz.models import Quiz
from quiz import serializers


class QuizList(APIView):
    """
    List all quizzes
    """

    permission_classes = (IsAuthenticated, )


    def get(self, request, format=None):
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


    def get(self, request, quiz_id, format=None):
        try:
            quiz = Quiz.objects.filter(quiz_id=quiz_id).\
                                order_by("-version").\
                                prefetch_related('shortanswer_set').\
                                prefetch_related('choice_set')[0]
        except (IndexError, ValueError):
            raise Http404



        serializer = serializers.QuizSerializer(quiz)
        return Response(serializer.data)

    