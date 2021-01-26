import os
import hashlib
import base64
import random
import string
import warnings
from collections import Counter

import numpy as np
import cv2 as cv
from imageio.core.util import Image
from imageio import imread, imwrite, get_reader

from . import opnet


TEMP_B64 = '/tmp/.hydrogentk.b64img'
IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp',)
THUMBNAIL_SETTINGS = {
    'dims': (300, 300),
    'crop_mode': 'top-left'
}

def list_files(loc, return_dirs=False, return_files=True, recursive=False, valid_exts=None):
    """
    Return a list of all filenames within a directory loc.
    Inputs:
        loc - Path to directory to list files from.
        return_dirs - If true, returns directory names in loc. (default: False)
        return_files - If true, returns filenames in loc. (default: True)
        recursive - If true, searches directories recursively. (default: False)
        valid_exts - If a list, only returns files with extensions in list. If None,
            does nothing. (default: None)
    Outputs:
        files - List of names of all files and/or directories in loc.
    """
    
    files = [os.path.join(loc, x) for x in os.listdir(loc)]

    if return_dirs or recursive:
        # check if file is directory and add it to output if so
        is_dir = [os.path.isdir(x) for x in files]
        found_dirs = [files[x] for x in range(len(files)) if os.path.is_dir[x]]
    else:
        found_dirs = []

    if return_files:
        # check if file is not directory and add it to output
        is_file = [os.path.isfile(x) for x in files]
        found_files = [files[x] for x in range(len(files)) if is_file[x]]
    else:
        found_files = []

    if recursive and not return_dirs:
        new_dirs = []
    else:
        new_dirs = found_dirs

    deeper_files = []
    if recursive:
        for d in found_dirs:
            deeper_files.extend(list_files(d, return_dirs=return_dirs, 
                return_files=return_files, recursive=recursive))

    if isinstance(valid_exts, (list, tuple)):
        concat_files = found_files + deeper_files
        new_files = []
        for e in valid_exts:
            new_files.extend([f for f in concat_files if f.endswith(e)])
    else:
        new_files = found_files + deeper_files

    return new_dirs + new_files

def hash_str(my_str):
    return hashlib.md5(my_str.encode('utf-8')).hexdigest()

def random_str(n):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def hash_file(uri):
    """
    Create a hash string for the file stored at uri.
    """

    file_str = uri + str(os.path.getmtime(uri))
    hashval = hash_str(file_str)
    return hashval

def list_all_images(folder):
    """
    Return list of all files in FOLDER with extensions in VALID_EXTS.
    """

    return list_files(folder, valid_exts=IMAGE_EXTS)

def get_image_info(uri):
    """
    Return dict containing info for image stored at URI.
    """

    image_info = {
        'uri': uri,
        'filename': os.path.basename(uri)
    }

    return image_info

def create_thumbnail(img_uri, thumb_uri):
    """
    Create thumbnail for image at IMG_URI and save as THUMB_URI.
    """

    img = imread(img_uri)

    if THUMBNAIL_SETTINGS['crop_mode'] == 'top-left':
        min_dim = min(img.shape[0:2])
        img_trim = img[:min_dim, :min_dim]
        thumbnail = cv.resize(img_trim, THUMBNAIL_SETTINGS['dims'])
    else:
        min_dim = min(img.shape[0:2])
        img_trim = img[:min_dim, :min_dim]
        thumbnail = cv.resize(img_trim, THUMBNAIL_SETTINGS['dims'])

    # discard alpha channel
    if len(img.shape) > 2 and img.shape[2] > 3:
        thumbnail = thumbnail[:, :, 0:3]

    imwrite(thumb_uri, thumbnail)
    return True

def count_file_types(img_names):
    """
    Return Counter object for all image file types in IMG_NAMES.
    """

    all_exts = []
    for f in img_names:
        _, f_ext = os.path.splitext(f)
        all_exts.append(f_ext)

    counts = Counter(all_exts)
    counts = dict((key, value) for (key, value) in counts.items())
    return counts

def count_data_types(img_names):
    """
    Return Counter object for all image data types in IMG_NAMES.
    """

    all_dtypes = []
    for f in img_names:
        d = imread(f).dtype
        all_dtypes.append(d)

    counts = Counter(all_dtypes)
    counts = dict((key.name, value) for (key, value) in counts.items())
    return counts

def get_image_shapes(img_names):
    """
    Return shape of all image files in IMG_NAMES.
    """

    all_shapes = []
    for f in img_names:
        img = imread(f)
        all_shapes.append(img.shape)

    return all_shapes

def load_image(name):
    """
    Load image from uri NAME.
    """
    
    return imread(name)

def save_image(name, img):
    """
    Save IMG to uri NAME.
    """

    name = os.path.splitext(name)[0]
    return imwrite(name, img, format='PNG', compress_level=0)

def get_metadata(name, mode="i"):
    """
    Return metadata for image at uri NAME.
    """

    reader = get_reader(name, mode=mode)
    metadata = reader.get_meta_data()
    reader.close()
    return metadata

def json_sanitize(val, base64_images=False):
    """
    Convert VAL to a type that is serializable using jsonify.
    """

    if isinstance(val, Image) or isinstance(val, np.ndarray):
        if base64_images:
            datatype = 'base64-image'
            save_image(TEMP_B64, val)
            with open(TEMP_B64, 'rb') as f:
                newval = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')
        else:
            datatype = 'image'
            code = random_str(6)
            img_path = os.path.join('./app/static/temp/', code)
            save_image(img_path, val)
            newval = os.path.join('/static/temp/', code)
    elif isinstance(val, np.generic):
        datatype = 'literal'
        newval = val.item()
    else:
        datatype = 'literal'
        newval = val

    return newval, datatype

