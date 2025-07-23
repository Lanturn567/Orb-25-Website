from . import views
from django.urls import path

app_name = "timer"
urlpatterns = [
    path("", views.index, name="index"),
    path('spotify_auth/', views.spotify_auth, name='spotify_auth'),
    path('spotify_callback/', views.spotify_callback, name='spotify_callback'),
    path('refresh_token/', views.refresh_token, name='refresh_token'),
    path('check_spotify_tokens/', views.check_spotify_tokens, name='check_spotify_tokens'),
]