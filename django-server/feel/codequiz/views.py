from django.contrib.auth.decorators import login_required
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from core.views import get_user_and_user_key, get_audit_attrs

from .models import CodeQuiz, CodeQuizAttempt
from .serializers import CodeQuizSerializer


class CodeQuizListAndPostView(APIView):

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

    @method_decorator(login_required)
    def get(self, request):
        """
        Get all attempts by user
        """
        user, _ = get_user_and_user_key(request)
        codequizzes = CodeQuiz.objects.filter(created_by=user)

        # Um, django-rest-framework is unable to serialize for me.
        # todo -> debug later
        data = [
            {
                "problem_statement": cq.problem_statement,
                "id": str(cq.id),
                "created_at": cq.created_at
            }
            for cq in codequizzes
        ]
        return Response(data)


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


class CodeQuizAttemptView(APIView):

    def post(self, request, pk):
        codequiz = get_object_or_404(CodeQuiz, id=pk)
        user, user_key = get_user_and_user_key(request)
        code = request.data['code']
        attrs = {
            'code': code,
            'user': user,
            'user_key': user_key,
            'codequiz': codequiz
        }
        try:
            identical_attempt = CodeQuizAttempt.objects.filter(codequiz=codequiz, code=code, state=2).first()
            if identical_attempt is not None:
                if identical_attempt.user_key == user_key:
                    attempt = identical_attempt
                    outputs = attempt.outputs
                else:
                    attrs['result'] = identical_attempt.result
                    attrs['response'] = identical_attempt.response
                    attrs['state'] = 2
                    attempt = CodeQuizAttempt.objects.create(**attrs)

            else:
                attempt = CodeQuizAttempt.objects.create(**attrs)
                attempt.submit()
        except IntegrityError:
            attempt = identical_attempt

        json_response = {
            'result': attempt.result,
            'id': attempt.id,
            'outputs': attempt.outputs
        }
        return Response(json_response, status.HTTP_201_CREATED)
