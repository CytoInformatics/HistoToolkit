from ..tools import opnet

def basicAdd(arg1, arg2):
    return (arg1 + arg2, 'correct!')

node = opnet.Node(basicAdd, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
print(node)
print(node.execute())