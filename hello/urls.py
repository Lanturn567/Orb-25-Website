from django.urls import path

from timer.urls import app_name
from . import views

app_name = "hello"
urlpatterns = [
    path("", views.index, name="index"),
    path("download/<str:platform>/", views.download_file, name="download"),
]