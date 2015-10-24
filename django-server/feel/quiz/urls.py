from django.conf.urls import url

from quiz import views as views

urlpatterns = [
    url(r'^api/v1/quiz/$', views.QuizPostView.as_view()),
    url(r'^api/v1/quiz/(?P<quiz_id>[0-9]+)/$', views.QuizGetAndPutView.as_view()),
    url(r'^api/v1/quizzes/$', views.QuizList.as_view()),
    url(r'^api/v1/quizattempt/quiz_id/(?P<quiz_id>[a-f0-9\-]+)/version/(?P<version>[0-9]+)/$', views.QuizAttemptView.as_view()),
]
