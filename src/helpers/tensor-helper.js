import * as tf from '@tensorflow/tfjs';
import { loadLayersModel } from '@tensorflow/tfjs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
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
    // load the trained model
    const url = {
      model: modelJson,
    };
    // const net = await model.save('localstorage://my-model-1');
    // const net = await tf.loadGraphModel(
    //   bundleResourceIO(modelJson, modelWeights),
    // );

    // const net = await tf.loadGraphModel(
    //   'https://rolltechhelmet.s3.us-east.cloud-object-storage.appdomain.cloud/model.json',
    // );
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
    console.log('Could not convert base64 string to tesor', error);
  }
};

export const startPrediction = async (model, tensor) => {
  try {
    // predict against the model
    const output = await model.executeAsync(tensor);
    const boxes = await output[6].array();//6
    // console.log(boxes)
    const classes = await output[2].array();//3
    // console.log(classes)
    const scores = await output[5].array(); //5
    // console.log(scores)
    const obj = {
      boxes: boxes[0],
      classes: classes[0],
      scores: scores[0],
    };

    // return typed array
    return obj;
  } catch (error) {
    console.log('Error predicting from tensor image', error);
  }
};
