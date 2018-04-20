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

function Node(position, n_params, n_outputs, box_props) {
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
    this.group.obj_type = "node";

    // create ports for params and outputs
    this.createPorts(n_params, "param", param_defaults);
    this.createPorts(n_outputs, "output", output_defaults);

    return this;
}

function Conduit(props, output, param) {
    // create line to add as conduit
    // line is added as property of group but is NOT child of group
    if (param) {
        var endpoint = param.position;
    } else {
        var endpoint = output.position;
    }
    var conduit = new Path.Line(output.position, endpoint);
    assignProperties(conduit, props);
    conduit.sendToBack();

    // function to delete itself
    conduit.delete = function() {
        if (this.param) {
            this.param.conduit = undefined;
        }
        if (this.output) {
            this.output.conduit = undefined;
        }
        this.param = undefined;
        this.output = undefined;
        this.remove();
    }

    // add references to link conduit and output
    output.conduit = conduit;
    conduit.output = output;

    // add references to link conduit and param, if given
    if (param) {
        param.conduit = conduit;
        conduit.param = param;
    } else {
        conduit.param = undefined;
    }

    return conduit;
}

// event handlers
var draggingNode = undefined;
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
            conduit = new Conduit(conduit_props, item.parent);
            drawingConduit = conduit;
        } else if (item.parent.obj_type == "node") {
            draggingNode = item.parent;
        }
    }
}

function onMouseDrag(event) {
    if (draggingNode) {
        // move node
        draggingNode.position += event.delta;
        for (key in draggingNode.children) {
            var child = draggingNode.children[key];
            if (!child.obj_type || !child.conduit) {
                continue;
            }

            if (child.obj_type == "param") {
                child.conduit.segments[1].point = child.position;
            } else if (child.obj_type == "output") {
                child.conduit.segments[0].point = child.position;
            }
        }
    } else if (drawingConduit) {
        // move conduit endpoint
        drawingConduit.segments[1].point = event.point;
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
            drawingConduit.segments[1].point = item.position;

            // add reference to param as property of conduit
            drawingConduit.param = item.parent;

            // add reference to conduit as property of param
            item.parent.conduit = drawingConduit;
        } else {
            drawingConduit.delete();
        }
    }

    drawingConduit = undefined;
    draggingNode = undefined;
}


// create example node
var node1 = Node([200, 300], 3, 4, box_defaults);
var node2 = Node([700, 200], 2, 2, box_defaults);
var node2 = Node([700, 600], 2, 1, box_defaults);