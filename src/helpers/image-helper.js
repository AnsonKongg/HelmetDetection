import {Dimensions} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

// got the dimension from the trained data of the *Teachable Machine*; pixel resolution conversion (8x)
export const BITMAP_DIMENSION = 224;

export const cropPicture = async (imageData) => {
  try {
    const {uri, width, height} = imageData;
    const actions = [
      {
        resize: {
          width: BITMAP_DIMENSION,
          height: BITMAP_DIMENSION,
        },
      },
    ];
    const saveOptions = {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    };
    return await ImageManipulator.manipulateAsync(uri, actions, saveOptions);
  } catch (error) {
    console.log('Could not crop & resize photo', error);
  }
};
