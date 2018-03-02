import os
from collections import Counter
from .PythonHelpers.file_utils import list_files

VALID_EXTS = ('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp',)

def list_all_images(folder):
    all_images = list_files(folder, valid_exts=VALID_EXTS)
    return all_images

def count_data_types(data, folder):
    all_files = list_all_images(folder)

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