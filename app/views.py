from app import app
from flask import request, render_template, jsonify
from .tools import histotoolkit as htk
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

@app.route('/data-step', methods=['POST'])
def data_step():
    """
    Run all data operations and returns output to user.
    """

    ops_names = request.form['ops_names']
    ops_params = request.form['ops_params']
    img, ops_output = _call_ops(None, ops_names, ops_params)
    return jsonify(ops_output)

def _call_ops(data, ops_names, ops_params):
    """
    Sequentially run DATA through all functions in list OPS_NAMES using the 
    parameters in list OPS_PARAMS.
    """

    ops = [
        {'op': getattr(htk, op_name),
         'op_name': op_name,
         'params': params
        } for op_name, params in zip(ops_names, ops_params)
    ]

    ops_output = []
    for op in ops:
        op_output = op['op'](data, **op['params'])
        ops_output.append(op_output)

        if 'data' in op_output:
            data = op_output['data']

    return data, ops_output



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