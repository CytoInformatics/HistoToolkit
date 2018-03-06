from app import app
from flask import request, render_template, jsonify
from .tools import histotoolkit as htk
from .utils import *
import os

app.config["DATA_FOLDER"] = './app/test'

@app.route('/')
def home():
    """
    Serve the application home page.
    """

    return render_template('index.html')

@app.route('/set-folder', methods=['POST'])
def set_folder():
    """
    Set active folder for data methods.
    """

    new_folder = request.form['new_folder']
    try:
        app.config["DATA_FOLDER"] = new_folder
        return app.config["DATA_FOLDER"]
    except:
        return 'failed'
    
@app.route('/get-image-names', methods=['GET', 'POST'])
def get_image_names():
    """
    Return list of all image files within active folder.
    """

    return jsonify(htk.list_all_images(app.config["DATA_FOLDER"]))

@app.route('/data-summary', methods=['POST'])
def data_summary():
    """
    Run all data operations and returns output to user.
    """

    ops_names = ['count_data_types']
    ops_params = {'folder': app.config["DATA_FOLDER"]}
    img, ops_output = _call_ops(None, ops_names, ops_params)
    return jsonify(ops_output)

@app.route('/run-ops', methods=['POST'])
def run_ops():
    """
    Run all operations and returns output to user.
    """

    img_name = request.form['img_name']
    ops_names = request.form['ops_names']
    ops_params = request.form['ops_params']
    img = load_image(os.path.join(app.config["DATA_FOLDER"], img_name))
    
    img, ops_output = _call_ops(img, ops_names, ops_params)
    return jsonify(ops_output)



# TESTING ONLY
@app.route('/test')
def test():
    ops_names = ['test_mult', 'test_power']
    ops_params = [
        {'arg1': 3},
        {'arg1': 2}
    ]

    val = 2
    val, ops_output = _call_ops(val, ops_names, ops_params)

    return "Result: {0}<br \>{1}".format(val, ops_output)