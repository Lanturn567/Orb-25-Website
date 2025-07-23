from django.shortcuts import render, redirect
from django.http import FileResponse, Http404
from django.conf import settings
import os

# Create your views here.
def index(request):
    return render(request, "hello/index.html",)

def download_file(request, platform):
    # Map platform names to file names
    file_map = {
        'windows': 'win.zip',
        'mac': 'mac.zip',
        'android': 'mac.zip'
    }

    if platform not in file_map:
        raise Http404("Download not found")

    file_name = file_map[platform]
    file_path = os.path.join(settings.STATIC_ROOT, 'hello', 'downloads', file_name)

    if os.path.exists(file_path):
        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response
    else:
        raise Http404("File not found")