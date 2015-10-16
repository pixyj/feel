from django.shortcuts import render
from django.http import Http404

from rest_framework.views  import APIView
from rest_framework.response import Response
from rest_framework import status

from quiz.models import Quiz
from quiz import serializers


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