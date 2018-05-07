import os, json
from app import app
from flask import request, render_template, jsonify
from .tools import histotoolkit as htk
from .tools import opnet

app.config["DATA_FOLDER"] = './app/test'
THUMBNAIL_EXT = '.jpg'

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

    return jsonify({key: val['info'] for key, val in htk.op_manager.ops.items()})

@app.route('/set-folder', methods=['POST'])
def set_folder():
    """
    Set active folder for data methods. Returns list of all images in folder.
    """

    new_folder = request.form['folder']
    # try:
    app.config["DATA_FOLDER"] = new_folder
    image_list = htk.list_all_images(app.config["DATA_FOLDER"])
    images_info = [htk.get_image_info(uri, thumbnail_ext=THUMBNAIL_EXT) for uri in image_list]
    return jsonify(images_info)
    # except:
    #     return 'failed'

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

    graph_schematic = json.loads(request.form['graph'])
    print(graph_schematic)

    graph = opnet.OpNet()
    for node in graph_schematic['nodes']:
        node_params = {}
        for p in node['params']:
            if not isinstance(p['value'], str):
                node_params[p['name']] = p['value']
            elif p['value'].isdigit():
                node_params[p['name']] = int(p['value'])
            elif len(p['value'].split('.')) == 2 \
                 and all(s.isdigit() for s in p['value'].split('.')):
                node_params[p['name']] = float(p['value'])
            else:
                node_params[p['name']] = p['value']

        graph.add_node(
            htk.op_manager.ops[node['op']]['ref'], 
            node_params, 
            node['outputs'], 
            name=node['name']
        )

    for conduit in graph_schematic['conduits']:
        print(conduit)
        graph.bind(
            conduit['output_node'], 
            conduit['output'], 
            conduit['param_node'], 
            conduit['param']
        )

    results = graph.run()
    return jsonify(results)
