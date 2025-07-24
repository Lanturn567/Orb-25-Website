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

'''
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
'''


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


class StaticFilesTests(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.urls = [
            '/static/hello/assets/icon.png',
            '/static/hello/assets/champ.webp',
            '/static/hello/assets/chichou.gif',
            '/static/hello/assets/clicker.png',
            '/static/hello/assets/cloud.png',
            '/static/hello/assets/dev.png',
            '/static/hello/assets/fanart.png',
            '/static/hello/assets/furina.png',
            '/static/hello/assets/gardevoir.gif',
            '/static/hello/assets/icon.png',
            '/static/hello/assets/lanturn.gif',
            '/static/hello/assets/logo.png',
            '/static/hello/assets/map.png',
            '/static/hello/assets/pomodoro.png',
            '/static/hello/assets/prof.webp',
            '/static/hello/assets/raichu.gif',
            '/static/hello/assets/rival.png',
            '/static/hello/assets/raysen.png',
            '/static/hello/assets/rowlet.gif',
            '/static/hello/assets/sebastian.png',
            '/static/hello/css/style.css',
            '/static/hello/assets/bgm.mp3',
        ]

    def test_static_files_accessible(self):
        with requests.Session() as session:
            for path in self.urls:
                url = self.live_server_url + path
                try:
                    response = session.get(url, timeout=5)  # Add timeout
                    self.assertEqual(response.status_code, 200, f"Failed to access: {url} (Status: {response.status_code})")
                    self.assertGreater(len(response.content), 0, f"Empty content: {url}")
                except requests.RequestException as e:
                    self.fail(f"Request failed for {url}: {str(e)}")


class IntegrationTests(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # Create unique user data directory
        cls.temp_dir = tempfile.mkdtemp()
        options.add_argument(f"--user-data-dir={cls.temp_dir}")

        cls.selenium = Chrome()
        cls.selenium.get('http://www.google.com/')
        cls.selenium.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        shutil.rmtree(cls.temp_dir)  # Clean up temp directory
        super().tearDownClass()

    def test_home_page(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")

        # Check page title
        self.assertIn('Pokemon DLKL', self.selenium.title)

        # Check main elements
        header = self.selenium.find_element(By.CLASS_NAME, 'header-bg')
        self.assertTrue(header.is_displayed())

        welcome = self.selenium.find_element(By.CLASS_NAME, 'welcome')
        self.assertEqual(welcome.text, 'WELCOME!')

        # Button selectors
        home_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'HOME')]")
        download_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'DOWNLOAD')]")
        news_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'NEWS')]")
        char_button = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'CHARACTERS')]")

        self.assertTrue(home_button.is_displayed())
        self.assertTrue(download_button.is_displayed())
        self.assertTrue(news_button.is_displayed())
        self.assertTrue(char_button.is_displayed())

        wait = WebDriverWait(self.selenium, 5)

        # HOME
        home_button.click()
        home_section = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'welcome-container')))
        self.assertTrue(home_section.is_displayed())

        # DOWNLOAD
        download_button.click()
        download_section = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'download-section')))
        self.assertTrue(download_section.is_displayed())

        # NEWS
        news_button.click()
        news_section = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'news-section')))
        self.assertTrue(news_section.is_displayed())

        # CHARACTERS
        char_button.click()
        char_section = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'characters-section')))
        self.assertTrue(char_section.is_displayed())


    def test_clicker_game_link(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")
        clicker_box = self.selenium.find_element(By.XPATH, "//div[contains(@class, 'interactive-box') and .//div[contains(text(), 'Clicker Game')]]")
        clicker_box.click()

        # Should be redirected to clicker game page
        self.assertIn('trivia', self.selenium.current_url)
        self.assertIn('Clicker Game', self.selenium.page_source)

    def test_pomodoro_timer_link(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")
        timer_box = self.selenium.find_element(By.XPATH, "//div[contains(@class, 'interactive-box') and .//div[contains(text(), 'Pomodoro Timer')]]")
        timer_box.click()

        # Should be redirected to timer page
        self.assertIn('timer', self.selenium.current_url)
        self.assertIn('Pomodoro Timer', self.selenium.page_source)

    def test_social_share_menu(self):
        self.selenium.get(f"{self.live_server_url}{reverse('hello:index')}")
        wait = WebDriverWait(self.selenium, 10)

        # Share menu should start hidden
        share_menu = self.selenium.find_element(By.ID, 'share-menu')
        self.assertFalse(share_menu.is_displayed())

        # Click share button should show menu
        share_button = self.selenium.find_element(By.ID, 'share-button')
        share_button.click()
        wait.until(EC.visibility_of(share_menu))

        # Menu should now be visible
        self.assertTrue(share_menu.is_displayed())

        # Check social links
        twitter_link = self.selenium.find_element(By.XPATH, "//a[contains(@href, 'x.com')]")
        self.assertTrue(twitter_link.is_displayed())

        discord_link = self.selenium.find_element(By.XPATH, "//a[contains(@href, 'discord.gg')]")
        self.assertTrue(discord_link.is_displayed())

        instagram_link = self.selenium.find_element(By.XPATH, "//a[contains(@href, 'instagram.com')]")
        self.assertTrue(instagram_link.is_displayed())

        tiktok_link = self.selenium.find_element(By.XPATH, "//a[contains(@href, 'tiktok.com')]")
        self.assertTrue(tiktok_link.is_displayed())


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
