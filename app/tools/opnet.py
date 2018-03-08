class OpNet:
    pass


class Conduit:
    value = None
    def __init__(self, source, output):
        source.conduit = self
        output.conduit = self
        self.source = source
        self.output = output

class Node:
    class Port:
        def __init__(self, name, conduit=None, datatypes=(None,)):
            self.name = name
            self.conduit = conduit

            datatypes = ensure_is_listlike(datatypes)
            self.datatypes = datatypes

        def get_value(self):
            if isinstance(self.conduit, Conduit):
                return self.conduit.value
            else:
                return self.conduit

        def set_value(self, value):
            if isinstance(self.conduit, Conduit):
                self.conduit.value = value
            else:
                self.conduit = value

    class Param(Port):
        pass

    class Output(Port):
        pass

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
        self.params = [Node.Param(name, value) for (name, value) in params.items()]

        # init outputs
        self.outputs = [Node.Output(name) for name in outputs]

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

        return {param.name: param.get_value() for param in self.params}

    def list_outputs(self):
        """
        Return list of output names.
        """

        return [output.name for output in self.outputs]

    def param_values(self):
        return {param.name: param.get_value() for param in self.params}

    def output_values(self):
        return {output.name: output.get_value() for output in self.outputs}

    def execute(self):
        outs = self.op(**self.unpack_params())
        outs = ensure_is_listlike(outs)

        # store outputs as value
        for (s_out, out) in zip(self.outputs, outs):
            s_out.set_value(out)

        # convert to dict for output
        outs = {name: out for (name, out) in zip(self.list_outputs(), outs)}
        return outs

def Bind(node1, output_name, node2, param_name):
    """
    Create Conduit to connect OUTPUT_NAME of NODE1 to PARAM_NAME of NODE2.
    """

    node1_output = None
    for output in node1.outputs:
        if output.name == output_name:
            node1_output = output
            break

    if node1_output is None:
        raise NameError("{0} was not found in outputs of node1.".format(output_name))

    node2_param = None
    for param in node2.params:
        if param.name == param_name:
            node2_param = param
            break

    if node2_param is None:
        raise NameError("{0} was not found in params of node2.".format(param_name))

    return Conduit(node1_output, node2_param)


def ensure_is_listlike(thing):
    """
    Check if THING is list or tuple and, if neither, converts to list.
    """

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