var graph = {
    nodes: [],
    conduits: [],
    valid_ops: {},
    jsonify: function() {
        var obj = new Object();
        obj.nodes = [];
        obj.conduits = [];

        // loop nodes
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];

            if (node instanceof Node) {
                var node_obj = new Object();
                node_obj.name = node.node_id;
                node_obj.op = node.op_name;
                node_obj.params = [];
                node_obj.outputs = [];
                for (var j = 0; j < node.params.length; j++) {
                    if (node.params[j].value instanceof Conduit) {
                        // var value = node.params[j].value.output.node.node_id;
                        var value = "None";
                    } else if (typeof node.params[j].value === 'undefined') {
                        var value = "None";
                    } else {
                        var value = node.params[j].value;
                    }

                    param_obj = {
                        'name': node.params[j].name,
                        'value': value
                    }
                    node_obj.params.push(param_obj);
                }
                for (var j = 0; j < node.outputs.length; j++) {
                    node_obj.outputs.push(node.outputs[j].name);
                }
                obj.nodes.push(node_obj);
            }
        }

        // loop conduits
        for (var i = 0; i < this.conduits.length; i++) {
            var conduit = this.conduits[i];
            if (conduit instanceof Conduit) {
                var output = conduit.output;
                var param = conduit.param;

                var output_op = graph.valid_ops[output.node.op_name];
                var param_op = graph.valid_ops[param.node.op_name];

                var conduit_obj = new Object();
                var rand_id = strWithLeadingZeros(randInt(0, 10000), 4);
                conduit_obj.name = "conduit-" + rand_id;
                conduit_obj.output_node = output.node.node_id;
                conduit_obj.output = output_op.outputs[output.num];
                conduit_obj.param_node = param.node.node_id;
                conduit_obj.param = param_op.params[param.num].name;
                obj.conduits.push(conduit_obj);
            }
        }

        return JSON.stringify(obj);
    },
    run: function() {
        var formdata = {
          'graph': this.jsonify()
        };
        $.ajax({
            type: 'POST',
            url: '/run-graph',
            data: formdata,
            success: function(response) {
                console.log(response);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("ERROR: " + textStatus + " " + errorThrown);
            }
        });
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

var node_defaults = {
    port_radius: 15,
    port_spacing: 10,
    text_offset: [0, -10]
};

var node_name_defaults = {
    justification: 'left',
    fillColor: 'black',
    fontSize: '1em'
}
 
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

function Node(op, params, outputs, position, node_props, box_props) {
    this.params = [];
    this.outputs = [];
    this.op_name = op;            // to identify op on server
    this.display_name = op;       // modifiable name for user
    var rand_id = strWithLeadingZeros(randInt(0, 10000), 4);
    this.node_id = op + '-' + rand_id; // to uniquely identify node
    this.createPorts = function(port_names, port_type, port_defaults) {
        var box_corner = this.group.firstChild.point;
        var sp = node_props.port_spacing;
        var r = node_props.port_radius;
        for (var i = 0; i < port_names.length; i++) {
            // create port group
            var port = new Group();
            port.num = i;
            port.obj_type = port_type;
            port.node = this;
            port.name = port_names[i].name
            port.value = undefined;

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
        for (var i = 0; i < this.params.length; i++) {
            var param = this.params[i];
            if (param.value instanceof Conduit) {
                param.value.delete();
            }
            param.value = undefined;
            param.children[0].remove();
        }
        this.params = [];
        for (var i = 0; i < this.outputs.length; i++) {
            var output = this.outputs[i];
            if (output.value instanceof Conduit) {
                output.value.delete();
            }
            output.value = undefined;
            output.children[0].remove();
        }
        this.outputs = [];

        // remove own group
        this.group.remove();
        this.group = undefined;

        // remove self from graph.nodes
        for (var i = 0; i < graph.nodes.length; i++) {
            var node = graph.nodes[i];
            if (this === node) {
                graph.nodes.splice(i, 1);
            }
        }
    }

    // create box for node base
    var n_ports = params.length > outputs.length ? params.length : outputs.length;
    var sp = node_props.port_spacing;
    var r = node_props.port_radius;
    var box_w = 100;
    var box_h = (n_ports - 1) * (sp + 2 * r) + 2 * (sp + r);
    var box = new Path.Rectangle({
        point: position,
        size: [box_w, box_h],
    }); 
    assignProperties(box, box_props);
    box.onMouseEnter = function(event) {
        this.previousStrokeColor = this.strokeColor;
        this.strokeColor = this.hoverStrokeColor;
    };
    box.onMouseLeave = function(event) {
        this.strokeColor = this.previousStrokeColor;
    }; 

    // create display name object
    var t_off = node_props.text_offset;
    var text_position = [position[0] + t_off[0], position[1] + t_off[1]];
    var disp_name_path = new PointText({
        point: text_position,
        content: this.display_name  
    });
    assignProperties(disp_name_path, node_name_defaults);

    // create group for all items
    this.group = new Group([box, disp_name_path]);
    this.group.node = this;
    this.group.obj_type = "node";

    // create ports for params and outputs
    this.createPorts(params, "param", param_defaults);
    this.createPorts(outputs, "output", output_defaults);

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
            this.param.value = undefined;
        }
        if (this.output) {
            this.output.value = undefined;
        }
        this.param = undefined;
        this.output = undefined;
        this.line.remove();
        this.line = undefined;

        // remove self from graph.conduits
        for (var i = 0; i < graph.conduits.length; i++) {
            var conduit = graph.conduits[i];
            if (this === conduit) {
                graph.conduits.splice(i, 1);
            }
        }
    }

    // add references to link conduit and output
    output.value = this;
    this.output = output;

    // add references to link conduit and param, if given
    if (typeof param !== 'undefined') {
        param.value = this;
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
var lastClickTime = Date.now();
var doubleClickDelta = 300;
function onMouseDown(event) {
    var hit_result = project.hitTest(event.point, hitOptions);
    if (Date.now() - lastClickTime < doubleClickDelta) {
    // DOUBLE-CLICK
        if (
            hit_result
            && hit_result.item
            && hit_result.item.parent.node instanceof Node
        ) {
            // delete node
            hit_result.item.parent.node.delete();
        }
    } else {
    // SINGLE-CLICK
        if (hit_result && hit_result.item) {
            var item = hit_result.item;

            // check group item belongs to
            if (item.parent.obj_type == "output") {
                if (item.parent.value != undefined) {
                    item.parent.value.delete();
                }

                // // create conduit
                drawingConduit = new Conduit(conduit_props, item.parent);
            } else if (item.parent.obj_type == "node") {
                draggingNodeBox = item.parent;
            }
        }
    }

}

function onMouseDrag(event) {
    if (draggingNodeBox) {
        draggingNodeBox.position += event.delta;
        for (var i = 0; i < draggingNodeBox.children.length; i++) {
            var child = draggingNodeBox.children[i];
            if (!child.obj_type || !child.value) {
                continue;
            }

            if (child.obj_type == "param") {
                child.value.line.segments[1].point = child.position;
            } else if (child.obj_type == "output") {
                child.value.line.segments[0].point = child.position;
            }
        }
    } else if (drawingConduit) {
        // move conduit endpoint
        drawingConduit.line.segments[1].point = event.point;
    }
}

function createPortItem(port, name) {
    /* 
        Create port item (either param or output) with following structure:

        <div class="port-item">
          <div>name</div>
          <input type="text" name=name>
        </div>
    */

    var item = document.createElement("div");
    item.classList.add("port-item");

    var label = document.createElement("div");
    label.innerHTML = name;
    item.append(label)

    if (port.obj_type == "param") {
        var input_field = document.createElement("input");
        input_field.type = "text";
        input_field.name = name;

        if (port.value instanceof Conduit) {
            if (port.obj_type == "param") {
                var value = port.value.output.node.display_name;
            } else {
                var value = port.value.param.node.display_name;
            }
            var disabled = true;
        } else {
            var value = port.value;
            var disabled = false;
        }
        input_field.value = value;
        input_field.disabled = disabled;

        input_field.addEventListener("focusout", function() {
            port.value = this.value;
        })
        item.append(input_field);
    } else if (port.obj_type == "output") {

    }

    return item;
}

function toggleNodeMenu(nodebox) {
    if (typeof nodebox == 'undefined') {
        // hide menu when deselected
        $("#float-menu").addClass("hidden");
    } else {
        // update title and description
        $("#float-title").text(nodebox.node.display_name);
        var op_data = graph.valid_ops[nodebox.node.op_name];
        $("#float-description").text(op_data.docstring);

        // update params
        var param_list = document.getElementById("param-list");
        param_list.innerHTML = "";
        for (var i = 0; i < nodebox.node.params.length; i++) {
            var param = nodebox.node.params[i];
            var newport = createPortItem(
                param, 
                op_data.params[i].name
            );
            param_list.append(newport);
        }

        // update outputs
        var output_list = document.getElementById("output-list");
        output_list.innerHTML = "";
        for (var i = 0; i < nodebox.node.outputs.length; i++) {
            var output = nodebox.node.outputs[i];
            var newport = createPortItem(
                output, 
                op_data.outputs[i]
            );
            output_list.append(newport);
        }

        // show menu
        $("#float-menu").removeClass("hidden");
    }
}

function onMouseUp(event) {
    // set click time
    lastClickTime = Date.now();

    if (drawingConduit) {    
        var hit_result = project.hitTest(event.point, hitOptions);
        if (
            hit_result.item
            && hit_result.item.parent.obj_type == "param"
            && hit_result.item.parent.parent !== drawingConduit.output.parent
        ) {
            var item = hit_result.item;

            // remove existing conduit and references if present
            if (item.parent.value) {
                item.parent.value.delete();
            }

            // move line endpoint to item position
            drawingConduit.line.segments[1].point = item.position;

            // add reference to param as property of conduit
            drawingConduit.param = item.parent;

            // add reference to conduit as property of param
            item.parent.value = drawingConduit;
        } else {
            drawingConduit.delete();
        }
    }

    toggleNodeMenu(draggingNodeBox);

    drawingConduit = undefined;
    draggingNodeBox = undefined;
}

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

// add click handler to viewer tabs
$("#tabs").click(function(event) {

    event.preventDefault();

    if (event.target !== event.currentTarget) {
        if (event.target.id == "tab-1") {
            console.log("tab-1");
        } else if (event.target.id == "tab-2") {
            console.log("tab-2");
        } else if (event.target.id == "tab-3") {
            console.log("tab-3");
        } else if (event.target.id == "tab-4") {
            console.log("tab-4");
        } else if (event.target.id == "tab-5") {
            graph.run();
        }
    }
})

// add click handler to options menu
$("#options-1").click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget 
        && $(event.target).hasClass("folder-item")) {
        event.stopPropagation();

        // create node based on name
        var op = $(event.target)[0].value;
        newNode(op, [300, 300]);
    }
});

function newNode(key, position) {
    var obj = graph.valid_ops[key];
    return new Node(
        key, 
        obj.params, 
        obj.outputs,
        position, 
        node_defaults, 
        box_defaults
    );
}

var folder_id_root = "folder-";
$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: '/available-operations',
        async: true,
        success: function(obj){
            var ops_menu = $("#options-1");

            // get unique categories and available operations from response
            var categories = [];
            for (key in obj) {
                categories.push(obj[key].category);

                graph.valid_ops[key] = obj[key];
            }
            categories = categories.unique();
            graph.op_categories = categories;

            // create category folders in ops_menu
            for (var i = 0; i < categories.length; i++) {
                // create folder element
                var cat = categories[i];
                var folder = document.createElement("div");
                folder.id = folder_id_root + cat;
                folder.classList.add("folder");

                // create folder label element
                var folder_label = document.createElement("div");
                folder_label.innerHTML = cat;
                folder_label.classList.add("folder-label");

                // attach label to folder and folder to menu
                folder.append(folder_label)
                ops_menu.append(folder);
            }

            // create operation items in folders of ops_menu
            for (key in obj) {
                // create menu item element
                var newitem = document.createElement("div");
                newitem.innerHTML = key;
                newitem.value = key;
                newitem.classList.add("folder-item");

                // attach to folder element
                var folder_id = "#" + folder_id_root + obj[key].category;
                $(folder_id).append(newitem);
            }
        }
    });
});
