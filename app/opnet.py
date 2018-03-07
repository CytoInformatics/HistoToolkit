class OpNet:
    pass

class Node:
    def __init__(self, op, params, outputs):
        self.op = op

        # init params
        self.params = {
            key: {
                'value': value,
                'source': None,
            } for (key, value) in params.items()
        }

        # init outputs (maintain similar structure as params)
        self.outputs = {key: {'output': None} for key in outputs}

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