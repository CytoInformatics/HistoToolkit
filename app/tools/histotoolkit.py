import os, hashlib
import warnings
import numpy as np
from PIL import Image
from imageio import imread, imwrite, get_reader
from skimage.transform import resize
from collections import Counter
from .PythonHelpers.file_utils import list_files

from . import opnet

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp',)
THUMBNAIL_SETTINGS = {
    'dims': [300, 300],
    'crop_mode': 'top-left'
}

def hash_file(uri):
    """
    Create a hash string for the file stored at uri.
    """

    file_str = uri + str(os.path.getmtime(uri))
    hashval = hashlib.md5(file_str.encode('utf-8')).hexdigest()
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
        thumbnail = resize(img_trim, THUMBNAIL_SETTINGS['dims'])
    else:
        min_dim = min(img.shape[0:2])
        img_trim = img[:min_dim, :min_dim]
        thumbnail = resize(img_trim, THUMBNAIL_SETTINGS['dims'])

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
        img = Image.open(f)
        all_shapes.append(img.size)

    return all_shapes

def load_image(name):
    """
    Load image from uri NAME.
    """
    
    return imread(name)

def get_metadata(name, mode="i"):
    """
    Return metadata for image at uri NAME.
    """

    reader = get_reader(name, mode=mode)
    metadata = reader.get_meta_data()
    reader.close()
    return metadata


# Operations
def multiply(data, scale):
    """
    Multiply DATA by a factor of SCALE.
    """

    return scale * data


def convert_data_type(data, datatype):
    """
    Convert DATA to DATATYPE.
    """

    return data.astype(datatype)

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

def resize_image(data, output_shape):
    """
    Resize DATA to OUTPUT_SHAPE.
    """

    data = resize(data, output_shape, anti_aliasing=True)

    op_output = {
        'data': data
    }
    return op_output


op_manager = opnet.OperationsManager([
    [convert_data_type, "Data", "data"],
    [rescale_range, "Data", "data"],
    [multiply, "Math", "data"],
    [resize_image, "Image", "data"]
])
