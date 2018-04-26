from app import app
from flask import request, render_template, jsonify
from .tools import histotoolkit as htk
from .tools import opnet
import os

app.config["DATA_FOLDER"] = './app/test'

@app.route('/')
def home():
    """
    Serve the application home page.
    """

    return render_template('index.html')

@app.route('/graph')
def graph():
    """
    Serve the graph application page.
    """
    print(htk.op_manager.ops)

    return render_template('graph.html')

@app.route('/set-folder', methods=['POST'])
def set_folder():
    """
    Set active folder for data methods. Returns list of all images in folder.
    """

    new_folder = request.form['new_folder']
    try:
        app.config["DATA_FOLDER"] = new_folder
        image_list = htk.list_all_images(app.config["DATA_FOLDER"])
        return jsonify(image_list)
    except:
        return 'failed'

@app.route('/data-summary', methods=['GET', 'POST'])
def data_summary():
    """
    Run all data operations and return output to user.
    """

    img_names = htk.list_all_images(app.config["DATA_FOLDER"])

    ops_output = []
    ops_output.append(htk.count_file_types(img_names))
    ops_output.append(htk.count_data_types(img_names))
    ops_output.append(htk.get_image_shapes(img_names))

    return jsonify(ops_output)

@app.route('/count-data-types', methods=['POST'])
def count_data_types():
    """
    Count all unique data types in list of images at DATA_FOLDER.
    """

    img_names = htk.list_all_images(app.config["DATA_FOLDER"])
    out = htk.count_data_types(img_names)
    return jsonify(out)

@app.route('/run-ops', methods=['POST'])
def run_ops():
    """
    Run all operations and returns output to user.
    """

    img_name = request.form['img_name']
    ops_names = request.form['ops_names']
    ops_params = request.form['ops_params']
    img = load_image(os.path.join(app.config["DATA_FOLDER"], img_name))

    img, ops_output = opnet._call_ops(img, ops_names, ops_params)
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
    val, ops_output = opnet._call_ops(val, ops_names, ops_params)

    return "Result: {0}<br \>{1}".format(val, ops_output)
