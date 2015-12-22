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

from .models import CodeQuiz
from .serializers import CodeQuizSerializer

class CodeQuizPostView(APIView):

    @method_decorator(login_required)
    def post(self, request, format=None):
        """
        Get course by course_id
        """
        user, _ = get_user_and_user_key(request)
        serializer = CodeQuizSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        attrs = get_audit_attrs(request.user)
        attrs.update(serializer.data)
        attrs['test_cases'] = request.data['test_cases']
        codequiz = serializer.create(attrs)
        response_data = dict(serializer.data)
        response_data['id'] = codequiz.id
        return Response(response_data, status.HTTP_201_CREATED)



class CodeQuizGetAndPutView(APIView):

    def get(self, request, pk):
        codequiz = get_object_or_404(CodeQuiz, id=pk)
        serializer = CodeQuizSerializer(codequiz)
        response_data = dict(serializer.data)
        response_data['test_cases'] = codequiz.test_cases
        serializer.data['test_cases'] = codequiz.test_cases
        return Response(response_data)


    @method_decorator(login_required)
    def put(self, request, pk):
        codequiz = get_object_or_404(CodeQuiz, id=pk)
        
        user, _ = get_user_and_user_key(request)
        if user.id != codequiz.created_by.id:
            return Response({"nice": "try"}, status.HTTP_403_FORBIDDEN)

        serializer = CodeQuizSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        attrs = get_audit_attrs(request.user)
        attrs.update(serializer.data)
        attrs['test_cases'] = request.data['test_cases']

        serializer.update(codequiz, attrs)
        return Response(request.data)
