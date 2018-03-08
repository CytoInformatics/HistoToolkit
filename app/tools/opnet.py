class OpNet:
    pass

class Node:
    class Param:
        def __init__(self, source=None, datatypes=(None,)):
            self.source = source
            self.last_value = None

            datatypes = ensure_is_listlike(datatypes)
            self.datatypes = datatypes

    class Output:
        def __init__(self, output=None, datatypes=(None,)):
            self.output = output
            self.last_value = None

            datatypes = ensure_is_listlike(datatypes)
            self.datatypes = datatypes

    def __init__(self, op, params, outputs):
        """
        Create new node.

        Inputs:
            op: Reference to function.
            params: Dictionary of parameters to function defined in 'op'. The key 
                is the name of the parameter and the value is its assigned value.
            outputs: List of strings with arbitrary names for ordered outputs of 
                function 'op'.
        """

        # init op
        self.op = op

        # init params
        self.params = {key: Node.Param(value) for (key, value) in params.items()}

        # init outputs (needs to be ordered)
        self.outputs = [{key: Node.Output()} for key in outputs]

    def __repr__(self):
        return "<Node op:{0} params:{1} outputs:{2}>".format(self.op, self.params, self.outputs)

    def __str__(self):
        return "Node: \
                    \n\top: {0} \
                    \n\tparams: {1} \
                    \n\toutputs: {2}".format(self.op, self.params, self.outputs)

    def unpack_params(self):
        """
        Return dict of params with key as name and source as value.
        """

        return {key: param.source for (key, param) in self.params.items()}

    def list_outputs(self):
        """
        Return list of output names.
        """

        return [next(iter(output)) for output in self.outputs]

    def execute(self):
        out = self.op(**self.unpack_params())
        out = ensure_is_listlike(out)
        out = {name: out for (name, out) in zip(self.list_outputs(), out)}
        return out

def ensure_is_listlike(thing):
    if not isinstance(thing, (list, tuple)):
        thing = [thing,]

    return thing

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