var graph = {
    nodes: [],
    conduits: [],
    jsonify: function() {
        var obj = new Object();
        obj.nodes = [];
        obj.conduits = [];

        // loop nodes
        for (key in this.nodes) {
            var node = this.nodes[key];
            if (node instanceof Node) {
                var node_obj = new Object();
                node_obj.name = "node" + key
                node_obj.params = [];
                node_obj.outputs = [];
                for (key in node.params) {
                    var param_obj = node.params[key];
                    node_obj.params.push(param_obj.obj_type + key);
                }
                for (key in node.outputs) {
                    var output_obj = node.outputs[key];
                    node_obj.outputs.push(param_obj.obj_type + key);
                }
                obj.nodes.push(node_obj);
            }
        }

        // loop conduits
        for (key in this.conduits) {
            var conduit = this.conduits[key];
            if (conduit instanceof Conduit) {
                var conduit_obj = new Object();
                conduit_obj.name = "conduit" + key;
                conduit_obj.output = "output";
                conduit_obj.param = "param";
                obj.conduits.push(conduit_obj);
            }
        }

        return JSON.stringify(obj);
    }
};

var box_defaults = {
    strokeColor: 'black',
    fillColor: 'blue',
    strokeWidth: 6,
    hoverStrokeColor: 'green'
};

var param_defaults = {
    fillColor: 'black',
    hoverFillColor: 'green'
};

var output_defaults = {
    fillColor: 'black',
    hoverFillColor: 'red'
};

var node_props = {
    port_radius: 15,
    port_spacing: 10,
};
 
var conduit_props = {
    strokeColor: 'black',
    strokeWidth: 6
}

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

function assignProperties(path, properties) {
    for (key in properties) {
        path[key] = properties[key];
    }
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function strWithLeadingZeros(number, n_zeros) {
    var numstr = number.toString();
    while (numstr.length < n_zeros) {
        numstr = '0' + numstr;
    }
    return numstr;
}

function Node(op, n_params, n_outputs, position, box_props) {
    this.params = [];
    this.outputs = [];
    this.op_name = op;            // to identify op on server
    this.display_name = op;       // modifiable name for user
    var rand_id = strWithLeadingZeros(randInt(0, 10000), 4);
    this.id = op + '-' + rand_id; // to uniquely identify node
    this.createPorts = function(n_ports, port_type, port_defaults) {
        var box_corner = this.group.firstChild.point;
        for (var i = 0; i < n_ports; i++) {
            // create port group
            var port = new Group();
            port.obj_type = port_type;

            // create port path
            var offset = i * (sp + 2 * r) + sp + r;
            if (port_type == "output") {
                var center = [box_corner[0] + box_w, box_corner[1] + offset];
            } else {
                var center = [box_corner[0], box_corner[1] + offset];
            }
            var port_path = new Path.Circle({
                center: center, 
                radius: r
            });
            port.appendTop(port_path);
            assignProperties(port_path, port_defaults);
            port_path.onMouseEnter = function(event) {
                this.previousFillColor = this.fillColor;
                this.fillColor = this.hoverFillColor;
            };
            port_path.onMouseLeave = function(event) {
                this.fillColor = this.previousFillColor;
            };

            this.group.appendTop(port);
            if (port_type == "output") {
                this.outputs.push(port);
            } else {
                this.params.push(port);
            }
        }
    }

    this.delete = function() {
        // remove all ports and their conduits and paper paths
        for (key in this.params) {
            var param = this.params[key];
            if (param.conduit instanceof Conduit) {
                param.conduit.delete();
            }
            param.conduit = undefined;
            param.remove();
            this.params[key] = undefined;
        }
        for (key in this.outputs) {
            var output = this.outputs[key];
            if (output.conduit instanceof Conduit) {
                output.conduit.delete();
            }
            output.conduit = undefined;
            output.remove();
            this.outputs[key] = undefined;
        }

        // remove own group
        this.group.remove();
        this.group = undefined;

        // remove self from graph.nodes
        for (key in graph.nodes) {
            var node = graph.nodes[key];
            if (this === node) {
                graph.nodes.splice(key, 1);
            }
        }

    }

    // create box for node base
    var n_ports = n_params > n_outputs ? n_params : n_outputs;
    var sp = node_props.port_spacing;
    var r = node_props.port_radius;
    var box_w = 200;
    var box_h = (n_ports - 1) * (sp + 2 * r) + 2 * (sp + r);
    var box = new Path.Rectangle({
        point: position,
        size: [box_w, box_h],
    }); 
    assignProperties(box, box_defaults);
    box.onMouseEnter = function(event) {
        this.previousStrokeColor = this.strokeColor;
        this.strokeColor = this.hoverStrokeColor;
    };
    box.onMouseLeave = function(event) {
        this.strokeColor = this.previousStrokeColor;
    }; 

    // create group for all items
    this.group = new Group([box]);
    this.group.node = this;

    // create ports for params and outputs
    this.createPorts(n_params, "param", param_defaults);
    this.createPorts(n_outputs, "output", output_defaults);

    // add to graph object
    graph.nodes.push(this);

    return this;
}

function Conduit(props, output, param) {
    // create line to add as conduit
    // line is added as property of group but is NOT child of group
    if (typeof param !== 'undefined') {
        var endpoint = param.position;
    } else {
        var endpoint = output.position;
    }
    this.line = new Path.Line(output.position, endpoint);
    assignProperties(this.line, props);
    this.line.sendToBack();

    // function to delete itself
    this.delete = function() {
        if (this.param) {
            this.param.conduit = undefined;
        }
        if (this.output) {
            this.output.conduit = undefined;
        }
        this.param = undefined;
        this.output = undefined;
        this.line.remove();
        this.line = undefined;

        // remove self from graph.conduits
        for (key in graph.conduits) {
            var conduit = graph.conduits[key];
            if (this === conduit) {
                graph.conduits.splice(key, 1);
            }
        }
    }

    // add references to link conduit and output
    output.conduit = this;
    this.output = output;

    // add references to link conduit and param, if given
    if (typeof param !== 'undefined') {
        param.conduit = this;
        this.param = param;
    } else {
        this.param = undefined;
    }

    // add to graph object
    graph.conduits.push(this);

    return this;
}

// event handlers
var draggingNodeBox = undefined;
var drawingConduit = undefined;
function onMouseDown(event) {
    var hit_result = project.hitTest(event.point, hitOptions);
    if (hit_result && hit_result.item) {
        var item = hit_result.item;

        // check group item belongs to
        if (item.parent.obj_type == "output") {
            if (item.parent.conduit != undefined) {
                item.parent.conduit.delete();
            }

            // // create conduit
            drawingConduit = new Conduit(conduit_props, item.parent);
        } else if (item.parent.node instanceof Node) {
            draggingNodeBox = item.parent;
        }
    }
}

function onMouseDrag(event) {
    if (draggingNodeBox) {
        // move node
        draggingNodeBox.position += event.delta;
        for (key in draggingNodeBox.children) {
            var child = draggingNodeBox.children[key];
            if (!child.obj_type || !child.conduit) {
                continue;
            }

            if (child.obj_type == "param") {
                child.conduit.line.segments[1].point = child.position;
            } else if (child.obj_type == "output") {
                child.conduit.line.segments[0].point = child.position;
            }
        }
    } else if (drawingConduit) {
        // move conduit endpoint
        drawingConduit.line.segments[1].point = event.point;
    }
}

function onMouseUp(event) {
    if (drawingConduit) {    
        var hit_result = project.hitTest(event.point, hitOptions);
        if (
            hit_result.item
            && hit_result.item.parent.obj_type == "param"
            && hit_result.item.parent.parent !== drawingConduit.output.parent
        ) {
            var item = hit_result.item;

            // remove existing conduit and references if present
            if (item.parent.conduit) {
                item.parent.conduit.delete();
            }

            // move line endpoint to item position
            drawingConduit.line.segments[1].point = item.position;

            // add reference to param as property of conduit
            drawingConduit.param = item.parent;

            // add reference to conduit as property of param
            item.parent.conduit = drawingConduit;
        } else {
            drawingConduit.delete();
        }
    }

    drawingConduit = undefined;
    draggingNodeBox = undefined;

    console.log(graph.jsonify());
}


// create example node
var node1 = new Node('op1', 3, 4, [200, 300], box_defaults);
var node2 = new Node('op2', 2, 2, [700, 200], box_defaults);
var node2 = new Node('0p3', 2, 1, [700, 600], box_defaults);
