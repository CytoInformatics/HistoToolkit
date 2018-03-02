from app import app
from flask import render_template
from .tools import histotoolkit as htk

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/test')
def test():
    ops_names = ['test_mult', 'test_power']
    ops_params = [
        {'arg1': 3},
        {'arg1': 2}
    ]
    ops = [
        {'op': getattr(htk, op_name),
         'op_name': op_name,
         'params': params
        } for op_name, params in zip(ops_names, ops_params)
    ]

    val = 2
    for op in ops:
        val = op['op'](val, **op['params'])

    return "Result: {0}".format(val)

@app.route('/data-step', methods=['POST'])
def data_step():
    # ops_names = request.form['ops_names']
    # ops_params = request.form['ops_params']
    return None