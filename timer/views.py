import time
from django.shortcuts import render, redirect
from django.http import JsonResponse, QueryDict
import requests
import base64
import hashlib
import secrets
from django.views.decorators.csrf import csrf_exempt

SPOTIFY_CLIENT_ID = 'b6fe7a331be848d38f7381b58552ad54'
SPOTIFY_CLIENT_SECRET = 'f4135c009e904493adbcca18ce41ddec'
SPOTIFY_REDIRECT_URI = 'https://orb-25-website.onrender.com/timer/spotify_callback'


# Create your views here.

def index(request):
    return render(request, "timer/index.html",)

def generate_code_challenge(code_verifier):
    digest = hashlib.sha256(code_verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).decode().replace('=', '')

@csrf_exempt
def spotify_auth(request):
    try:
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = generate_code_challenge(code_verifier)

        request.session['spotify_code_verifier'] = code_verifier

        scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state'

        auth_url = (
                'https://accounts.spotify.com/authorize?' +
                'response_type=code' +
                f'&client_id={SPOTIFY_CLIENT_ID}' +
                f'&redirect_uri={SPOTIFY_REDIRECT_URI}' +
                f'&scope={scope.replace(" ", "%20")}' +
                '&code_challenge_method=S256' +
                f'&code_challenge={code_challenge}'
        )

        return JsonResponse({'auth_url': auth_url})

    except Exception as e:
                return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def spotify_callback(request):
    """Handle Spotify callback and redirect to main page with tokens"""
    try:

        # Check for errors first
        if 'error' in request.GET:
            error = request.GET['error']
            return redirect('/timer/?spotify_error=' + error)

        # Verify we have the authorization code
        if 'code' not in request.GET:
            return redirect('/timer/?spotify_error=no_code')

        code = request.GET['code']
        code_verifier = request.session.get('spotify_code_verifier')

        if not code_verifier:
            return redirect('/timer/?spotify_error=session_expired')

        # Exchange code for tokens
        token_url = 'https://accounts.spotify.com/api/token'
        payload = {
            'client_id': SPOTIFY_CLIENT_ID,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': SPOTIFY_REDIRECT_URI,
            'code_verifier': code_verifier,
        }

        response = requests.post(token_url, data=payload)
        token_data = response.json()

        if response.status_code != 200:
            return redirect(f'/timer/?spotify_error={token_data.get("error", "token_exchange_failed")}')

        # Store tokens in session temporarily
        request.session['spotify_access_token'] = token_data['access_token']
        if 'refresh_token' in token_data:
            request.session['spotify_refresh_token'] = token_data['refresh_token']
        request.session['spotify_expires_at'] = time.time() + token_data['expires_in']

        # Redirect to main page
        return redirect('/timer')

    except Exception as e:
        return redirect(f'/timer/?spotify_error={str(e)}')

@csrf_exempt
def refresh_token(request):
    """Refresh expired access token"""
    try:
        if request.method != 'POST':
            return JsonResponse({'error': 'Method not allowed'}, status=405)

        refresh_token = request.POST.dict().get('refresh_token')
        data = request.POST.dict()
        data['client_secret'] = SPOTIFY_CLIENT_SECRET

        if not refresh_token:
            return JsonResponse({'error': 'Refresh token required'}, status=400)

        token_url = 'https://accounts.spotify.com/api/token'
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        response = requests.post(token_url, data=data, headers=headers)
        token_data = response.json()

        request.session['spotify_access_token'] = token_data['access_token']
        if 'refresh_token' in token_data:
            request.session['spotify_refresh_token'] = token_data['refresh_token']
        request.session['spotify_expires_at'] = time.time() + token_data['expires_in']

        return JsonResponse({
            'access_token': token_data['access_token'],
            'expires_in': token_data['expires_in'],
            'refresh_token': refresh_token,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def check_spotify_tokens(request):
    """More reliable token checking"""
    response_data = {}
    try:
        # Check session for tokens
        if 'spotify_access_token' in request.session:
            response_data = {
                'access_token': request.session.get('spotify_access_token'),
                'expires_at': request.session.get('spotify_expires_at', time.time() + 3600)
            }
            # Only pass refresh token if exists and is new
            if 'spotify_refresh_token' in request.session:
                response_data['refresh_token'] = request.session.get('spotify_refresh_token')

        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
