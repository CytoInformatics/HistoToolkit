# HistoToolkit

A graphical user interface for prototyping histology and cytology image processing workflows.

### To-do
* Update jsonify with useful values for node
* Implement /run-graph route
* Attach event to collapse folders in menu
* Prevent loops from being formed in net (server-side for security and client-side for user-friendliness)
* Create file menu to swap with operations menu
* Make help message for each operation (based on docstring?)

#### Notes
* Launch server
```
python run.py
```

* Run scripts in app/test as __main__:
```
python -m app.test.test_script
```
