from ..tools import opnet

def basicAdd(arg1, arg2):
	return arg1 + arg2

node = opnet.Node(basicAdd, {'arg1': 3, 'arg2': 4}, ['sum'])
print(node)
print(node.execute())