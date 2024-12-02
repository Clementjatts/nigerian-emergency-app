import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Police, FirstAid, Siren, Warning } from 'phosphor-react-native';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyStatus from '../components/EmergencyStatus';
import EmergencyConfirmation from '../components/EmergencyConfirmation';
import EmergencyQuickDial from '../components/EmergencyQuickDial';
import { LoadingView, ErrorView } from '../utils/LoadingState';
import notificationService from '../services/notificationService';
import accessibilityService from '../services/accessibilityService';
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
    icon: Warning,
    color: '#457B9D',
    number: '112',
  },
};

const EmergencyScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState(null);
  const [responderInfo, setResponderInfo] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  const emergencyType = route.params?.emergencyType || 'police';
  const colors = accessibilityService.getColors();

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg(t('emergency.locationPermissionDenied'));
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg(t('emergency.locationError'));
        console.error('Error getting location:', error);
      }
    })();
  }, [t]);

  const handleEmergencyPress = () => {
    setShowConfirmation(true);
    accessibilityService.announceForAccessibility(t('emergency.confirmMessage'));
  };

  const handleConfirmEmergency = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setEmergencyStatus('PENDING');

    try {
      const response = await api.createEmergency({
        type: emergencyType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      setEmergencyStatus(response.status);
      setResponderInfo(response.responder);
      setEstimatedTime(response.estimatedTime);
      
      // Schedule notification
      await notificationService.scheduleEmergencyUpdate(
        response.status,
        response.responder
      );
      
      Vibration.vibrate();
      accessibilityService.announceForAccessibility(t('emergency.help'));
    } catch (error) {
      setEmergencyStatus('ERROR');
      setErrorMsg(t('emergency.error'));
      console.error('Error sending emergency alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEmergency = () => {
    setShowConfirmation(false);
  };

  if (errorMsg) {
    return (
      <ErrorView
        message={errorMsg}
        onRetry={() => {
          setErrorMsg(null);
          setEmergencyStatus(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        {isLoading && <LoadingView message={t('emergency.sending')} />}

        {emergencyStatus && (
          <EmergencyStatus
            status={emergencyStatus}
            estimatedTime={estimatedTime}
            responderInfo={responderInfo}
          />
        )}

        <View style={styles.buttonContainer}>
          <EmergencyButton
            type={{
              title: t(`emergency.${emergencyType}`),
              icon: EMERGENCY_TYPES[emergencyType].icon,
              color: colors.accent,
              number: EMERGENCY_TYPES[emergencyType].number,
            }}
            onPress={handleEmergencyPress}
            isLoading={isLoading}
          />
        </View>

        <EmergencyQuickDial
          contacts={[
            {
              id: '1',
              name: t('emergency.nationalEmergency'),
              number: '112',
              type: t('emergency.emergencyServices'),
              isFavorite: true,
            },
            {
              id: '2',
              name: t('emergency.localPolice'),
              number: '199',
              type: t('emergency.police'),
              isFavorite: false,
            },
          ]}
          onAddContact={() => navigation.navigate('AddEmergencyContact')}
        />

        <EmergencyConfirmation
          visible={showConfirmation}
          onConfirm={handleConfirmEmergency}
          onCancel={handleCancelEmergency}
          emergencyType={t(`emergency.${emergencyType}`)}
          loading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
});

export default EmergencyScreen;
