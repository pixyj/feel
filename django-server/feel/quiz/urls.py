from django.conf.urls import url

from quiz import views as views

urlpatterns = [
    url(r'^api/v1/quizzes/(?P<quiz_id>[0-9a-f\-]+)/$', views.QuizDetailView.as_view()),
    url(r'^api/v1/quizzes/$', views.QuizListAndPostView.as_view()),
    url(r'^api/v1/quizzes/(?P<quiz_id>[a-f0-9\-]+)/attempts/$', views.QuizAttemptView.as_view()),
]
