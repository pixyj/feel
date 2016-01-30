from django.http import HttpResponse
from django.middleware import csrf
from django.shortcuts import render

from django.conf import settings

from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required

from django.utils.decorators import method_decorator
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class UserDetail(APIView):

    def get(self, request, format=None):
        algolia = {
            "API_KEY": settings.ALGOLIA['CLIENT_API_KEY'],
            "APP_ID": settings.ALGOLIA['APP_ID']
        }
        data = {"ALGOLIA": algolia}

        user = request.user
        if request.user.is_anonymous():
            data.update({"is_anonymous": True, "username": ""})
            csrftoken = csrf.get_token(request)
            session = request.session
            if session.session_key is None:
                session.create()
        else:
            data.update({
                "is_anonymous": False, 
                "id": user.id, 
                "username": user.username,
            })
        return Response(data)


class LogoutView(APIView):

    @method_decorator(login_required)
    def put(self, request):
        logout(request)
        return Response({"is_anonymous": True, "username": ""})



def get_user_and_user_key(request):
    if request.user.is_authenticated():
        return (request.user, str(request.user.id))
    
    session = request.session
    if session.session_key is None:
        session.create()

    return (None, session.session_key, )


def get_audit_attrs(created_by_user, last_modified_by_user=None, existing_attrs=None):

    now = timezone.now()
    if not last_modified_by_user:
        last_modified_by_user = created_by_user

    if not existing_attrs:
        existing_attrs = {'created_at': now, 'created_by': created_by_user}

    audit_attrs = existing_attrs

    last_modified_attrs = {"last_modified_by": last_modified_by_user, "last_modified_at": now}
    audit_attrs.update(last_modified_attrs)
    
    return audit_attrs
