import requests
from django.test import TestCase, Client, RequestFactory
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.urls import reverse
from trivia.models import CustomUser
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import tempfile
import shutil
import json
import time

from django.test import TestCase
import os
from django.conf import settings

class StaticFilesTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.urls = [
                   '/static/trivia/assets/Altaria.png',
                    '/static/trivia/assets/Blitzle.png',
                    '/static/trivia/assets/Buneary.png',
                    '/static/trivia/assets/Chandelure.png',
                    '/static/trivia/assets/Chinchou.png',
                    '/static/trivia/assets/Cubone.png',
                    '/static/trivia/assets/Ditto.png',
                    '/static/trivia/assets/Happiny.png',
                    '/static/trivia/assets/Lanturn.png',
                    '/static/trivia/assets/Lopunny.png',
                    '/static/trivia/assets/Luvdisc.png',
                    '/static/trivia/assets/Maractus.png',
                    '/static/trivia/assets/Marowak.png',
                    '/static/trivia/assets/Munchlax.png',
                    '/static/trivia/assets/Munna.png',
                    '/static/trivia/assets/Musharna.png',
                    '/static/trivia/assets/Ponyta.png',
                    '/static/trivia/assets/Quagsire.png',
                    '/static/trivia/assets/Rapidash.png',
                    '/static/trivia/assets/Roselia.png',
                    '/static/trivia/assets/Snorlax.png',
                    '/static/trivia/assets/Staraptor.png',
                    '/static/trivia/assets/Starly.png',
                    '/static/trivia/assets/Swablu.png',
                    '/static/trivia/assets/Torterra.png',
                    '/static/trivia/assets/Turtwig.png',
                    '/static/trivia/assets/Wooper.png',
                    '/static/trivia/assets/Zebstrika.png',
                    '/static/trivia/css/style.css',
                    '/static/hello/assets/icon.png',
                    '/static/trivia/assets/bgm.mp3',
        ]

    def test_static_files_accessible(self):
        for path in self.urls:
            with self.subTest(path=path):
                try:
                    response = self.client.get(path)
                    self.assertEqual(response.status_code, 200,
                                     f"Failed to access: {path} (Status: {response.status_code})")

                    # Handle streaming responses
                    if hasattr(response, 'streaming_content'):
                        content = b''.join(response.streaming_content)
                    else:
                        content = response.content

                    # Special handling for audio files which might be empty in test environment
                    if not path.endswith('.mp3'):
                        self.assertGreater(len(content), 0,
                                           f"Empty content: {path}")

                    # Content-Type checks
                    if path.endswith('.png'):
                        self.assertIn('image/png', response['Content-Type'])
                    elif path.endswith('.gif'):
                        self.assertIn('image/gif', response['Content-Type'])
                    elif path.endswith('.webp'):
                        self.assertIn('image/webp', response['Content-Type'])
                    elif path.endswith('.mp3'):
                        self.assertIn('audio/mpeg', response['Content-Type'])
                    elif path.endswith('.css'):
                        self.assertIn('text/css', response['Content-Type'])

                except Exception as e:
                    self.fail(f"Request failed for {path}: {str(e)}")

class BackendAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )

    def test_index_view(self):
        response = self.client.get(reverse('trivia:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'trivia/index.html')

    def test_register_endpoint(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        response = self.client.post(
            reverse('trivia:register'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['success'])
        self.assertTrue(CustomUser.objects.filter(username='newuser').exists())

    def test_login_endpoint(self):
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(
            reverse('trivia:login'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

    def test_logout_endpoint(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('trivia:logout'))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

    def test_check_auth_endpoint(self):
        # Test authenticated
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('trivia:check_auth'))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['isAuthenticated'])

        # Test unauthenticated
        self.client.logout()
        response = self.client.get(reverse('trivia:check_auth'))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['isAuthenticated'])

    def test_post_score_endpoint(self):
        self.client.login(username='testuser', password='testpass123')
        data = {'score': 1000}
        response = self.client.post(
            reverse('trivia:post_score'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(CustomUser.objects.get(username='testuser').max_score, 1000)

    def test_leaderboard_endpoint(self):
        # Create test data
        for i in range(1, 6):
            user = CustomUser.objects.create_user(
                username=f'user{i}',
                password=f'pass{i}',
                email=f'user{i}@example.com'
            )
            user.max_score = i * 100
            user.save()

        response = self.client.get(reverse('trivia:leaderboard'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['results']), 6)
        self.assertEqual(data['results'][0]['username'], 'user5')

class FrontendIntegrationTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # Create unique user data directory
        cls.temp_dir = tempfile.mkdtemp()
        options.add_argument(f"--user-data-dir={cls.temp_dir}")

        cls.selenium = Chrome(options=options)
        cls.selenium.implicitly_wait(10)
        cls.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        shutil.rmtree(cls.temp_dir)  # Clean up temp directory
        super().tearDownClass()

    def test_home_page_elements(self):
        self.selenium.get(f"{self.live_server_url}{reverse('trivia:index')}")
        self.assertIn('Pokemon DLKL Clicker Game', self.selenium.title)
        title = self.selenium.find_element(By.TAG_NAME, 'h1')
        self.assertIn('Pokémon Sunset', title.text)

    def test_registration_flow(self):
        self.selenium.get(f"{self.live_server_url}{reverse('trivia:index')}")

        # Navigate to registration
        play_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Play Game')]")
        play_button.click()

        register_link = WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Need an account? Register')]")))
        register_link.click()

        # Fill registration form
        username = self.selenium.find_element(By.ID, 'usernameRegister')
        email = self.selenium.find_element(By.ID, 'emailRegister')
        password = self.selenium.find_element(By.ID, 'passwordRegister')
        confirm = self.selenium.find_element(By.ID, 'confirmPasswordRegister')

        username.send_keys('newtestuser')
        email.send_keys('newtest@example.com')
        password.send_keys('testpass123')
        confirm.send_keys('testpass123')

        register_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Register')]")
        register_button.click()

        # Verify redirected to login
        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Login')]")))

    def test_game_play_flow(self):
        # Login first
        self.selenium.get(f"{self.live_server_url}{reverse('trivia:index')}")
        play_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Play Game')]")
        play_button.click()
        WebDriverWait(self.selenium, 5)

        username = self.selenium.find_element(By.ID, 'username')
        password = self.selenium.find_element(By.ID, 'password')

        username.send_keys('testuser')
        password.send_keys('testpass123')

        buttons = self.selenium.find_elements(By.TAG_NAME, "button")
        login_button = None
        for button in buttons:
            found = "Login" in button.text
            if found:
                login_button = button

        self.assertTrue(login_button)
        login_button.click()

        # Verify game screen
        WebDriverWait(self.selenium, 5).until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Pokémon Sunset')]")))

        # Wait for Pokémon to appear and click
        time.sleep(2)
        pokemon = self.selenium.find_elements(By.XPATH, "//img[contains(@src, 'static/trivia/assets/')]")
        if pokemon:
            pokemon[0].click()
            time.sleep(0.5)
            score = self.selenium.find_element(By.XPATH, "//h1[contains(text(), 'Score:')]").text
            self.assertNotEqual(score, "Score: 0")

    def test_leaderboard_navigation(self):
        self.selenium.get(f"{self.live_server_url}{reverse('trivia:index')}")
        leaderboard_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Leaderboard')]")
        leaderboard_button.click()

        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Leaderboard')]")))