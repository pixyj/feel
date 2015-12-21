from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^api/v1/user/$', views.UserDetail.as_view()),
    url(r'^api/v1/user/logout/$', views.LogoutView.as_view()),
]