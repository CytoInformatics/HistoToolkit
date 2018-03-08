from ..tools import opnet

def basicAdd(arg1, arg2):
    return (arg1 + arg2, 'correct!')

node = opnet.Node(basicAdd, {'arg1': 3, 'arg2': 4}, ['sum', 'is???'])
print(node)
print(node.execute())