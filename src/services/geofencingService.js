import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const GEOFENCING_TASK = 'GEOFENCING_TASK';
const SAFETY_ZONES_KEY = 'safety_zones';

// Define the geofencing task
TaskManager.defineTask(GEOFENCING_TASK, ({ data: { eventType, region }, error }) => {
  if (error) {
    console.error('Geofencing task error:', error);
    return;
  }
  
  if (eventType === Location.GeofencingEventType.Enter) {
    // Entered safety zone
    Alert.alert(
      'Safety Zone',
      `You've entered ${region.identifier}`,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  } else if (eventType === Location.GeofencingEventType.Exit) {
    // Exited safety zone
    Alert.alert(
      'Safety Zone',
      `You've left ${region.identifier}`,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  }
});

class GeofencingService {
  static async requestPermissions() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Background location permission is required for geofencing');
    }
  }

  static async addSafetyZone(zone) {
    try {
      await this.requestPermissions();

      // Load existing zones
      const existingZones = await this.getSafetyZones();
      
      // Add new zone
      const newZone = {
        ...zone,
        id: Date.now().toString(),
      };
      
      const updatedZones = [...existingZones, newZone];
      await AsyncStorage.setItem(SAFETY_ZONES_KEY, JSON.stringify(updatedZones));

      // Start monitoring the new zone
      await this.startMonitoring(newZone);

      return newZone;
    } catch (error) {
      console.error('Error adding safety zone:', error);
      throw error;
    }
  }

  static async removeSafetyZone(zoneId) {
    try {
      const zones = await this.getSafetyZones();
      const updatedZones = zones.filter(zone => zone.id !== zoneId);
      
      await AsyncStorage.setItem(SAFETY_ZONES_KEY, JSON.stringify(updatedZones));
      
      // Stop monitoring the removed zone
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      
      // Restart monitoring for remaining zones
      await this.startMonitoringAll(updatedZones);
      
      return updatedZones;
    } catch (error) {
      console.error('Error removing safety zone:', error);
      throw error;
    }
  }

  static async getSafetyZones() {
    try {
      const zones = await AsyncStorage.getItem(SAFETY_ZONES_KEY);
      return zones ? JSON.parse(zones) : [];
    } catch (error) {
      console.error('Error getting safety zones:', error);
      return [];
    }
  }

  static async startMonitoring(zone) {
    try {
      await Location.startGeofencingAsync(GEOFENCING_TASK, [{
        identifier: zone.name,
        latitude: zone.latitude,
        longitude: zone.longitude,
        radius: zone.radius || 100, // Default radius of 100 meters
        notifyOnEnter: true,
        notifyOnExit: true,
      }]);
    } catch (error) {
      console.error('Error starting geofencing:', error);
      throw error;
    }
  }

  static async startMonitoringAll(zones) {
    try {
      const regions = zones.map(zone => ({
        identifier: zone.name,
        latitude: zone.latitude,
        longitude: zone.longitude,
        radius: zone.radius || 100,
        notifyOnEnter: true,
        notifyOnExit: true,
      }));

      await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    } catch (error) {
      console.error('Error starting geofencing for all zones:', error);
      throw error;
    }
  }

  static async stopMonitoringAll() {
    try {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
    } catch (error) {
      console.error('Error stopping geofencing:', error);
      throw error;
    }
  }
}

export default GeofencingService;
