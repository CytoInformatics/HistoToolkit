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

def adjust_contrast(data, c):
    """
    Adjust contrast of DATA by contrast factor C.
    """

    if c < -255.0 or c > 255.0:
        raise ValueError('c must be in range [-255, 255] (entered: {})'.format(c))

    if not data.dtype == 'uint8':
        warnings.warn('Type of data is not uint8.')

    correction = (259.0 * (c + 255.0)) / (255.0 * (259.0 - c))
    out_data = np.clip(correction * (data - 128.0) + 128.0, 0, 255.0)

    op_output = {
        'data': out_data.astype('uint8')
    }
    return op_output