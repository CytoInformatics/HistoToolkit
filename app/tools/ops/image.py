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
