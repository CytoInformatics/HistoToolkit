import os
import numpy as np
from collections import Counter
from imageio import imread
from .PythonHelpers.file_utils import list_files

VALID_EXTS = ('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp',)

def list_all_images(folder):
    """
    Return list of all files in FOLDER with extensions in VALID_EXTS.
    """

    all_images = list_files(folder, valid_exts=VALID_EXTS)
    return all_images

def load_image(name):
    return imread(name)

def count_file_types(data, folder):
    """
    Return Counter object for all image file types in FOLDER.
    """

    all_files = list_all_images(folder)

    all_exts = []
    for f in all_files:
        _, f_ext = os.path.splitext(f)
        all_exts.append(f_ext)

    counts = Counter(all_exts)
    counts = dict((key.name, value) for (key, value) in counts.items())
    return counts

def count_data_types(data, folder):
    """
    Return Counter object for all image data types in FOLDER.
    """

    all_files = list_all_images(folder)

    all_dtypes = []
    for f in all_files:
        d = imread(f).dtype
        all_dtypes.append(d)

    counts = Counter(all_dtypes)
    counts = dict((key.name, value) for (key, value) in counts.items())
    return counts

def rescale_range(data, out_min, out_max):
    """
    Rescale DATA to between OUT_MIN and OUT_MAX.
    """

    in_dtype = data.dtype
    if out_min is None:
        try:
            out_min = np.iinfo(in_dtype).min
        except ValueError:
            try:
                out_min = np.finfo(in_dtype).min
            except ValueError:
                out_min = 0
        else:
            out_min = 0

    if out_max is None:
        try:
            out_max = np.iinfo(in_dtype).max
        except ValueError:
            try:
                out_max = np.finfo(in_dtype).max
            except ValueError:
                out_max = 0
        else:
            out_max = 0

    in_range = data.max() - data.min()
    out_range = out_max - out_min
    data = (out_range / in_range) * (data - data.min()) + out_min
    data = data.astype(in_dtype)

    op_output = {
        'data': data, 
        'out_min': data.min(), 
        'out_max': data.max()
    }
    return op_output

def convert_data_type(data, datatype):
    return data.astype(datatype)


# TESTING ONLY
def test_mult(data, arg1):
    return {'data': data * arg1}

def test_power(data, arg1):
    return {'data': data**arg1}