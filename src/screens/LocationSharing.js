import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
  Switch,
} from 'react-native';
import { MapPin, Share, CaretLeft, Phone } from 'phosphor-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import EmergencyMap from '../components/EmergencyMap';
import { EmergencyLocationService } from '../services/emergencyLocationService';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';

const TRUSTED_CONTACTS_KEY = 'trusted_contacts';
const LOCATION_SHARING_KEY = 'location_sharing_active';

const LocationSharing = () => {
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [emergencyId, setEmergencyId] = useState(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [accuracy, setAccuracy] = useState('high');

  useEffect(() => {
    loadTrustedContacts();
    checkLocationSharingStatus();
    getCurrentLocation();
    const checkBatteryLevel = async () => {
      const { status } = await Battery.getBatteryLevelAsync();
      setBatteryLevel(status * 100);
    };

    checkBatteryLevel();
    const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel * 100);
      // Adjust location update frequency based on battery level
      if (batteryLevel < 0.2) {
        setAccuracy('balanced');
      } else {
        setAccuracy('high');
      }
    });

    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
      stopLocationUpdates();
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await EmergencyLocationService.getCurrentLocation();
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const loadTrustedContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem(TRUSTED_CONTACTS_KEY);
      if (savedContacts) {
        setTrustedContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('Error loading trusted contacts:', error);
    }
  };

  const checkLocationSharingStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(LOCATION_SHARING_KEY);
      if (status) {
        const { isActive, id } = JSON.parse(status);
        setIsSharing(isActive);
        setEmergencyId(id);
      }
    } catch (error) {
      console.error('Error checking location sharing status:', error);
    }
  };

  const handleAddContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Unable to access contacts');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        // Show contact picker or handle contact selection
        // For this example, we'll just add the first contact with a phone number
        const contact = data.find(c => c.phoneNumbers && c.phoneNumbers.length > 0);
        if (contact) {
          const newContact = {
            id: contact.id,
            name: contact.name,
            phoneNumber: contact.phoneNumbers[0].number,
          };

          const updatedContacts = [...trustedContacts, newContact];
          await AsyncStorage.setItem(TRUSTED_CONTACTS_KEY, JSON.stringify(updatedContacts));
          setTrustedContacts(updatedContacts);
        }
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      const updatedContacts = trustedContacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(TRUSTED_CONTACTS_KEY, JSON.stringify(updatedContacts));
      setTrustedContacts(updatedContacts);
    } catch (error) {
      console.error('Error removing contact:', error);
      Alert.alert('Error', 'Failed to remove contact');
    }
  };

  const startLocationUpdates = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Background location access is required for location sharing');
        return;
      }

      // Start background location updates
      const locationTask = await Location.startLocationUpdatesAsync('LOCATION_TRACKING', {
        accuracy: Location.Accuracy[accuracy],
        timeInterval: accuracy === 'high' ? 10000 : 30000, // 10s or 30s based on accuracy
        distanceInterval: accuracy === 'high' ? 10 : 50, // 10m or 50m based on accuracy
        foregroundService: {
          notificationTitle: 'Emergency Location Sharing',
          notificationBody: 'Your location is being shared with emergency contacts',
          notificationColor: '#ff0000',
        },
        // Enable background location updates
        mayShowUserSettingsDialog: true,
        activityType: Location.ActivityType.OTHER,
      });

      setLocationUpdateInterval(locationTask);
    } catch (error) {
      console.error('Error starting location updates:', error);
      Alert.alert('Error', 'Failed to start location sharing');
    }
  };

  const stopLocationUpdates = async () => {
    try {
      if (locationUpdateInterval) {
        await Location.stopLocationUpdatesAsync('LOCATION_TRACKING');
        setLocationUpdateInterval(null);
      }
    } catch (error) {
      console.error('Error stopping location updates:', error);
    }
  };

  const toggleLocationSharing = async (value) => {
    try {
      if (value) {
        const id = Date.now().toString();
        await startLocationUpdates();
        setEmergencyId(id);
        
        // Share location with trusted contacts
        if (trustedContacts.length > 0) {
          const locationUrl = `https://your-emergency-app.com/track/${id}`;
          const message = `I'm sharing my location with you during an emergency. Track me here: ${locationUrl}\nBattery Level: ${batteryLevel}%`;
          
          await Share.share({
            message,
            title: 'Emergency Location Sharing',
          });

          // Store emergency session
          await AsyncStorage.setItem('EMERGENCY_SESSION', JSON.stringify({
            id,
            startTime: Date.now(),
            contacts: trustedContacts,
            accuracy,
          }));
        }
      } else {
        if (emergencyId) {
          await stopLocationUpdates();
          await AsyncStorage.removeItem('EMERGENCY_SESSION');
        }
      }

      setIsSharing(value);
      await AsyncStorage.setItem(LOCATION_SHARING_KEY, JSON.stringify({
        isActive: value,
        id: emergencyId,
      }));
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      Alert.alert('Error', 'Failed to toggle location sharing');
    }
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveContact(item.id)}
      >
        <CaretLeft size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Sharing</Text>
        <View style={styles.sharingToggle}>
          <Text style={styles.sharingText}>
            {isSharing ? 'Sharing Active' : 'Sharing Inactive'}
          </Text>
          <Switch
            value={isSharing}
            onValueChange={toggleLocationSharing}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isSharing ? '#0066CC' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <EmergencyMap
          initialRegion={currentLocation}
          showUserLocation={true}
        />
      </View>

      <View style={styles.contactsContainer}>
        <View style={styles.contactsHeader}>
          <Text style={styles.contactsTitle}>Trusted Contacts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddContact}
          >
            <Phone size={24} color="#0066CC" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={trustedContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          style={styles.contactsList}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              No trusted contacts added yet
            </Text>
          )}
        />
      </View>

      {isSharing && (
        <View style={styles.sharingInfo}>
          <MapPin size={20} color="#666666" />
          <Text style={styles.sharingInfoText}>
            Your location is being shared with your trusted contacts
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  sharingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sharingText: {
    fontSize: 16,
    color: '#666666',
  },
  mapContainer: {
    flex: 1,
  },
  contactsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  contactsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    padding: 5,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  removeButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666666',
  },
  sharingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#E3F2FD',
  },
  sharingInfoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666666',
  },
});

export default LocationSharing;
