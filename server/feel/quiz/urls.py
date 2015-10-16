from django.conf.urls import url

from quiz import views as views

urlpatterns = [
    url(r'^api/v1/quiz/(?P<pk>[0-9]+)/$', views.QuizDetail.as_view()),
    url(r'^api/v1/quizzes/$', views.QuizList.as_view())
]
