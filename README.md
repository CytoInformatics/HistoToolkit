# HistoToolkit

A graphical user interface for prototyping histology and cytology image processing workflows.

### To-do
* Implement /run-graph route
* Change "op_id" property to "node_id" for clarity
* Attach event to collapse folders in menu
* Prevent loops from being formed in net (server-side for security and client-side for user-friendliness)
* Create file menu to swap with operations menu
* Make help message for each operation (based on docstring?)
* Add node info in float-menu (op_name, op_id, display_name, docstring, param & output names)
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
