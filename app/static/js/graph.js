box_defaults = {
  strokeColor: 'black',
  fillColor: 'blue',
  strokeWidth: 6,
  point: [200, 200],
  size: [300, 200]
};

cursor_defaults = {
  center: [-100, -100],
  radius: 5,
  fillColor: 'black'
};

function assignProperties(path, properties) {
  for (key in properties) {
    path[key] = properties[key];
  }
}

// create cursor
var cursor = new Path.Circle(cursor_defaults);
cursor.sendToBack();
function onMouseMove(event) {
  cursor.position = event.point;
}

// Create a Paper.js Path to draw a line into it:
var box = new Path.Rectangle(box_defaults);

box.onMouseEnter = function(event) {
  this.previousStrokeColor = this.strokeColor;
  this.strokeColor = 'green';
  cursor.visible = false;
};
box.onMouseLeave = function(event) {
  this.strokeColor = this.previousStrokeColor;
  cursor.visible = true;
};