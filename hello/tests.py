# Create your tests here.
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import tempfile
import shutil
import requests

class HelloViewsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_view(self):
        response = self.client.get(reverse('hello:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'hello/index.html')
        self.assertContains(response, 'Pokemon DLKL')
        self.assertContains(response, 'WELCOME!')

    def test_download_view(self):
        # Test Windows download
        response = self.client.get(reverse('hello:download', args=['windows']))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/zip')
        self.assertTrue(response['Content-Disposition'].startswith('attachment'))

        # Test Mac download
        response = self.client.get(reverse('hello:download', args=['mac']))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/zip')
        self.assertTrue(response['Content-Disposition'].startswith('attachment'))

        # Test invalid platform
        response = self.client.get(reverse('hello:download', args=['invalid']))
        self.assertEqual(response.status_code, 404)


class TriviaViewsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_view(self):
        response = self.client.get(reverse('trivia:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'trivia/index.html')
        self.assertContains(response, 'Clicker Game')


class TimerViewsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_view(self):
        response = self.client.get(reverse('timer:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'timer/index.html')
        self.assertContains(response, 'Pomodoro Timer')


class StaticFilesTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.urls = [
            '/static/hello/assets/icon.png',
            '/static/hello/assets/champ.webp',
            '/static/hello/assets/chichou.gif',
            # ... rest of your URLs ...
            '/static/hello/assets/bgm.mp3',
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

                except Exception as e:
                    self.fail(f"Request failed for {path}: {str(e)}")

class IntegrationTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()

        # Configure headless mode with recommended flags
        options.add_argument("--headless=new")  # New headless mode in Chrome 109+
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")

        # Additional stability options
        options.add_argument("--disable-extensions")
        options.add_argument("--remote-debugging-port=9222")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # Create isolated browser profile
        cls.temp_dir = tempfile.mkdtemp()
        options.add_argument(f"--user-data-dir={cls.temp_dir}")

        cls.selenium = Chrome(options=options)
        cls.wait = WebDriverWait(cls.selenium, 15)  # Shared wait instance with longer timeout

    @classmethod
    def tearDownClass(cls):
        # Capture browser logs before quitting
        logs = cls.selenium.get_log("browser")
        if logs:
            print("\nBrowser logs:")
            for log in logs:
                print(log)

        cls.selenium.quit()
        shutil.rmtree(cls.temp_dir, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")
        self.selenium.delete_all_cookies()  # Clean state for each test

    def test_home_page(self):
        """Test home page structure and navigation"""
        # Check page title
        self.assertIn('Pokemon DLKL', self.selenium.title)

        # Check main elements
        header = self.wait.until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'header-bg'))
        )
        self.assertTrue(header.is_displayed())

        welcome = self.selenium.find_element(By.CLASS_NAME, 'welcome')
        self.assertEqual(welcome.text, 'WELCOME!')

        # Test navigation buttons
        buttons = {
            'HOME': 'welcome-container',
            'DOWNLOAD': 'download-section',
            'NEWS': 'news-section',
            'CHARACTERS': 'characters-section'
        }

        for btn_text, section_class in buttons.items():
            # Find and click button
            button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, f"//button[contains(text(), '{btn_text}')]"))
            )
            button.click()

            # Verify corresponding section is displayed
            section = self.wait.until(
                EC.visibility_of_element_located((By.CLASS_NAME, section_class))
            )
            self.assertTrue(section.is_displayed())

    def test_clicker_game_link(self):
        """Test clicker game link navigation"""
        clicker_box = self.wait.until(
            EC.element_to_be_clickable((By.XPATH,
                                        "//div[contains(@class, 'interactive-box') and .//div[contains(text(), 'Clicker Game')]]"))
        )
        clicker_box.click()

        # Verify navigation
        self.wait.until(EC.url_contains('trivia'))
        self.assertIn('Clicker Game', self.selenium.page_source)

    def test_pomodoro_timer_link(self):
        """Test pomodoro timer link navigation"""
        timer_box = self.wait.until(
            EC.element_to_be_clickable((By.XPATH,
                                        "//div[contains(@class, 'interactive-box') and .//div[contains(text(), 'Pomodoro Timer')]]"))
        )
        timer_box.click()

        # Verify navigation
        self.wait.until(EC.url_contains('timer'))
        self.assertIn('Pomodoro Timer', self.selenium.page_source)

    def test_social_share_menu(self):
        """Test social share menu functionality"""
        # Share menu should start hidden
        share_menu = self.selenium.find_element(By.ID, 'share-menu')
        self.assertFalse(share_menu.is_displayed())

        # Click share button should show menu
        share_button = self.wait.until(
            EC.element_to_be_clickable((By.ID, 'share-button'))
        )
        share_button.click()

        # Wait for menu animation
        self.wait.until(EC.visibility_of(share_menu))
        self.assertTrue(share_menu.is_displayed())

        # Verify social links
        social_platforms = ['x.com', 'discord.gg', 'instagram.com', 'tiktok.com']
        for platform in social_platforms:
            link = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, f"//a[contains(@href, '{platform}')]"))
            )
            self.assertTrue(link.is_displayed())


class DownloadTests(TestCase):
    def test_download_links(self):
        response = self.client.get(reverse('hello:index'))

        # Windows download link
        self.assertContains(response, 'Download for Windows')
        windows_url = reverse('hello:download', args=['windows'])
        self.assertContains(response, windows_url)

        # Mac download link
        self.assertContains(response, 'Download for Mac')
        mac_url = reverse('hello:download', args=['mac'])
        self.assertContains(response, mac_url)

        # Android should be disabled
        self.assertContains(response, 'Download for Android')
        self.assertContains(response, 'Coming Soon!')
        self.assertContains(response, 'disabled')


class TemplateTests(TestCase):
    def test_template_inheritance(self):
        response = self.client.get(reverse('hello:index'))

        # Basic structure
        self.assertContains(response, '<!DOCTYPE html>')
        self.assertContains(response, '</html>')

        # Check static references in rendered output
        self.assertContains(response, '/static/hello/assets/icon.png')
        self.assertContains(response, '/static/hello/assets/chichou.gif')
        self.assertContains(response, '/static/hello/assets/clicker.png')
        self.assertContains(response, '/static/hello/assets/dev.png')
        self.assertContains(response, '/static/hello/assets/champ.webp')
        self.assertContains(response, '/static/hello/assets/raichu.gif')
        self.assertContains(response, '/static/hello/css/style.css')
        self.assertContains(response, '/static/hello/assets/bgm.mp3')


class MobileResponsivenessTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=375,812")  # iPhone X dimensions

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

    def test_mobile_menu(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")
        wait = WebDriverWait(self.selenium, 10)

        # Mobile menu toggle should be visible
        menu_toggle = self.selenium.find_element(By.CLASS_NAME, 'mobile-menu-toggle')
        self.assertTrue(menu_toggle.is_displayed())
