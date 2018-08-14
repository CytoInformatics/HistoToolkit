import warnings
import numpy as np
from skimage.transform import resize

def resize_image(data, output_shape):
    """
    Resize DATA to OUTPUT_SHAPE.
    """
    
    data = resize(data, output_shape)
    
    op_output = {
        'data': data
    }
    return op_output

def adjust_brightness(data, b):
    """
    Adjust brightness of DATA by factor B.
    """

    b = float(b)
    if not isinstance(data, np.ndarray):
        raise ValueError('data must be a numpy array')
    if not data.dtype == 'uint8':
        warnings.warn('Type of data is not uint8')
    if b < -255.0 or b > 255.0:
        raise ValueError('b must be in range [-255, 255] (entered: {})'.format(b))

    out_data = np.clip(data + b, 0, 255.0)

    op_output = {
        'data': out_data.astype('uint8')
    }
    return op_output

def adjust_contrast(data, c=20.0):
    """
    Adjust contrast of DATA by contrast factor C.
    """

    c = float(c)
    if not isinstance(data, np.ndarray):
        raise ValueError('data must be a numpy array')
    if not data.dtype == 'uint8':
        warnings.warn('Type of data is not uint8')
    if c < -255.0 or c > 255.0:
        raise ValueError('c must be in range [-255, 255] (entered: {})'.format(c))

    correction = (259.0 * (c + 255.0)) / (255.0 * (259.0 - c))
    out_data = np.clip(correction * (data - 128.0) + 128.0, 0, 255.0)

    op_output = {
        'data': out_data.astype('uint8')
    }
    return op_output
