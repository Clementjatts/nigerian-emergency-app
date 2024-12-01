import { EmergencyLocationService, emergencyFacilityTypes } from '../emergencyLocationService';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-location');
jest.mock('@react-native-async-storage/async-storage');

describe('EmergencyLocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should get current location when permissions are granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const mockLocation = {
        coords: {
          latitude: 9.0820,
          longitude: 8.6753
        }
      };
      Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);

      const result = await EmergencyLocationService.getCurrentLocation();
      expect(result).toEqual(mockLocation);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when permissions are denied', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(EmergencyLocationService.getCurrentLocation()).rejects.toThrow('Location permission denied');
    });

    it('should return cached location when live location fails', async () => {
      Location.requestForegroundPermissionsAsync.mockRejectedValue(new Error('Network error'));
      const cachedLocation = {
        timestamp: Date.now(),
        coords: {
          latitude: 9.0820,
          longitude: 8.6753
        }
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedLocation));

      const result = await EmergencyLocationService.getCurrentLocation();
      expect(result).toEqual(cachedLocation);
    });
  });

  describe('findNearbyFacilities', () => {
    const mockLocation = {
      coords: {
        latitude: 9.0820,
        longitude: 8.6753
      }
    };

    beforeEach(() => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);
    });

    it('should return cached facilities if available and not expired', async () => {
      const cachedFacilities = {
        timestamp: Date.now(),
        facilities: [{ id: 1, name: 'Test Hospital' }]
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedFacilities));

      const result = await EmergencyLocationService.findNearbyFacilities(emergencyFacilityTypes.HOSPITAL);
      expect(result).toEqual(cachedFacilities.facilities);
    });

    it('should fetch new facilities if cache is expired', async () => {
      const oldCache = {
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours old
        facilities: [{ id: 1, name: 'Old Hospital' }]
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(oldCache));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            place_id: 2,
            name: 'New Hospital',
            vicinity: 'Test Address',
            geometry: { location: { lat: 9.0820, lng: 8.6753 } }
          }]
        })
      });

      const result = await EmergencyLocationService.findNearbyFacilities(emergencyFacilityTypes.HOSPITAL);
      expect(result[0].name).toBe('New Hospital');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('locationSharing', () => {
    it('should start location sharing when background permission is granted', async () => {
      Location.requestBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.startLocationUpdatesAsync.mockResolvedValue();

      await EmergencyLocationService.startLocationSharing('test-emergency');
      expect(Location.startLocationUpdatesAsync).toHaveBeenCalled();
    });

    it('should stop location sharing', async () => {
      Location.stopLocationUpdatesAsync.mockResolvedValue();

      await EmergencyLocationService.stopLocationSharing('test-emergency');
      expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
    });
  });
});
