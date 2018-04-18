box_defaults = {
    strokeColor: 'black',
    fillColor: 'blue',
    strokeWidth: 6,
    hoverStrokeColor: 'green'
};

param_defaults = {
    fillColor: 'black',
    hoverFillColor: 'green'
};

output_defaults = {
    fillColor: 'black',
    hoverFillColor: 'red'
};

cursor_defaults = {
    center: [-100, -100],
    radius: 5,
    fillColor: 'black'
};

node_props = {
    port_radius: 15,
    port_spacing: 10,
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
            var offset = i * (sp + 2 * r) + sp + r;

            if (port_type == "output") {
                var center = [box_corner[0] + box_w, box_corner[1] + offset];
            } else {
                var center = [box_corner[0], box_corner[1] + offset];
            }

            var port = new Path.Circle({
                center: center, 
                radius: r
            });
            assignProperties(port, port_defaults);
            port.port_type = port_type;
            port.onMouseEnter = function(event) {
                this.previousFillColor = this.fillColor;
                this.fillColor = this.hoverFillColor;
            };
            port.onMouseLeave = function(event) {
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

    // create group for all items
    this.group = new Group([box]);
    this.group.onMouseEnter = function(event) {
        cursor.visible = false;
    };
    this.group.onMouseLeave = function(event) {
        cursor.visible = true;
    };

    // create ports for params and outputs
    this.createPorts(n_params, "param", param_defaults);
    this.createPorts(n_outputs, "output", output_defaults);

    return this;
}

// create cursor
var cursor = new Path.Circle(cursor_defaults);
cursor.sendToBack();
function onMouseMove(event) {
    cursor.position = event.point;
}

var node = Node(3, 4, box_defaults);