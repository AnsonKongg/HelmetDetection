import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ImageEditor
} from 'react-native';
import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
  convertImageToTensor
} from '../../helpers/tensor-helper';
import { cropPicture } from '../../helpers/image-helper';
// import { Camera } from 'expo-camera';
import { RNCamera, FaceDetector } from 'react-native-camera';
import RNFS from 'react-native-fs';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

// const TensorCamera = cameraWithTensors(Camera);
const RESULT_MAPPING = ['Helmet', 'NoHelmet'];
const BITMAP_DIMENSION = 224;

const Main = () => {
  const cameraRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentedShape, setPresentedShape] = useState('Fetching Modal');
  const [model, setModel] = useState(null);

  useEffect(() => {
    getModelFirst();
  }, []);

  const getModelFirst = async () => {
    // Wait for tensor flow start
    await tf.ready();
    console.log('Start getModel!');
    // Start fetching Model
    const result = await getModel();
    setModel(result);
    setPresentedShape('Take Photo now!');
  };
  // Take Picture
  const takePicture = async () => {
    if (!!model && !isProcessing) {
      console.log('Start running!')
      setIsProcessing(true);
      // Picture Options
      const options = { 
        // quality: 0.5, 
        base64: true,
      };
      const data = await cameraRef.current.takePictureAsync(options);
      processImagePrediction(data);
    }
  };
  const processImagePrediction = async (base64Image) => {
    // Resize picture
    const croppedData = await cropPicture(base64Image);   //?? If react native can resize picture to 224X224, this step can be remove
    // Convert picture to tensor
    const tensor = await convertBase64ToTensor(croppedData.base64);
    // Use model to predict tensor
    const prediction = await startPrediction(model, tensor);
    // Base on model prediction result, get highest chance prediction
    let highestPrediction = getModelResult(prediction);
    // Find result in RESULT_MAPPING array
    if (highestPrediction > 0) {
      setPresentedShape(RESULT_MAPPING[highestPrediction - 1]);
    } else {
      setPresentedShape('Cannot Found');
    }
    setIsProcessing(false);
    // Remove image from cache
    // RNFS.unlink(base64Image.uri);
  };
  const getModelResult = (obj) => {
    // alert(JSON.stringify(obj))
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
      {/* <Camera           //Expo Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.front}
        autoFocus={true}
        whiteBalance={Camera.Constants.WhiteBalance.auto}></Camera> */}

      <RNCamera           //React Native Camera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.front}
        // flashMode={RNCamera.Constants.FlashMode.on}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        androidRecordAudioPermissionOptions={{
          title: 'Permission to use audio recording',
          message: 'We need your permission to use your audio',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        onGoogleVisionBarcodesDetected={({ barcodes }) => {
          console.log(barcodes);
        }}
      />
      <View style={styles.infoWrapper}>
        <TouchableOpacity onPress={takePicture} style={styles.infoContainer}>
          {isProcessing ? <ActivityIndicator /> : <Text style={styles.infoText}>{presentedShape}</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.captureContainer}>
        <TouchableOpacity onPress={takePicture} style={styles.capture}>
          <Text style={{ fontSize: 14 }}> SNAP </Text>
        </TouchableOpacity>
      </View>
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
  captureContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
    width: 90,
    height: 55,
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
  infoWrapper: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
  },
  infoContainer: {
    flex: 0,
    backgroundColor: 'gray',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
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
