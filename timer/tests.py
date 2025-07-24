# Create your tests here.
from django.test import TestCase, Client, RequestFactory
from django.urls import reverse
from django.contrib.sessions.middleware import SessionMiddleware
from timer import views
from urllib.parse import urlencode
from unittest.mock import patch, MagicMock
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import tempfile
import shutil
import time
import requests
import json

class TimerViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()

    def test_index_view(self):
        response = self.client.get(reverse('timer:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'timer/index.html')
        self.assertContains(response, 'Pokemon DLKL Pomodoro Timer!')

    @patch('timer.views.secrets.token_urlsafe')
    @patch('timer.views.generate_code_challenge')
    def test_spotify_auth(self, mock_generate_challenge, mock_token_urlsafe):
        mock_token_urlsafe.return_value = 'test_verifier'
        mock_generate_challenge.return_value = 'test_challenge'

        response = self.client.get(reverse('timer:spotify_auth'))
        data = json.loads(response.content)

        self.assertIn('auth_url', data)
        self.assertIn('code_challenge=test_challenge', data['auth_url'])

        session = self.client.session
        self.assertEqual(session['spotify_code_verifier'], 'test_verifier')

    @patch('timer.views.requests.post')
    def test_spotify_callback_success(self, mock_post):
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'test_access',
            'refresh_token': 'test_refresh',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        # Create request with session and code verifier
        request = self.factory.get(reverse('timer:spotify_callback') + '?code=test_code')
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session['spotify_code_verifier'] = 'test_verifier'
        request.session.save()

        # Call view
        response = views.spotify_callback(request)

        # Verify results
        self.assertEqual(response.status_code, 302)  # Should redirect
        self.assertEqual(request.session['spotify_access_token'], 'test_access')
        self.assertEqual(request.session['spotify_refresh_token'], 'test_refresh')
        self.assertAlmostEqual(request.session['spotify_expires_at'], time.time() + 3600, delta=5)

    def test_spotify_callback_error(self):
        # Test with error parameter
        request = self.factory.get(reverse('timer:spotify_callback') + '?error=test_error')
        response = views.spotify_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('spotify_error=test_error', response.url)

    @patch('timer.views.requests.post')
    def test_refresh_token_success(self, mock_post):
        # Mock Spotify response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_access_token",
            "token_type": "Bearer",
            "scope": "user-read-private user-read-email",
            "expires_in": 3600,
            "refresh_token": "new_refresh_token"
        }
        mock_post.return_value = mock_response

        data = {
            "grant_type": "refresh_token",
            "refresh_token": "new_refresh_token",
            "client_id": "b6fe7a331be848d38f7381b58552ad54"
        }

        encoded_data = urlencode(data)

        response = self.client.post(
            reverse('timer:refresh_token'),
            data=encoded_data,
            content_type='application/x-www-form-urlencoded'
        )

        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertIn('access_token', data)
        self.assertIn('expires_in', data)
        self.assertEqual(data['access_token'], 'new_access_token')
        self.assertEqual(data['expires_in'], 3600)

        # Check the forwarded data to Spotify includes client_secret
        mock_post.assert_called_once_with(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': 'new_refresh_token',
                'client_id': 'b6fe7a331be848d38f7381b58552ad54',
                'client_secret': 'f4135c009e904493adbcca18ce41ddec'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

    def test_refresh_token_missing_token(self):
        response = self.client.post(reverse('timer:refresh_token'))
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertEqual(data['error'], 'Refresh token required')

    def test_check_spotify_tokens_with_tokens(self):
        # Create request with session tokens
        request = self.factory.get(reverse('timer:check_spotify_tokens'))
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session['spotify_access_token'] = 'test_access'
        request.session['spotify_expires_at'] = time.time() + 3600
        request.session.save()

        # Call view
        response = views.check_spotify_tokens(request)
        data = json.loads(response.content)

        # Verify results
        self.assertEqual(data['access_token'], 'test_access')
        self.assertAlmostEqual(data['expires_at'], time.time() + 3600, delta=5)

    def test_check_spotify_tokens_no_tokens(self):
        response = self.client.get(reverse('timer:check_spotify_tokens'))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data, {})

class TimerIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_page_elements(self):
        response = self.client.get(reverse('timer:index'))
        self.assertContains(response, 'Pomodoro Timer')
        self.assertContains(response, 'Start')
        self.assertContains(response, 'Pause')
        self.assertContains(response, 'Reset')
        self.assertContains(response, 'What are you working on?')

    def test_spotify_modal_interaction(self):
        # First load the page
        response = self.client.get(reverse('timer:index'))

        # Check modal is initially hidden
        self.assertContains(response, 'modal-content')  # Modal should be in HTML but hidden

        # This is just checking the modal HTML exists
        self.assertContains(response, 'Connect Spotify')

    @patch('timer.views.requests.post')
    def test_full_spotify_flow(self, mock_post):
        # Step 1: Mock the auth URL generation
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.json.return_value = {
            'auth_url': 'https://spotify.com/authorize?client_id=xyz'
        }
        mock_post.return_value = mock_auth_response

        auth_response = self.client.get(reverse('timer:spotify_auth'))
        self.assertEqual(auth_response.status_code, 200)

        auth_data = json.loads(auth_response.content)
        self.assertIn('spotify.com', auth_data['auth_url'])

        # Step 2: Simulate the callback with mocked token response
        with patch('timer.views.requests.post') as mock_token_post:
            mock_token_response = MagicMock()
            mock_token_response.status_code = 200
            mock_token_response.json.return_value = {
                'access_token': 'test_access',
                'refresh_token': 'test_refresh',
                'expires_in': 3600
            }
            mock_token_post.return_value = mock_token_response

            session = self.client.session
            session['spotify_code_verifier'] = 'test_verifier'
            session.save()

            callback_response = self.client.get(
                reverse('timer:spotify_callback') + '?code=test_code',
                follow=True
            )
            self.assertEqual(callback_response.status_code, 200)

            # Check tokens stored in session
            session = self.client.session
            self.assertEqual(session['spotify_access_token'], 'test_access')
            self.assertEqual(session['spotify_refresh_token'], 'test_refresh')
            self.assertAlmostEqual(
                session['spotify_expires_at'], time.time() + 3600, delta=5
            )

        # Step 3: Check current token
        check_response = self.client.get(reverse('timer:check_spotify_tokens'))
        self.assertEqual(check_response.status_code, 200)

        check_data = json.loads(check_response.content)
        self.assertEqual(check_data['access_token'], 'test_access')

        # Step 4: Simulate token expiry and refresh
        session = self.client.session
        session['spotify_expires_at'] = time.time() - 10  # Expired token
        session.save()

        with patch('timer.views.requests.post') as mock_refresh_post:
            mock_refresh_response = MagicMock()
            mock_refresh_response.status_code = 200
            mock_refresh_response.json.return_value = {
                'access_token': 'test_access',
                'expires_in': 3600
            }
            mock_refresh_post.return_value = mock_refresh_response

            data = {
                "grant_type": "refresh_token",
                "refresh_token": "test_refresh",
                "client_id": "b6fe7a331be848d38f7381b58552ad54"
            }

            encoded_data = urlencode(data)

            refresh_response = self.client.post(
                reverse('timer:refresh_token'),
                data=encoded_data,
                content_type='application/x-www-form-urlencoded'
            )

            self.assertEqual(refresh_response.status_code, 200)

            refresh_data = json.loads(refresh_response.content)
            self.assertEqual(refresh_data['access_token'], 'test_access')

            # Ensure session is updated with new access token
            session = self.client.session
            self.assertEqual(session['spotify_access_token'], 'test_access')

class TimerFunctionalityTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_pomodoro_timer_buttons(self):
        response = self.client.get(reverse('timer:index'))

        # Check all buttons exist
        self.assertContains(response, 'id="start-btn"')
        self.assertContains(response, 'id="pause-btn"')
        self.assertContains(response, 'id="reset-btn"')

        # Check preset buttons
        self.assertContains(response, 'data-mode="pomodoro"')
        self.assertContains(response, 'data-mode="short-break"')
        self.assertContains(response, 'data-mode="long-break"')

    def test_task_management(self):
        response = self.client.get(reverse('timer:index'))

        # Check task input exists
        self.assertContains(response, 'id="task-input"')
        self.assertContains(response, 'id="add-task-btn"')

    def test_custom_time_setting(self):
        response = self.client.get(reverse('timer:index'))

        # Check custom time input exists
        self.assertContains(response, 'id="custom-minutes"')
        self.assertContains(response, 'id="set-custom-btn"')

class StaticFilesTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        cls.temp_dir = tempfile.mkdtemp()
        options.add_argument(f"--user-data-dir={cls.temp_dir}")

        cls.selenium = Chrome(options=options)
        cls.selenium.implicitly_wait(5)

        cls.static_urls = [
            '/static/timer/assets/bg.gif',
            '/static/timer/assets/bgm.mp3',
            '/static/timer/assets/Buneary.png',
            '/static/timer/assets/Chandelure.png',
            '/static/timer/assets/Ditto.png',
            '/static/timer/assets/Lanturn.png',
            '/static/timer/assets/logo.gif',
            '/static/timer/assets/Luvdisc.png',
            '/static/timer/assets/Maractus.png',
            '/static/timer/assets/music-note.png',
            '/static/timer/assets/notification.mp3',
            '/static/timer/assets/Rapidash.png',
            '/static/timer/assets/Snorlax.png',
        ]

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        shutil.rmtree(cls.temp_dir, ignore_errors=True)
        super().tearDownClass()

    def test_static_files_load_in_browser(self):
        for path in self.static_urls:
            url = self.live_server_url + path
            self.selenium.get(url)
            # Wait until page title is set or screenshot is taken
            self.assertIn("text/html", self.selenium.page_source or "fallback")
            status_code = self.selenium.execute_script(
                "return document.readyState"
            )
            self.assertEqual(status_code, "complete", f"Failed to load: {url}")


class PomodoroTimerTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # Create unique user data directory
        cls.temp_dir = tempfile.mkdtemp()
        options.add_argument(f"--user-data-dir={cls.temp_dir}")

        cls.selenium = Chrome(options=options)
        cls.selenium.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        shutil.rmtree(cls.temp_dir)  # Clean up temp directory
        super().tearDownClass()

    def test_page_elements(self):
        self.selenium.get(f"{self.live_server_url}{reverse('timer:index')}")
        wait = WebDriverWait(self.selenium, 10)

        # Check page title
        self.assertIn('Pokemon DLKL Pomodoro Timer', self.selenium.title)

        # Check header elements
        header_images = self.selenium.find_elements(By.CLASS_NAME, 'header-image')
        self.assertGreaterEqual(len(header_images), 1)  # At least one image

        # Check timer controls
        timer_mode = self.selenium.find_element(By.ID, 'timer-mode')
        self.assertEqual(timer_mode.text, 'Pomodoro')

        clock = self.selenium.find_element(By.ID, 'clock')
        self.assertEqual(clock.text, '25:00')

    def test_timer_functionality(self):
        self.selenium.get(f"{self.live_server_url}{reverse('timer:index')}")

        # Start the timer
        start_btn = self.selenium.find_element(By.ID, 'start-btn')
        start_btn.click()

        # Check that pause button is enabled
        pause_btn = self.selenium.find_element(By.ID, 'pause-btn')
        self.assertFalse(pause_btn.get_attribute('disabled'))

    def test_spotify_integration(self):
        self.selenium.get(f"{self.live_server_url}{reverse('timer:index')}")
        wait = WebDriverWait(self.selenium, 10)

        spotify_button = wait.until(EC.element_to_be_clickable((By.ID, "spotify-button")))
        spotify_button.click()

        # Check modal content
        modal = self.selenium.find_element(By.ID, 'spotify-modal')
        wait.until(EC.visibility_of(modal))
        self.assertTrue(modal.is_displayed())

        # Close modal
        close_btn = modal.find_element(By.CLASS_NAME, 'close')
        close_btn.click()

        # Check modal is hidden
        wait.until(EC.invisibility_of_element(modal))
        self.assertFalse(modal.is_displayed())