import os
from app import app
from flask import request, render_template, jsonify
from .tools import histotoolkit as htk
from .tools import opnet

app.config["DATA_FOLDER"] = './app/test'

@app.route('/')
def home():
    """
    Serve the application home page.
    """

    return render_template('index.html')

@app.route('/available-operations')
def available_operations():
    """
    Return json object with available operations and parameters.
    """
    return jsonify(htk.op_manager.ops)

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

@app.route('/run-graph', methods=['POST'])
def run_graph():
    """
    Run all operations and return output to user.
    """

    graph_schematic = request.form['graph']
    print(graph_schematic)
    return graph_schematic
