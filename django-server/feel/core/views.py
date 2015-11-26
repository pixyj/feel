from django.shortcuts import render
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class UserDetail(APIView):

    def get(self, request, format=None):
        data = {}
        user = request.user
        if request.user.is_anonymous():
            data = {"is_anonymous": True}
        else:
            data = {"is_anonymous": False, "id": user.id}

        return Response(data)

  
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
