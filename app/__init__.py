import json
from flask import Flask
from os.path import expanduser

app = Flask(__name__)

with open('app/config.json') as f:
    config = json.load(f)
    app.config['APPDATA'] = config

    if not app.config['APPDATA']['FILE_DIR']:
        app.config['APPDATA']['FILE_DIR'] = expanduser('~') + '/Pictures'

from app import views
