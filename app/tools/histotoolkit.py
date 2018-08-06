import os, hashlib, base64, random, string
import warnings
import numpy as np
from imageio.core.util import Image
from imageio import imread, imwrite, get_reader
from collections import Counter
from horsetools.file_utils import list_files

from . import opnet
from . import ops

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp',)
THUMBNAIL_SETTINGS = {
    'dims': [300, 300],
    'crop_mode': 'top-left'
}

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

    return imwrite(name, img)

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
            save_image('./app/test/tmp.png', val)
            with open('./app/test/tmp.png', 'rb') as f:
                newval = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')
        else:
            datatype = 'image'
            code = random_str(6)
            path = './app/static/temp/' + code + '.png'
            save_image(path, val)
            newval = '/static/temp/' + code + '.png'
    elif isinstance(val, np.generic):
        datatype = 'literal'
        newval = val.item()
    else:
        datatype = 'literal'
        newval = val

    return newval, datatype


op_manager = opnet.OperationsManager([
    [ops.multiply, 'Math', 'data'],
    [ops.convert_data_type, 'Data', 'data'],
    [ops.rescale_range, 'Data', ['data', 'out_min', 'out_max']],
    [ops.resize_image, 'Image', 'data']
])
