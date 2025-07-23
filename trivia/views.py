from django.core.paginator import Paginator
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.auth.password_validation import validate_password
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from .models import CustomUser
from django.middleware.csrf import get_token

def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

@csrf_exempt
@login_required
def post_score(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            score = int(data.get('score', 0))

            # Get the user (CustomUser instance)
            user = request.user

            # Check if this is a new high score
            is_new_record = False
            if score > user.max_score:
                user.max_score = score
                user.save()
                is_new_record = True

            return JsonResponse({
                'success': True,
                'new_max_score': user.max_score,
                'is_new_record': is_new_record,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'max_score': user.max_score,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                }
            })

        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    }, status=405)

def leaderboard(request):
    if request.method == 'GET':
        try:
            # Get page number from query parameters, default to 1
            page_number = int(request.GET.get('page', 1))
            entries_per_page = 8  # Number of entries per page

            # Get all users ordered by max_score
            all_users = CustomUser.objects.order_by('-max_score')

            # Create paginator
            paginator = Paginator(all_users, entries_per_page)
            page_obj = paginator.get_page(page_number)

            # Prepare leaderboard data
            leaderboard_data = {
                'count': paginator.count,
                'next': page_obj.next_page_number() if page_obj.has_next() else None,
                'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
                'results': [
                    {
                        'rank': (page_obj.number - 1) * entries_per_page + idx + 1,
                        'username': user.username,
                        'score': user.max_score,
                    }
                    for idx, user in enumerate(page_obj.object_list)
                ]
            }

            return JsonResponse(leaderboard_data, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Validate input
            if not data.get('username') or not data.get('email') or not data.get('password'):
                return JsonResponse({'error': 'All fields are required'}, status=400)

            try:
                validate_email(data['email'])
            except ValidationError:
                return JsonResponse({'error': 'Invalid email format'}, status=400)

            try:
                validate_password(data['password'])
            except ValidationError as e:
                return JsonResponse({'error': ', '.join(e.messages)}, status=400)

            if data['password'] != data.get('confirm_password', ''):
                return JsonResponse({'error': 'Passwords do not match'}, status=400)

            if CustomUser.objects.filter(username=data['username']).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)
            if CustomUser.objects.filter(email=data['email']).exists():
                return JsonResponse({'error': 'Email already exists'}, status=400)

            # Create user
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )

            # Log the user in immediately after registration
            login(request, user)

            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'max_score': user.max_score
                }
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            if not data.get('username') or not data.get('password'):
                return JsonResponse({'error': 'Username and password are required'}, status=400)

            user = authenticate(request, username=data['username'], password=data['password'])

            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'max_score': user.max_score
                    }
                })
            else:
                if CustomUser.objects.filter(username=data['username']).exists():
                    return JsonResponse({'error': 'Incorrect password'}, status=401)
                return JsonResponse({'error': 'User not found'}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def logout_user(request):
    if request.method == 'POST':
        try:
            logout(request)
            return JsonResponse({'success': True, 'message': 'Logged out successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

def check_auth(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'isAuthenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'max_score': request.user.max_score
            }
        })
    return JsonResponse({'isAuthenticated': False})


def index(request):
    return render(request, "trivia/index.html")