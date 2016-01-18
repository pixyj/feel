from django.conf.urls import url

from concept import views as views

urlpatterns = [
    url(r'^api/v1/creators/concepts/$', views.ConceptCreatorListView.as_view()),
    url(r'^api/v1/concepts/(?P<concept_id>[0-9a-f\-]+)/$', views.ConceptDetailView.as_view()),

    url(r'^api/v1/student/concepts/(?P<pk>[0-9a-f\-]+)/$', views.StudentConceptPageView.as_view()),
    url(r'^api/v1/student/concepts/(?P<pk>[0-9a-f\-]+)/quizattempts/$', views.StudentQuizAttemptView.as_view()),
    url(r'^api/v1/student/concepts/(?P<pk>[0-9a-f\-]+)/codequizattempts/$', views.StudentCodeQuizAttemptView.as_view()),
]
