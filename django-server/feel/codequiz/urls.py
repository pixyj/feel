from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^api/v1/codequizzes/$', views.CodeQuizPostView.as_view()),
    url(r'^api/v1/codequizzes/(?P<pk>[\w\-]+)/$', views.CodeQuizGetAndPutView.as_view()),
]
