import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, FirstAid, Siren, Police, MapPin } from 'phosphor-react-native';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyStatus from '../components/EmergencyStatus';
import EmergencyConfirmation from '../components/EmergencyConfirmation';
import EmergencyQuickDial from '../components/EmergencyQuickDial';
import { api } from '../services/api';

const EMERGENCY_TYPES = {
  police: {
    title: 'Police Emergency',
    icon: Police,
    color: '#E63946',
    number: '112',
  },
  medical: {
    title: 'Medical Emergency',
    icon: FirstAid,
    color: '#2A9D8F',
    number: '112',
  },
  fire: {
    title: 'Fire Emergency',
    icon: Siren,
    color: '#E76F51',
    number: '112',
  },
  security: {
    title: 'Security Threat',
    icon: MapPin,
    color: '#457B9D',
    number: '112',
  },
};

const EmergencyScreen = ({ route, navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState(null);
  const [responderInfo, setResponderInfo] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  const emergencyType = route.params?.emergencyType || 'police';
  const emergency = EMERGENCY_TYPES[emergencyType];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Error getting location');
      }
    })();
  }, []);

  const handleEmergencyPress = async () => {
    setShowConfirmation(true);
  };

  const handleConfirmEmergency = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setEmergencyStatus('PENDING');

    try {
      // Simulate API call for demo purposes
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'ACCEPTED',
            responder: {
              unit: 'Emergency Response Unit 7',
              distance: 2.5,
            },
            estimatedTime: 8,
          });
        }, 3000);
      });

      setEmergencyStatus(response.status);
      setResponderInfo(response.responder);
      setEstimatedTime(response.estimatedTime);
      setAlertSent(true);
      Vibration.vibrate();
    } catch (error) {
      setEmergencyStatus('ERROR');
      console.error('Error sending emergency alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEmergency = () => {
    setShowConfirmation(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {emergencyStatus && (
          <EmergencyStatus
            status={emergencyStatus}
            estimatedTime={estimatedTime}
            responderInfo={responderInfo}
          />
        )}

        <View style={styles.buttonContainer}>
          <EmergencyButton
            type={EMERGENCY_TYPES[emergencyType]}
            onPress={handleEmergencyPress}
            isLoading={isLoading}
          />
        </View>

        <EmergencyQuickDial
          contacts={[
            {
              id: '1',
              name: 'National Emergency',
              number: '112',
              type: 'Emergency Services',
              isFavorite: true,
            },
            {
              id: '2',
              name: 'Local Police',
              number: '199',
              type: 'Police',
              isFavorite: false,
            },
          ]}
          onAddContact={() => navigation.navigate('AddEmergencyContact')}
        />

        <EmergencyConfirmation
          visible={showConfirmation}
          onConfirm={handleConfirmEmergency}
          onCancel={handleCancelEmergency}
          emergencyType={EMERGENCY_TYPES[emergencyType].title}
          loading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
});

export default EmergencyScreen;
