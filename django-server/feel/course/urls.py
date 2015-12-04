from django.conf.urls import url

from course import views as views

urlpatterns = [
    url(r'^api/v1/courses/$', views.CourseDetailView.as_view()),
    url(r'^api/v1/courses/(?P<pk>[\w\-]+)/$', views.CourseDetailView.as_view()),
    url(r'^api/v1/courses/(?P<course_id>[\w\-]+)/concepts/$', views.ConceptView.as_view()),
    url(r'^api/v1/courses/(?P<course_id>[\w\-]+)/dependencies/$', views.DependencyView.as_view()),


    url(r'^api/v1/courses/(?P<course_slug>[\w\-]+)/concepts/(?P<concept_slug>[\w\-]+)/$',\
        views.StudentConceptView.as_view()),
]
