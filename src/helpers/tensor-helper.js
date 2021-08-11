import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {
  bundleResourceIO,
  decodeJpeg,
  asyncStorageIO,
} from '@tensorflow/tfjs-react-native';
import {Base64Binary} from '../utils/utils';
const BITMAP_DIMENSION = 224;

const modelJson = require('../model/model.json');
// const modelWeights = require('../model/weights.bin');
const modelWeights = require('../model/group1-shard.bin');

// 0: channel from JPEG-encoded image
// 1: gray scale
// 3: RGB image
const TENSORFLOW_CHANNEL = 3;

export const getModel = async () => {
  try {
    // load the trained model from local files
    // const net = await model.save('localstorage://my-model-1');
    // const net = await tf.loadGraphModel(
    //   bundleResourceIO(modelJson, modelWeights),
    // );

    // load the trained model by URL
    const net = await tf.loadGraphModel(
      'https://helmetrolltfod.s3.us-east.cloud-object-storage.appdomain.cloud/model.json',
    );
    console.log('Success getModel!');
    return net;
  } catch (error) {
    console.log('Could not load model', error);
  }
};

export const convertBase64ToTensor = async (base64) => {
  try {
    const uIntArray = Base64Binary.decode(base64);
    // decode a JPEG-encoded image to a 3D Tensor of dtype
    const decodedImage = decodeJpeg(uIntArray, 3);
    // reshape Tensor into a 4D array
    return decodedImage.reshape([
      1,
      BITMAP_DIMENSION,
      BITMAP_DIMENSION,
      TENSORFLOW_CHANNEL,
    ]);
  } catch (error) {
    console.log('Could not convert base64 string to ten sor', error);
  }
};

export const startPrediction = async (model, tensor) => {
  try {
    // predict against the model
    const output = await model.executeAsync(tensor);  //?? Problem: cannot work in the normal app
    // prediction box of picture
    // const boxes = await output[6].array();
    const boxes = output[6].dataSync();
    // prediction catagories
    // const classes = await output[2].array();
    const classes = output[2].dataSync();
    // prediction scores
    // const scores = await output[5].array();
    const scores = output[5].dataSync();

    const obj = {
      boxes: boxes,
      classes: classes,
      scores: scores,
    };
    // return typed array
    return obj;
  } catch (error) {
    console.log('Error predicting from tensor image', error);
  }
};
