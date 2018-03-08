from ..tools import opnet

def basicAdd(arg1, arg2):
    return (arg1 + arg2, 'correct!')

def basicSquare(arg1):
    return arg1 ** 2

node1 = opnet.Node(basicAdd, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
node2 = opnet.Node(basicSquare, {'arg1': None}, ['pow'])

conduit1 = opnet.Bind(node1, 'sum', node2, 'arg1')

print(conduit1.value)
print(node1.execute())
print(conduit1.value)
print(node2.execute())