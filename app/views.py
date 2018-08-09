import re, os, json
import numpy as np
from app import app
from flask import request, render_template, jsonify, url_for, Blueprint
from .tools import histotoolkit as htk
from .tools import opnet, ops

import skimage

config = app.config["APPDATA"]

folder_bp = Blueprint('files', __name__, static_folder='current')
app.register_blueprint(folder_bp, url_prefix='/files')

# op_manager = opnet.OperationsManager([
#     [ops.multiply, 'Math', 'data'],
#     [ops.convert_data_type, 'Data', 'data'],
#     [ops.rescale_range, 'Data', ['data', 'out_min', 'out_max']],
#     [ops.resize_image, 'Image', 'data'],
#     [ops.adjust_brightness, 'Image', 'data'],
#     [ops.adjust_contrast, 'Image', 'data']
# ])

pkg = 'skimage.util'
# print(dir(eval(pkg)))
op_manager = opnet.OperationsManager([
    [eval(pkg + '.' + f), pkg, 'data'] for f in dir(eval(pkg)) if not f[0] == '_'
])


def _s_abs(s):
    return re.sub('-', '', s)

@app.route('/')
def home():
    """
    Serve the application home page.
    """

    # clear contents of temp folder
    temp_folder = './app/static/temp'
    for f in os.listdir(temp_folder):
        f_path = os.path.join(temp_folder, f)
        try:
            if os.path.isfile(f_path):
                os.unlink(f_path)
        except Exception as e:
            print(e)

    return render_template('index.html')

@app.route('/get-config')
def get_config():
    """
    Return configuration settings to client.
    """

    return jsonify(config)

@app.route('/available-operations')
def available_operations():
    """
    Return json object with available operations and parameters.
    """

    return jsonify({key: val['info'] for key, val in op_manager.ops.items()})

@app.route('/set-folder', methods=['POST'])
def set_folder():
    """
    Set active folder for data methods. Returns list of all images in folder.
    """

    new_folder = request.form['folder']
    config["FILE_DIR"] = new_folder

    # set blueprint static folder
    folder_bp.static_folder = new_folder

    try:
        image_list = htk.list_all_images(config["FILE_DIR"])
        images_info = [htk.get_image_info(uri) for uri in image_list]

        for img in images_info:
            img['route'] = url_for(
                'files.static', 
                filename=img['filename']
            )

        return jsonify(images_info)
    except:
        return 'failed'

@app.route('/get-thumbnail', methods=['POST'])
def get_thumbnail():
    """
    Find and/or create thumbnail for file.
    """

    img_uri = request.form['uri']

    # create thumbnails folder if does not exist
    thumbs_dir = os.path.join('app', 'static', config['THUMBS_DIR'])
    if not os.path.exists(thumbs_dir):
        os.makedirs(thumbs_dir)

    # get name of thumbnail file
    thumbnail_fname = htk.hash_file(img_uri) + config['THUMBNAIL_EXT']
    fpath_server = os.path.join(thumbs_dir, thumbnail_fname)

    # verify thumbnail exists
    if not os.path.exists(fpath_server):
        htk.create_thumbnail(img_uri, fpath_server)

    # return relative path to client
    fpath_client = os.path.join('static', config['THUMBS_DIR'], thumbnail_fname)
    return fpath_client

@app.route('/data-summary', methods=['GET', 'POST'])
def data_summary():
    """
    Run all data operations and return output to user.
    """

    img_names = htk.list_all_images(config["FILE_DIR"])

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

    img_names = htk.list_all_images(config["FILE_DIR"])
    out = htk.count_data_types(img_names)
    return jsonify(out)

@app.route('/run-graph', methods=['POST'])
def run_graph():
    """
    Run all operations and return output to user.
    """

    graph_schematic = json.loads(request.form['graph'])
    print(graph_schematic)

    graph = opnet.OpNet()
    for node in graph_schematic['nodes']:
        node_params = {}
        for p in node['params']:
            if p['type'] == 'image':
                node_params[p['name']] = htk.load_image(p['value'])
            elif not isinstance(p['value'], str):
                node_params[p['name']] = p['value']
            elif _s_abs(p['value']).isdigit():
                node_params[p['name']] = int(p['value'])
            elif len(p['value'].split('.')) == 2 \
                 and all(_s_abs(s).isdigit() for s in p['value'].split('.')):
                node_params[p['name']] = float(p['value'])
            elif p['value'][0] == '[' and p['value'][-1] == ']':
                node_params[p['name']] = json.loads(p['value'])
            else:
                node_params[p['name']] = p['value']

        graph.add_node(
            op_manager.ops[node['op']]['ref'], 
            node_params, 
            node['outputs'], 
            name=node['name']
        )

    for conduit in graph_schematic['conduits']:
        graph.bind(
            conduit['output_node'], 
            conduit['output'], 
            conduit['param_node'], 
            conduit['param']
        )

    results = graph.run()
    for node in results:
        for key, val in node['outputs'].items():
            newval, datatype = htk.json_sanitize(val)

            node['outputs'][key] = {
                'name': key,
                'value': newval,
                'datatype': datatype
            }

    return jsonify(results)
