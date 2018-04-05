def op_add(arg1, arg2):
    return arg1 + arg2

def op_mult(arg1, arg2):
    return arg1 * arg2

def op_power(arg1, arg2):
    return arg1 ** arg2

def op_split(arg1, n_outs):
    return [arg1] * n_outs

def op_negate(arg1, negate=True):
    if negate:
        return 0
    else:
        return arg1
