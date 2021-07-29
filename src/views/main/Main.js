import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  Text,
  ActivityIndicator,
} from 'react-native';

import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
  convertImageToTensor
} from '../../helpers/tensor-helper';
import { cropPicture } from '../../helpers/image-helper';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';

// const RESULT_MAPPING = ['Triangle', 'Circle', 'Square'];
const RESULT_MAPPING = ['Helmet', 'NoHelmet'];

const Main = () => {
  const cameraRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentedShape, setPresentedShape] = useState('Waiting');
  const [model, setModel] = useState(null);
  const [isGot, setIsGot] = useState(false);

  useEffect(() => {
    // var interval = null;
    if (!isGot) {
      getModelFirst();
    } 
    else {
      if (!isProcessing) {
        const interval = setInterval(() => {
          handleImageCapture();
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [isGot, isProcessing, presentedShape]);

  const getModelFirst = async () => {
    await tf.ready();
    console.log('Start getModel!');
    var result = await getModel();
    console.log(result);
    setModel(result);
    setIsGot(true);
  };

  const handleImageCapture = async () => {
    console.log(isProcessing);
    if (!isProcessing) {
      console.log('Start running!');
      setIsProcessing(true);
      const imageData = await cameraRef.current.takePictureAsync({
        base64: true,
      });
      // console.log(imageData)
      processImagePrediction(imageData);
    }
  };

  const processImagePrediction = async (base64Image) => {
    console.log('Start Prediction!');
    const croppedData = await cropPicture(base64Image, 300);
    // console.log(croppedData);
    console.log('Finish cropPicture!');
    const tensor = await convertBase64ToTensor(croppedData.base64);
    // console.log(tensor);
    console.log('Finish generate tensor!');
    const prediction = await startPrediction(model, tensor);
    console.log('Finish generate prediction!');
    // console.log(prediction);

    let highestPrediction = mode(prediction);
    console.log('Finish generate highestPrediction!');
    console.log(highestPrediction);

    if (highestPrediction > 0) {
      setPresentedShape(RESULT_MAPPING[highestPrediction - 1]);
    } else {
      setPresentedShape('Cannot Found');
    }
    setIsProcessing(false);
  };

  const mode = (obj) => {
    const { boxes, classes, scores } = obj;
    for (let i = 0; i <= boxes.length; i++) {
      if (boxes[i] && classes[i] && scores[i] >= 0.8) {
        return classes[i];
      }
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <Modal visible={true} transparent={true} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            {isProcessing ? <ActivityIndicator /> : <Text style={{ color: "white" }}>{presentedShape}</Text>}
            {/* <Pressable
              style={styles.dismissButton}
              onPress={() => {
                setPresentedShape('');
                setIsProcessing(false);
              }}>
              <Text>Dismiss</Text>
            </Pressable> */}
          </View>
        </View>
      </Modal>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.front}
        autoFocus={true}
        whiteBalance={Camera.Constants.WhiteBalance.auto}></Camera>
      <Pressable
        // onPress={() => handleImageCapture()}
        style={styles.captureButton}></Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  captureButton: {
    position: 'absolute',
    left: Dimensions.get('screen').width / 2 - 50,
    bottom: 40,
    width: 100,
    zIndex: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
  },
  modal: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'gray',
  },
  dismissButton: {
    width: 150,
    height: 50,
    marginTop: 60,
    borderRadius: 24,
    color: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red',
  },
});

export default Main;
