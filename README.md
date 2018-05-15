# HistoToolkit

A graphical user interface for prototyping histology and cytology image processing workflows.

### To-do
##### Essentials
* Decode response from graph run to display outputs in proper places
* Change name of image viewer id to support more than 1

##### Desirables
* Add Nodes list under dropdown menu options
* Shrink large images before sending them to client
* Replace base64 encoding of images with link to static file
* Add default values to operations
* Remove thumbnails that are older than a certain date (1 month maybe?)
* Verify if input is valid (assume string only if enclosed in '' or "")
* Change style of invalid param paths
* Change style of node when selected
* Make delete button (or right-click option?) for nodes instead of double-click to delete
* Prevent Run from being triggered again until response is received
* Attach event to collapse folders in menu
* Prevent loops from being formed in net (server-side for security and client-side for user-friendliness)
* Allow Node constructor to use ordered list for params as input
* Make output names for nodes optional (option to unpack values if possible?)

#### Notes
* Launch server
```
python run.py
```

* Run scripts in app/test as __main__:
```
python -m app.test.test_script
```
