import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

const EmergencyButton = ({ onEmergencyTriggered }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [camera, setCamera] = useState(null);
  const [audioRecording, setAudioRecording] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    setPermissions({
      camera: cameraStatus === 'granted',
      audio: audioStatus === 'granted',
      media: mediaStatus === 'granted',
    });
  };

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isRecording) {
        startPulseAnimation();
      }
    });
  };

  const startRecording = async () => {
    if (!permissions.camera || !permissions.audio) {
      Alert.alert('Permission Required', 'Camera and audio permissions are needed for panic mode');
      return;
    }

    setIsRecording(true);
    startPulseAnimation();
    Vibration.vibrate(500);

    // Start video recording
    if (camera) {
      const videoRecording = await camera.recordAsync();
      await MediaLibrary.saveToLibraryAsync(videoRecording.uri);
    }

    // Start audio recording
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setAudioRecording(recording);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    pulseAnim.setValue(1);

    if (camera) {
      camera.stopRecording();
    }

    if (audioRecording) {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      await MediaLibrary.saveToLibraryAsync(uri);
    }
  };

  const handleSOSPress = async () => {
    const longPressTimeout = setTimeout(async () => {
      // Start panic mode (recording)
      await startRecording();
    }, 1000);

    const handlePressOut = async () => {
      clearTimeout(longPressTimeout);
      if (isRecording) {
        await stopRecording();
      } else {
        // Quick press - trigger normal emergency
        Vibration.vibrate(200);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          onEmergencyTriggered(location);
          
          // Navigate to emergency screen
          navigation.navigate('Emergency', {
            emergencyType: 'police',
            location: location,
            isPanicMode: false
          });

          // Auto-dial emergency number
          const emergencyNumber = Platform.select({
            ios: 'telprompt:112',
            android: 'tel:112'
          });
          
          Alert.alert(
            'Emergency Call',
            'Do you want to call emergency services?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Call',
                onPress: () => Linking.openURL(emergencyNumber)
              }
            ]
          );
        }
      }
    };

    return () => {
      clearTimeout(longPressTimeout);
      handlePressOut();
    };
  };

  const handlePressOut = async () => {
    clearTimeout(longPressTimeout);
    if (isRecording) {
      await stopRecording();
    } else {
      // Quick press - trigger normal emergency
      Vibration.vibrate(200);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        onEmergencyTriggered(location);
        
        // Navigate to emergency screen
        navigation.navigate('Emergency', {
          emergencyType: 'police',
          location: location,
          isPanicMode: false
        });

        // Auto-dial emergency number
        const emergencyNumber = Platform.select({
          ios: 'telprompt:112',
          android: 'tel:112'
        });
        
        Alert.alert(
          'Emergency Call',
          'Do you want to call emergency services?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Call',
              onPress: () => Linking.openURL(emergencyNumber)
            }
          ]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="emergency-button"
        style={styles.buttonContainer}
        onPressIn={handleSOSPress}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: isRecording ? '#ff4444' : '#E63946'
            }
          ]}
        >
          <Ionicons
            name={isRecording ? 'radio-button-on' : 'warning'}
            size={40}
            color="white"
          />
        </Animated.View>
      </TouchableOpacity>
      {isRecording && (
        <Camera
          ref={ref => setCamera(ref)}
          style={styles.hidden}
          type={Camera.Constants.Type.back}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  hidden: {
    width: 0,
    height: 0,
  },
});

export default EmergencyButton;
