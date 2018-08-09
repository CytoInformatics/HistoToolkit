Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

Array.prototype.end = function() {
    return this.slice(-1)[0];
}

var graph = {
    nodes: {},
    conduits: {},
    valid_ops: {},
    deselectNodes: function() {
        for (var i in this.nodes) {
            var node = this.nodes[i];
            node.deselect();
        }

        // remove selection from node list
        var ops_menu = $('#node-list');
        for (var i = 0; i < ops_menu[0].children.length; i++) {
            ops_menu[0].children[i].classList.remove('selected');
        }

        toggleNodeMenu();
    },
    selectNodes: function(nodes) {
        // convert to array if only one
        if (typeof nodes === 'undefined') {
            nodes = [];
        } else if (typeof nodes.length === 'undefined') {
            nodes = [nodes];
        }

        this.deselectNodes();

        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            node.select();

            document.getElementById(node.node_id).classList.add('selected');
        }
        toggleNodeMenu(node);
    },
    jsonify: function() {
        var obj = new Object();
        obj.nodes = [];
        obj.conduits = [];

        // loop nodes
        for (var i in this.nodes) {
            var node = this.nodes[i];

            if (node instanceof Node) {
                var node_obj = new Object();
                node_obj.name = node.node_id;
                node_obj.op = node.op_name;

                // params
                node_obj.params = [];
                for (var j = 0; j < node.params.length; j++) {
                    if (node.params[j].get_value() instanceof Conduit) {
                        // var value = node.params[j].get_value().output.node.node_id;
                        var value = null;
                    } else if (typeof node.params[j].get_value() === 'undefined') {
                        var value = null;
                    } else {
                        var value = node.params[j].get_value();
                    }
                    var type = node.params[j].datatype;

                    param_obj = {
                        'name': node.params[j].name,
                        'value': value,
                        'type': type
                    }
                    node_obj.params.push(param_obj);
                }

                // outputs
                node_obj.outputs = [];
                for (var j = 0; j < node.outputs.length; j++) {
                    node_obj.outputs.push(node.outputs[j].name);
                }
                obj.nodes.push(node_obj);
            }
        }

        // loop conduits
        for (var i in this.conduits) {
            var conduit = this.conduits[i];
            if (conduit instanceof Conduit) {
                var output = conduit.output;
                var param = conduit.param;

                var output_op = graph.valid_ops[output.node.op_name];
                var param_op = graph.valid_ops[param.node.op_name];

                var conduit_obj = new Object();
                conduit_obj.name = conduit.conduit_id;
                conduit_obj.output_node = output.node.node_id;
                conduit_obj.output = output_op.outputs[output.num].name;
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
                displayResponse(response);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("ERROR: " + textStatus + " " + errorThrown);
                var txt = jqXHR.responseText.split('Traceback').end()
                txt = txt.replace('-->', '');
                txt = txt.replace(/(?:\r\n|\r|\n)/g, '\n\n')
                console.log(txt);
                displayResponse(txt);
            }
        });
    }
};

function displayResponse(resp) {
    function createOutputElement(data) {
        var item = document.createElement('div');
        item.classList.add('output-item');

        var item_node = document.createElement('div');
        item_node.classList.add('output-item-node');
        var label = document.createElement('div');
        label.classList.add('label');
        label.innerHTML = data.node;
        item_node.append(label)
        item.append(item_node);

        var item_data = document.createElement('div');
        item_data.classList.add('output-item-data');
        for (var key in data.outputs) {
            var out_obj = data.outputs[key];
            var output = document.createElement('div');
            output.classList.add('output');

            var label = document.createElement('div');
            label.classList.add('label');
            label.innerHTML = out_obj.name;
            output.append(label);

            if (out_obj.datatype === 'base64-image'
                || out_obj.datatype === 'image') {
                var value = document.createElement('img');
                value.src = out_obj.value;
            } else {
                var value = document.createElement('div');
                value.innerHTML = out_obj.value;
            }
            value.classList.add('value');
            output.append(value);

            item_data.append(output);
        }
        item.append(item_data);

        return item;
    }

    function createOutputImage(src, name) {
        var item = document.createElement('div');
        item.classList.add('output-image-div');

        var item_thumb = document.createElement('div');
        item_thumb.classList.add('output-image-thumbnail');
        var img = document.createElement('img');
        img.src = src;
        item_thumb.append(img);
        item.append(item_thumb);

        var img_panel = document.createElement('div');
        img_panel.classList.add('output-image-panel');
        var img_title = document.createElement('div');
        img_title.classList.add('output-image-title');
        img_title.innerHTML = name;
        img_panel.append(img_title);

        var img_buttons = document.createElement('div');
        img_buttons.classList.add('output-image-buttons');
        var view_button = document.createElement('div');
        view_button.classList.add('output-image-view-button', 'center-items');
        view_button.innerHTML = 'View';
        view_button.setAttribute('value', src);
        var overlay_button = document.createElement('div');
        overlay_button.classList.add('output-image-overlay-button', 'center-items');
        overlay_button.innerHTML = 'Overlay';
        overlay_button.setAttribute('value', src);
        img_buttons.append(view_button);
        img_buttons.append(overlay_button);

        img_panel.append(img_buttons);
        item.append(img_panel);

        return item;
    }

    var output_content = document.getElementById('response-list');
    output_content.innerHTML = '';

    var output_img_list = document.getElementById('output-image-list');
    output_img_list.innerHTML = '';

    if (resp !== null) {
        if (typeof resp === 'object') {
            for (var i = 0; i < resp.length; i++) {
                var row_data = resp[i];
                var element = createOutputElement(row_data);
                output_content.append(element);

                // update output image
                for (var key in row_data.outputs) {
                    var output_data = row_data.outputs[key];
                    if (output_data.datatype === 'base64-image'
                        || output_data.datatype === 'image') {
                        var img_div = createOutputImage(
                            output_data.value,
                            row_data.node + ': ' + output_data.name
                        );
                        output_img_list.append(img_div);
                    }
                }
            }
        } else {
            var element = document.createElement('textarea');
            element.value = resp;
            element.readOnly = true;
            output_content.append(element);
        }
    }
}

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

function idString(n_digits) {
    return strWithLeadingZeros(randInt(0, Math.pow(10, n_digits)), n_digits);
}

function Node(op, params, outputs, position, node_props, box_props) {
    this.params = [];
    this.outputs = [];
    this.op_name = op;            // to identify op on server
    var rand_id = idString(config.ID_NDIGITS);
    this.node_id = op + '-' + rand_id; // to uniquely identify node
    this.display_name = this.node_id;  // modifiable name for user

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
            port._value = graph.valid_ops[this.op_name].params[i].defaults;
            port.set_value = function(val, datatype) {
                this._value = val;

                if (typeof datatype === 'string') {
                    this.datatype = datatype;
                } else if (typeof val === 'undefined') {
                    this.datatype = 'undefined';
                } else if (val instanceof Conduit) {
                    this.datatype = 'Conduit';
                } else {
                    this.datatype = 'literal';
                }
            };
            port.get_value = function() {
                return this._value;
            }
            port.datatype = 'undefined';

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

    this.select = function() {
        this.box.fillColor = config.BOX_DEFAULTS.selectedFillColor;
    }

    this.deselect = function() {
        this.box.fillColor = config.BOX_DEFAULTS.fillColor;
    }

    this.delete = function() {
        // remove all ports and their conduits and paper paths
        for (var i = 0; i < this.params.length; i++) {
            var param = this.params[i];
            if (param.get_value() instanceof Conduit) {
                param.get_value().delete();
            }
            param.set_value(undefined);
            param.children[0].remove();
        }
        this.params = [];
        for (var i = 0; i < this.outputs.length; i++) {
            var output = this.outputs[i];
            if (output.get_value() instanceof Conduit) {
                output.get_value().delete();
            }
            output.set_value(undefined);
            output.children[0].remove();
        }
        this.outputs = [];

        // remove own group
        this.group.remove();
        this.group = undefined;

        // remove from node list
        removeNodeFromList(this);

        // remove self from graph.nodes
        delete graph.nodes[this.node_id];
    }

    // create element in node list
    addNodeToList(this);

    // create box for node base
    var n_ports = params.length > outputs.length ? params.length : outputs.length;
    var sp = node_props.port_spacing;
    var r = node_props.port_radius;
    var box_w = box_props.width;
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
    this.box = box;

    // create display name object
    var t_off = node_props.text_offset;
    var text_position = [position[0] + t_off[0], position[1] + t_off[1]];
    var disp_name_path = new PointText({
        point: text_position,
        content: this.display_name  
    });
    assignProperties(disp_name_path, config.NODE_NAME_DEFAULTS);

    // create group for all items
    this.group = new Group([box, disp_name_path]);
    this.group.node = this;
    this.group.obj_type = "node";

    // create ports for params and outputs
    this.createPorts(params, "param", config.PARAM_DEFAULTS);
    this.createPorts(outputs, "output", config.OUTPUT_DEFAULTS);

    // add to graph object
    graph.nodes[this.node_id] = this;

    return this;
}

function Conduit(props, output, param) {
    var rand_id = idString(config.ID_NDIGITS);
    this.conduit_id = 'conduit-' + rand_id; // to uniquely identify conduit
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
            this.param.set_value(undefined);
        }
        if (this.output) {
            this.output.set_value(undefined);
        }
        this.param = undefined;
        this.output = undefined;
        this.line.remove();
        this.line = undefined;

        // remove self from graph.conduits
        delete graph.conduits[this.conduit_id];
    }

    // add references to link conduit and output
    output.set_value(this);
    this.output = output;

    // add references to link conduit and param, if given
    if (typeof param !== 'undefined') {
        param.set_value(this);
        this.param = param;
    } else {
        this.param = undefined;
    }

    // add to graph object
    graph.conduits[this.conduit_id] = this;

    return this;
}

// event handlers
var draggingNodeBox = undefined;
var drawingConduit = undefined;
var lastClickTime = Date.now();
function onMouseDown(event) {
    var hit_result = project.hitTest(event.point, config.HIT_OPTIONS);
    if (Date.now() - lastClickTime < config.DBLCLICK_DELTA) {
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
                if (typeof item.parent.get_value() !== 'undefined') {
                    item.parent.get_value().delete();
                }

                // // create conduit
                drawingConduit = new Conduit(config.CONDUIT_PROPS, item.parent);
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
            if (!child.obj_type || !child.get_value()) {
                continue;
            }

            if (child.obj_type == "param") {
                child.get_value().line.segments[1].point = child.position;
            } else if (child.obj_type == "output") {
                child.get_value().line.segments[0].point = child.position;
            }
        }
    } else if (drawingConduit) {
        // move conduit endpoint
        drawingConduit.line.segments[1].point = event.point;
    }
}

function onMouseUp(event) {
    // set click time
    lastClickTime = Date.now();

    if (drawingConduit) {    
        var hit_result = project.hitTest(event.point, config.HIT_OPTIONS);
        if (
            hit_result.item
            && hit_result.item.parent.obj_type == "param"
            && hit_result.item.parent.parent !== drawingConduit.output.parent
        ) {
            var item = hit_result.item;

            // remove existing conduit and references if present
            if (item.parent.get_value()) {
                item.parent.get_value().delete();
            }

            // move line endpoint to item position
            drawingConduit.line.segments[1].point = item.position;

            // add reference to param as property of conduit
            drawingConduit.param = item.parent;

            // add reference to conduit as property of param
            item.parent.set_value(drawingConduit);
        } else {
            drawingConduit.delete();
        }
    }

    if (draggingNodeBox) {
        graph.selectNodes([draggingNodeBox.node]);
    } else {
        graph.selectNodes();
    }

    drawingConduit = undefined;
    draggingNodeBox = undefined;
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

        if (port.get_value() instanceof Conduit) {
            if (port.obj_type == "param") {
                var value = port.get_value().output.node.display_name;
            } else {
                var value = port.get_value().param.node.display_name;
            }
            var disabled = true;
        } else {
            var value = port.get_value();
            var disabled = false;
        }
        input_field.value = value;
        input_field.disabled = disabled;

        input_field.onchange = function() {
            port.set_value(this.value);
        }

        input_field.ondragover = function(event) {
            event.preventDefault();

            if (!this.disabled) {
                this.classList.add("drag-over");
            }
        }
        input_field.ondragleave = function(event) {
            event.preventDefault();
            this.classList.remove("drag-over");
        }
        input_field.ondrop = function(event) {
            event.preventDefault();
            this.classList.remove("drag-over");

            if (!this.disabled) {
                var idx = event.dataTransfer.getData("idx");
                this.value = images[idx]['uri'];
                port.set_value(images[idx]['uri'], 'image');
            }
        }

        item.append(input_field);
    } else if (port.obj_type == "output") {

    }

    return item;
}

function toggleNodeMenu(node) {
    // hide any visible menu within div
    $("#node-info").addClass("hidden");

    if (typeof node !== 'undefined') {
        // update title and description
        $("#node-title").text(node.display_name);
        var op_data = graph.valid_ops[node.op_name];
        $("#node-description").text(op_data.docstring);

        // update params
        var param_list = document.getElementById("param-list");
        param_list.innerHTML = "";
        for (var i = 0; i < node.params.length; i++) {
            var param = node.params[i];
            var newport = createPortItem(
                param, 
                op_data.params[i].name
            );
            param_list.append(newport);
        }

        // update outputs
        var output_list = document.getElementById("output-list");
        output_list.innerHTML = "";
        for (var i = 0; i < node.outputs.length; i++) {
            var output = node.outputs[i];
            var newport = createPortItem(
                output, 
                op_data.outputs[i].name
            );
            output_list.append(newport);
        }

        // show menu
        $("#node-info").removeClass("hidden");
    }
}

// add click handler to dropdown menu
$('#sidebar').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        var dropdown;
        if ($(event.target).hasClass('dropdown-option')) {
            dropdown = event.target;
        } else if ($(event.target).parents('.dropdown-option')[0]) {
            dropdown = $(event.target).parents('.dropdown-option')[0];
        } else {
            return;
        }
        var idx = dropdown.id.split('-').end();

        $('#sidebar').children().removeClass('selected');
        $(dropdown).addClass('selected');
        $('#menu').children('.option-menu').addClass('inactive');
        $('#options-'+idx).removeClass('inactive');
    }
})

function openTab(num) {
    if (typeof num !== 'string') {
        num = num.toString();
    }

    // style tab
    $('#tabs').children().removeClass('selected');
    $('#tab-' + num).addClass('selected');

    // activate content div
    $('#content').children().addClass('inactive');
    $('#content-' + num).removeClass('inactive');

    // activate side menu div
    $('#side-menu').children().addClass('inactive');
    $('#info-menu-' + num).removeClass('inactive');
}

// add click handler to viewer tabs
$('#tabs').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        if (event.target.id == 'tab-1') {
            openTab('1');
        } else if (event.target.id == 'tab-2') {
            openTab('2');
        } else if (event.target.id == 'tab-3') {
            openTab('3');
        }
    }
})

$('#run-button').click(function(event) {
    graph.run();
})

// add click handler to options menu
$('#operations-list').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget 
        && $(event.target).hasClass('folder-item')) {
        event.stopPropagation();

        // create node based on name
        var op = $(event.target)[0].value;
        newNode(op, [300, 300]);
    }
});

// add click handler to file list 
$('#file-list').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        event.stopPropagation();
        $('#file-list').children().removeClass('selected');
        if ($(event.target).hasClass('file-item')) {
            $(event.target).addClass('selected');

            var idx = event.target.id.split('-').end();
        } else {
            var parent = $(event.target)[0].parentElement
            $(parent).addClass('selected');
            var idx = $(parent)[0].id.split('-').end();
        }
        var route = images[idx]['route'];
        img_viewer.open(route);
    }
})

function newNode(key, position) {
    var obj = graph.valid_ops[key];
    return new Node(
        key, 
        obj.params, 
        obj.outputs,
        position, 
        config.NODE_DEFAULTS, 
        config.BOX_DEFAULTS
    );
}

function addNodeToList(node) {
    var ops_menu = $("#node-list");

    // create folder element
    var node_item = document.createElement("div");
    node_item.id = node.node_id;
    node_item.classList.add("node-item");
    node_item.onclick = function(event) {
        event.preventDefault();

        // select node in canvas
        if (event.target !== event.currentTarget) {
            event.stopPropagation();

            graph.selectNodes(graph.nodes[this.id]);
        }
    }

    // create folder label element
    var node_label = document.createElement("div");
    node_label.innerHTML = node.node_id;
    node_label.classList.add("label");

    node_item.append(node_label)
    ops_menu.append(node_item);
}

function removeNodeFromList(node) {
    var element = document.getElementById(node.node_id);
    element.parentNode.removeChild(element);
}

function populateOperationsMenu() {
    $.ajax({
        type: 'GET',
        url: '/available-operations',
        async: true,
        success: function(obj) {
            
            var ops_menu = $("#operations-list");

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
                folder.id = folder_id_root + cat.replace('.', '_');
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
                var folder_id = "#" + folder_id_root 
                                + obj[key].category.replace('.', '_');
                $(folder_id).append(newitem);
            }
        }
    });
}

function createFileItem(id, img_name) {
    /* 
        Create file item with following structure:

        <div id=id class="file-item">
          <img />
          <span>img_name</span>
        </div>
    */

    var item = document.createElement('div');
    item.classList.add('file-item');
    item.id = id;
    item.draggable = true;
    item.ondragstart = function(event) {
        var idx = event.currentTarget.id.split('-').end();
        event.dataTransfer.setData("idx", idx);
    }

    var img = document.createElement('img');
    item.append(img);

    var label = document.createElement('div');
    label.classList.add('label');
    label.innerHTML = img_name;
    item.append(label)

    return item;
}

var images;
function setFolder(folder) {
    var formdata = {
      'folder': folder
    };

    $.ajax({
        type: 'POST',
        url: '/set-folder',
        async: true,
        data: formdata,
        success: function(obj) {
            images = obj;
            var file_list = document.getElementById('file-list');
            file_list.innerHTML = '';
            for (var i = 0; i < images.length; i++) {
                var image = images[i];
                var id = 'file-' + i.toString();

                // rewrite file list
                var file_item = createFileItem(id, image['filename']);
                file_list.append(file_item);

                // get thumbnail urls
                $.ajax({
                    type: 'POST',
                    url: '/get-thumbnail',
                    async: true,
                    data: {'uri': images[i].uri},
                    success_data: {
                        'image': image,
                        'id': id
                    },
                    success: function(thumbnail) {
                        this.success_data['image'].thumbnail = thumbnail;
                        var img_el = $('#'+this.success_data['id']).children('img')[0];
                        $(img_el).attr('src', thumbnail);
                    }
                })
            }
        }
    });
}

function initOpenSeadragon(id) {
    viewer = OpenSeadragon({
        id: id,
        prefixUrl: 'static/js/openseadragon/images/',
        tileSources: {
            type: 'image',
            url:  'static/images/no-image-available.png',
            buildPyramid: false
        },
        maxZoomLevel: 5
    });

    // add the scalebar
    // viewer.scalebar({
    //     type: OpenSeadragon.ScalebarType.MICROSCOPE,
    //     minWidth:'150px',
    //     pixelsPerMeter: config.defaultPixelsPerMeter,
    //     pixelsPerMeter: 25000000,
    //     color:'black',
    //     fontColor:'black',
    //     backgroundColor:"rgba(255,255,255,0.5)",
    //     barThickness:4,
    //     location: OpenSeadragon.ScalebarLocation.TOP_RIGHT,
    //     xOffset:5,
    //     yOffset:5
    // });

    viewer._open = viewer.open;
    viewer.open = function(url) {
        this._open({
            type: 'image',
            url:  url,
            buildPyramid: false
        });
    }

    return viewer;
};

$('#output-image-list').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        if ($(event.target).hasClass('output-image-view-button')) {
            img_viewer.open(event.target.getAttribute('value'));
        } else if ($(event.target).hasClass('output-image-overlay-button')) {
            var overlay_src = event.target.getAttribute('value');

            viewer.removeOverlay('overlay');

            var overlay = document.createElement('img');
            overlay.id = 'output-overlay';
            overlay.src = overlay_src;
            overlay.style = 'opacity: 0.5;';
            viewer.addOverlay({
                element: overlay, 
                location: new OpenSeadragon.Rect(0.0, 0.0, 1.0, 1.0)
            });
        }
    }
})

var folder_id_root = 'folder-';
var config;
var img_viewer;
$(document).ready(function() {
    // initial config
    $.when(
        $.ajax({
            type: 'GET',
            url: '/get-config',
            async: true,
            success: function(obj) {
                return obj;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
            }
        })
    ).then(function(data, textStatus, jqXHR) {
        config = data;

        // set folder
        document.getElementById('active-folder').value = config.FILE_DIR;
        setFolder(config.FILE_DIR);

        populateOperationsMenu();

        // set event listener for active folder input
        var active_folder = document.getElementById('active-folder');
        active_folder.addEventListener('focusout', function() {
            setFolder(active_folder.value);
        })

        openTab(config.DEFAULT_TAB);

        // initialize image viewer
        img_viewer = initOpenSeadragon('osd-image-viewer-1');
    });
});
