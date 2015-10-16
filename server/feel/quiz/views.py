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
        quizzes = Quiz.objects.prefetch_related('shortanswer_set').prefetch_related('choice_set').filter(created_by=request.user)
        serializer = serializers.QuizSerializer(quizzes, many=True)
        return Response(serializer.data)


class QuizDetail(APIView):

    def get_object(self, pk):
        try:
            return Quiz.objects.get(pk=pk)
        except Quiz.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        quiz = self.get_object(pk)

        serializer = serializers.QuizSerializer(quiz)
        return Response(serializer.data)