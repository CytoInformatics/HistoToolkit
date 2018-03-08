from ..tools import opnet

def basic_add(arg1, arg2):
    return (arg1 + arg2, 'correct!')

def basic_square(arg1):
    return arg1 ** 2

def display_num_and_message(num, msg):
    return "{0} {1}".format(num, msg)

# test manually adding conduit
# mynet = opnet.OpNet()
# node1 = mynet.add_node(basic_add, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
# node2 = mynet.add_node(basic_square, {'arg1': None}, ['pow'])

# conduit1 = mynet.bind(node1, 'sum', node2, 'arg1')

# print(conduit1.value)
# print(node1.execute())
# print(conduit1.value)
# print(node2.execute())
# print("# nodes: {0}".format(len(mynet.nodes)))

# test more complex series of operations
mynet = opnet.OpNet()
node1 = mynet.add_node(basic_add, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
node2 = mynet.add_node(basic_square, {'arg1': None}, ['pow'])
node3 = mynet.add_node(display_num_and_message, {'num': None, 'msg': None}, ['out'])

conduit1 = mynet.bind(node1, 'sum', node2, 'arg1')
conduit2 = mynet.bind(node1, 'is???', node3, 'msg')
conduit3 = mynet.bind(node2, 'pow', node3, 'num')

print(node1.execute())
print(node2.execute())
print(node3.execute())

print(conduit1.value)
print(conduit2.value)
print(conduit3.value)
print("# nodes: {0}".format(len(mynet.nodes)))