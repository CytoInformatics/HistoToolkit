# CompuToolkit

A graphical user interface for prototyping data and image processing workflows.

## Installation
#### Install horsetools
```
git clone https://github.com/JimBoonie/PythonHelpers.git
cd PythonHelpers
pip install .
```

#### Launch server
```
cd HistoToolkit
python run.py
```

### To-do
##### Essentials
* Redesign interface to make less ugly
* Overlay input-output images option in image viewer
* Split Output tab into images and data sections
* Output tab cycle through output images
* Info panel in image viewer
* Suggested color scheme: #19212D, #252E39, #324170, #8B92A2, #BAC2CE
* Suggested color scheme: #192D2A, #233833, #327070, #8CA2A3, #B9CECB

##### Desirables
* Change style of invalid param paths
* Fix slow response time when processing images (likely due to base64 encoding)
* Change all uses of document methods to JQuery where possible
* Double click node display name to change it
* Shrink large images before sending them to client
* Replace base64 encoding of images with link to static file
* Add default values to operations
* Remove thumbnails that are older than a certain date (1 month maybe?)
* Verify if input is valid (assume string only if enclosed in '' or "")
* Make delete button (or right-click option?) for nodes instead of double-click to delete
* Prevent Run from being triggered again until response is received
* Attach event to collapse folders in menu
* Prevent loops from being formed in net (server-side for security and client-side for user-friendliness)
* Allow Node constructor to use ordered list for params as input
* Make output names for nodes optional (option to unpack values if possible?)

### Notes
* Launch server
```
python run.py
```

* Run scripts in app/test as __main__:
```
python -m app.test.test_script
```
