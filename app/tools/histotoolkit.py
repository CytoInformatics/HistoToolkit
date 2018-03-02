import os
from collections import Counter
from .PythonHelpers.file_utils import list_files

def count_data_types(data, folder):
    all_files = list_files(folder)

    all_exts = []
    for f in all_files:
        _, f_ext = os.path.splitext(f)
        all_exts.append(f_ext)

    counts = Counter(all_exts)

    return counts


# TESTING ONLY
def test_mult(data, arg1):
    return {'data': data * arg1}

def test_power(data, arg1):
    return {'data': data**arg1}