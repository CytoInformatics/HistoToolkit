from app import app
from flask import render_template
from .tools import histotoolkit as htk

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/test')
def test():
	data = 'test data'
	return htk.test(data)