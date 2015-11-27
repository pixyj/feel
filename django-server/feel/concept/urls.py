from django.conf.urls import url

from concept import views as views

urlpatterns = [

    url(r'^api/v1/concepts/$', views.ConceptDetailView.as_view()),
    url(r'^api/v1/concepts/(?P<concept_id>[0-9a-f\-]+)/$', views.ConceptDetailView.as_view()),
]
