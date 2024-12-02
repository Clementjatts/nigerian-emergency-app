import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import notificationService from '../utils/notificationService';

const NotificationPreferencesScreen = () => {
  const [preferences, setPreferences] = useState({
    emergencyAlerts: true,
    responderUpdates: true,
    communityAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        // Ensure all required fields exist
        setPreferences(prev => ({
          ...prev,
          ...prefs,
          quietHours: {
            ...prev.quietHours,
            ...(prefs.quietHours || {})
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleQuietHoursToggle = () => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled,
      },
    }));
  };

  const handleTimeChange = (event, selectedTime, type) => {
    if (event.type === 'dismissed') {
      type === 'start' ? setShowStartPicker(false) : setShowEndPicker(false);
      return;
    }

    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      setPreferences((prev) => ({
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [type]: timeString,
        },
      }));
    }
    
    type === 'start' ? setShowStartPicker(false) : setShowEndPicker(false);
  };

  const savePreferences = async () => {
    try {
      await notificationService.updateNotificationPreferences(preferences);
      Alert.alert('Success', 'Notification preferences updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  if (loading || !preferences) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>
        
        <View style={styles.preference}>
          <Text>Emergency Alerts</Text>
          <Switch
            value={preferences.emergencyAlerts}
            onValueChange={() => handleToggle('emergencyAlerts')}
          />
        </View>

        <View style={styles.preference}>
          <Text>Responder Updates</Text>
          <Switch
            value={preferences.responderUpdates}
            onValueChange={() => handleToggle('responderUpdates')}
          />
        </View>

        <View style={styles.preference}>
          <Text>Community Alerts</Text>
          <Switch
            value={preferences.communityAlerts}
            onValueChange={() => handleToggle('communityAlerts')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        <View style={styles.preference}>
          <Text>Sound</Text>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={() => handleToggle('soundEnabled')}
          />
        </View>

        <View style={styles.preference}>
          <Text>Vibration</Text>
          <Switch
            value={preferences.vibrationEnabled}
            onValueChange={() => handleToggle('vibrationEnabled')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        
        <View style={styles.preference}>
          <Text>Enable Quiet Hours</Text>
          <Switch
            value={preferences.quietHours.enabled}
            onValueChange={handleQuietHoursToggle}
          />
        </View>

        {preferences.quietHours.enabled && (
          <>
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>Start Time</Text>
              <Text>{preferences.quietHours.start}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => setShowEndPicker(true)}
            >
              <Text>End Time</Text>
              <Text>{preferences.quietHours.end}</Text>
            </TouchableOpacity>
          </>
        )}

        {showStartPicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${preferences.quietHours.start}:00`)}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedTime) =>
              handleTimeChange(event, selectedTime, 'start')
            }
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${preferences.quietHours.end}:00`)}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedTime) =>
              handleTimeChange(event, selectedTime, 'end')
            }
          />
        )}
      </View>

      <TouchableOpacity 
        style={[
          styles.saveButton,
          !preferences.quietHours.enabled || 
          (preferences.quietHours.start && preferences.quietHours.end) 
          ? {} 
          : styles.saveButtonDisabled
        ]} 
        onPress={savePreferences}
        disabled={!preferences.quietHours.enabled || !(preferences.quietHours.start && preferences.quietHours.end)}
      >
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { NotificationPreferencesScreen };
export default NotificationPreferencesScreen;
