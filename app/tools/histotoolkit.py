import os
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

def count_data_types(data, folder):
    """
    Return Counter object for all image files in FOLDER.
    """

    all_files = list_all_images(folder)

    all_exts = []
    for f in all_files:
        _, f_ext = os.path.splitext(f)
        all_exts.append(f_ext)

    counts = Counter(all_exts)

    return counts

def rescale_range(data, out_min, out_max):
    """
    Rescale DATA to between OUT_MIN and OUT_MAX.
    """

    in_dtype = data.dtype

    if out_min is None:
        switch = {
            "uint8": 0,
        }
        out_min = switch.get(in_dtype, 0)

    if out_max is None:
        switch = {
            "uint8": 255,
        }
        out_max = switch.get(in_dtype, 1)

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

def convert_data_type():
    pass


# TESTING ONLY
def test_mult(data, arg1):
    return {'data': data * arg1}

def test_power(data, arg1):
    return {'data': data**arg1}