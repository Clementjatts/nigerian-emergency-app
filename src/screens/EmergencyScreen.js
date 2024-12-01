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

  const handleEmergencyTriggered = async (location) => {
    setIsLoading(true);
    try {
      // Send emergency alert to backend
      await api.createEmergency({
        type: emergencyType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        isPanicMode: route.params?.isPanicMode || false,
      });

      setAlertSent(true);
      Alert.alert(
        'Emergency Alert Sent',
        'Emergency services have been notified and are on their way. Stay calm and follow any instructions provided.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency alert. Please try again or call emergency services directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyCall = () => {
    // Handle emergency call
  };

  const handleServiceCall = (serviceType) => {
    // Handle service call
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{emergency.title}</Text>
          <emergency.icon size={40} color={emergency.color} />
        </View>

        <View style={styles.sosContainer}>
          <EmergencyButton
            title="Call Emergency"
            icon={Phone}
            onPress={handleEmergencyCall}
            color="#E63946"
          />
          <EmergencyButton
            title="Medical Help"
            icon={FirstAid}
            onPress={() => handleServiceCall('medical')}
            color="#2A9D8F"
          />
          <EmergencyButton
            title="Police"
            icon={Police}
            onPress={() => handleServiceCall('police')}
            color="#457B9D"
          />
          <EmergencyButton
            title="Fire Service"
            icon={Siren}
            onPress={() => handleServiceCall('fire')}
            color="#E76F51"
          />
          <Text style={styles.sosText}>
            {isRecording ? 'Recording in Panic Mode' : 'Hold for Panic Mode'}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Tap the SOS button for immediate emergency alert{'\n'}
            Hold the button to activate Panic Mode with video/audio recording
          </Text>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={emergency.color} />
            <Text style={styles.loadingText}>Sending Emergency Alert...</Text>
          </View>
        )}

        {alertSent && (
          <View style={styles.alertSentContainer}>
            <MapPin size={50} color="green" />
            <Text style={styles.alertSentText}>Emergency Alert Sent</Text>
          </View>
        )}
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  sosText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginVertical: 20,
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 24,
    color: '#444',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  alertSentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  alertSentText: {
    marginTop: 10,
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
  },
});
