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
                // var img_url = 'data:image/png;base64,'+response.end().outputs.data.value;
                // $('#test-output-img').attr('src', img_url);
                populateOutputTab(response);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("ERROR: " + textStatus + " " + errorThrown);
            }
        });
    }
};

function populateOutputTab(obj) {
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

            var value = document.createElement('div');
            value.classList.add('value');
            value.innerHTML = out_obj.value;
            output.append(value);

            item_data.append(output);
        }
        item.append(item_data);

        return item;
    }

    var output_content = document.getElementById('content-3');
    output_content.innerHTML = '';
    for (var i = 0; i < obj.length; i++) {
        var row_data = obj[i];
        var element = createOutputElement(row_data);
        console.log(element);
        output_content.append(element);
    }
}

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
            port._value = undefined;
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
        for (var i = 0; i < graph.conduits.length; i++) {
            var conduit = graph.conduits[i];
            if (this === conduit) {
                graph.conduits.splice(i, 1);
            }
        }
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
                if (typeof item.parent.get_value() !== 'undefined') {
                    item.parent.get_value().delete();
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

    toggleNodeMenu(draggingNodeBox);

    drawingConduit = undefined;
    draggingNodeBox = undefined;
}

function toggleOptionsMenu() {
    var button = $("#button-1");
    var dropdown_menu = $("#dropdown-menu");
    if (button.hasClass("di-selected")) {
        button.removeClass("di-selected");

        dropdown_menu.addClass("inactive");
    } else {
        button.addClass("di-selected");

        dropdown_menu.removeClass("inactive");
    }
}

// add click handler to dropdown icon
$('#button-1').click(toggleOptionsMenu);

// add click handler to dropdown menu
$('#dropdown-menu').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        var options = $('#options');
        if ($(event.target).hasClass('dropdown-item')) {
            var idx = event.target.id.split('-').end();
            $(options).children('.option-menu').addClass('inactive');
            
            $('#options-'+idx).removeClass('inactive');
        }
        toggleOptionsMenu();
    }
})

function openTab(num) {
    if (typeof num !== 'string') {
        num = num.toString();
    }

    $('#tabs').children().removeClass('selected');
    $('#tab-' + num).addClass('selected');

    $(content).children().addClass('inactive');
    $('#content-' + num).removeClass('inactive');
}

// add click handler to viewer tabs
$('#tabs').click(function(event) {
    event.preventDefault();

    if (event.target !== event.currentTarget) {
        var content = document.getElementById('content');

        if (event.target.id == 'tab-1') {
            openTab('1');
        } else if (event.target.id == 'tab-2') {
            openTab('2');
        } else if (event.target.id == 'tab-3') {
            openTab('3');
        } else if (event.target.id == "tab-4") {
            openTab('4');
        } else if (event.target.id == 'tab-5') {
            graph.run();
        }
    }
})

// add click handler to options menu
$('#options-1').click(function(event) {
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
        console.log(route);
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
        node_defaults, 
        box_defaults
    );
}

function populateOperationsMenu() {
    $.ajax({
        type: 'GET',
        url: '/available-operations',
        async: true,
        success: function(obj) {
            
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
    });

    populateOperationsMenu();

    // set event listener for active folder input
    var active_folder = document.getElementById('active-folder');
    active_folder.addEventListener('focusout', function() {
        setFolder(active_folder.value);
    })

    openTab('1');

    // initialize image viewer
    img_viewer = initOpenSeadragon('osd-image-viewer-1');
});
