from django.conf.urls import url

from course import views as views

urlpatterns = [
    url(r'^api/v1/courses/$', views.CourseDetailView.as_view()),
    url(r'^api/v1/courses/(?P<pk>[0-9a-f\-]+)/$', views.CourseDetailView.as_view()),
    url(r'^api/v1/courses/(?P<pk>[0-9a-f\-]+)/concepts/$', views.ConceptListView.as_view()),
    url(r'^api/v1/courses/(?P<pk>[0-9a-f\-]+)/dependencies/$', views.DependencyListView.as_view()),
]
