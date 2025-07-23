from django.urls import path
from . import views

app_name = "trivia"
urlpatterns = [
    path('', views.index, name='index'),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/logout/', views.logout_user, name='logout'),
    path('api/check_auth/', views.check_auth, name='check_auth'),
    path('api/post_score/', views.post_score, name='post_score'),
    path('api/leaderboard/', views.leaderboard, name='leaderboard'),
]