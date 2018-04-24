# HistoToolkit

A graphical user interface for prototyping histology and cytology image processing workflows.

### To-do
* Display display_name of nodes
* Add node destructor for client
* Retrieve list of available ops from server at page load
* Assign param and output names to client side
* prevent loops from being formed in net (server-side for security and client-side for user-friendliness)

#### Notes
* Launch server
```
python run.py
```

* Run scripts in app/test as __main__:
```
python -m app.test.test_script
```
