from django.shortcuts import render

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


