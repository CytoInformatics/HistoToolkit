from ..tools import opnet

def basic_add(arg1, arg2):
    return (arg1 + arg2, 'correct!')

def basic_square(arg1):
    return arg1 ** 2

def display_num_and_message(num, msg):
    return "{0} {1}".format(num, msg)

# test manually adding conduit
print("\nValue of conduit changes after execute()")
mynet1 = opnet.OpNet()
node1 = mynet1.add_node(basic_add, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
node2 = mynet1.add_node(basic_square, {'arg1': None}, ['pow'])
conduit1 = mynet1.bind(node1, 'sum', node2, 'arg1')

print("conduit1 value: {0}".format(conduit1.value))
print("node1.execute(): {0}".format(node1.execute()))
print("conduit1 value: {0}".format(conduit1.value))
print("node1.execute(): {0}".format(node2.execute()))
print("# nodes: {0}".format(len(mynet1.nodes)))
print("# conduits: {0}".format(len(mynet1.conduits)))

# test more complex series of operations
print("\nExample of more complicated net")
mynet2 = opnet.OpNet()
node1 = mynet2.add_node(basic_add, {'arg2': 4, 'arg1': 3}, ['sum', 'is???'])
node2 = mynet2.add_node(basic_square, {'arg1': None}, ['pow'])
node3 = mynet2.add_node(display_num_and_message, {'num': None, 'msg': None}, ['out'])
conduit1 = mynet2.bind(node1, 'sum', node2, 'arg1')
conduit2 = mynet2.bind(node1, 'is???', node3, 'msg')
conduit3 = mynet2.bind(node2, 'pow', node3, 'num')

print(node1.execute())
print(node2.execute())
print(node3.execute())
print(conduit1.value)
print(conduit2.value)
print(conduit3.value)
print("# nodes: {0}".format(len(mynet2.nodes)))
print("# conduits: {0}".format(len(mynet2.conduits)))