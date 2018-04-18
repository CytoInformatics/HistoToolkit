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

function createNode(n_ports, box_props) {
    // create box for node base
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
    var node = new Group([box]);
    node.onMouseEnter = function(event) {
        cursor.visible = false;
    };
    node.onMouseLeave = function(event) {
        cursor.visible = true;
    };

    // create ports for params
    var box_corner = box.point;
    for (var i = 0; i < n_ports; i++) {
        // var offset = (i + 1) * (sp + r) + i * sp;
        var offset = i * (sp + 2 * r) + sp + r;
        var param = new Path.Circle({
            center: [box_corner[0], box_corner[1] + offset], 
            radius: r
        });

        assignProperties(param, param_defaults); 
        param.onMouseEnter = function(event) {
            this.previousFillColor = this.fillColor;
            this.fillColor = this.hoverFillColor;
        };
        param.onMouseLeave = function(event) {
            this.fillColor = this.previousFillColor;
        };
        node.appendTop(param);
    }

    return node;
}

// create cursor
var cursor = new Path.Circle(cursor_defaults);
cursor.sendToBack();
function onMouseMove(event) {
    cursor.position = event.point;
}

var node = createNode(3, box_defaults);