import json
from flask import Flask
app = Flask(__name__)

with open('app/config.json') as f:
    config = json.load(f)
    app.config["APPDATA"] = config

from app import views
