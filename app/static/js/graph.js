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

function Node(n_params, n_outputs, box_props) {
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
        point: [200, 200],
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
    // box.onMouseDrag = function(event) {
    //     this.parent.position += event.delta;
    // }

    // create group for all items
    this.group = new Group([box]);
    this.group.obj_type = "node";

    // create ports for params and outputs
    this.createPorts(n_params, "param", param_defaults);
    this.createPorts(n_outputs, "output", output_defaults);

    return this;
}

// event handlers
var draggingNode = undefined;
var drawingConduit = undefined;
function onMouseDown(event) {
    var hit_result = project.hitTest(event.point, hitOptions);
    if (hit_result.item) {
        var item = hit_result.item;

        // check group item belongs to
        if (item.parent.obj_type == "output") {
            if (item.conduit != undefined) {
                item.conduit.remove();
            }

            // create line to add as conduit
            var line = new Path.Line(item.position, item.position);
            assignProperties(line, conduit_props);
            drawingConduit = line;
            item.parent.appendBottom(line);
            item.conduit = line;
        } else if (item.parent.obj_type == "node") {
            draggingNode = item.parent;
        }
    }
}

function onMouseDrag(event) {
    if (draggingNode) {
        // move node
        draggingNode.position += event.delta;
    } else if (drawingConduit) {
        // move conduit endpoint
        drawingConduit.segments[0].point = event.point;
    }
}

function onMouseUp(event) {
    drawingConduit = undefined;
    draggingNode = undefined;
}


// create example node
var node = Node(3, 4, box_defaults);