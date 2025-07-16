import os
import zipfile
import json

EXTENSION_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), 'extension'))
BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'build'))
MANIFEST_PATH = os.path.join(EXTENSION_DIR, 'manifest.json')

if not os.path.exists(MANIFEST_PATH):
    raise FileNotFoundError(
        f"manifest.json not found at {MANIFEST_PATH}. Please ensure the 'extension' directory and manifest.json exist.")

with open(MANIFEST_PATH, encoding='utf-8') as f:
    manifest = json.load(f)
version = manifest.get('version', '0.0.0')


zip_name = f'youtube-manager-{version}.zip'
if not os.path.exists(BUILD_DIR):
    os.makedirs(BUILD_DIR)
zip_path = os.path.join(BUILD_DIR, zip_name)


def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, path)
            ziph.write(abs_path, rel_path)


with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir(EXTENSION_DIR, zipf)

print(f'Zbudowano: {zip_path}')
