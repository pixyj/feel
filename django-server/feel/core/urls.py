from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^api/v1/user/$', views.UserDetail.as_view()),
]