import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const EMERGENCY_FACILITIES_CACHE = 'emergency_facilities_cache';
const LOCATION_CACHE = 'last_known_location';

export const emergencyFacilityTypes = {
  HOSPITAL: 'hospital',
  POLICE: 'police',
  FIRE_STATION: 'fire_station'
};

export class EmergencyLocationService {
  static async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // Cache the location
      await AsyncStorage.setItem(LOCATION_CACHE, JSON.stringify({
        timestamp: Date.now(),
        ...location
      }));

      return location;
    } catch (error) {
      // Try to get cached location if live location fails
      const cachedLocation = await AsyncStorage.getItem(LOCATION_CACHE);
      if (cachedLocation) {
        return JSON.parse(cachedLocation);
      }
      throw error;
    }
  }

  static async findNearbyFacilities(type, radius = 5000) {
    try {
      const location = await this.getCurrentLocation();
      const cacheKey = `${EMERGENCY_FACILITIES_CACHE}_${type}_${location.coords.latitude}_${location.coords.longitude}`;
      
      // Check cache first
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, facilities } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return facilities;
        }
      }

      // If no cache or expired, fetch new data
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.coords.latitude},${location.coords.longitude}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby facilities');
      }

      const data = await response.json();
      const facilities = data.results.map(facility => ({
        id: facility.place_id,
        name: facility.name,
        address: facility.vicinity,
        location: facility.geometry.location,
        rating: facility.rating,
        isOpen: facility.opening_hours?.open_now,
        phoneNumber: facility.formatted_phone_number
      }));

      // Cache the results
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        facilities
      }));

      return facilities;
    } catch (error) {
      console.error('Error finding nearby facilities:', error);
      throw error;
    }
  }

  static async startLocationSharing(emergencyId) {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Background location permission denied');
      }

      // Start background location updates
      return await Location.startLocationUpdatesAsync(`emergency_${emergencyId}`, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Update every 10 meters
        foregroundService: {
          notificationTitle: 'Emergency Location Sharing',
          notificationBody: 'Your location is being shared with emergency services'
        }
      });
    } catch (error) {
      console.error('Error starting location sharing:', error);
      throw error;
    }
  }

  static async stopLocationSharing(emergencyId) {
    try {
      await Location.stopLocationUpdatesAsync(`emergency_${emergencyId}`);
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      throw error;
    }
  }
}
