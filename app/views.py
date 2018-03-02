from app import app
from flask import render_template, jsonify
from .tools import histotoolkit as htk
import os

data_folder = '/home/masonmcgough/Workspace/HistoToolkit/app/test'

def _call_ops(data, ops_names, ops_params):
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

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/data-step', methods=['GET', 'POST'])
def data_step():
    # ops_names = request.form['ops_names']
    # ops_params = request.form['ops_params']
    ops_names = ['count_data_types']
    ops_params = [
        {'folder': data_folder}
    ]

    # return htk.get_data_type(ops_names, **)
    # return _call_ops()
    img, ops_output = _call_ops(None, ops_names, ops_params)
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