import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MapPin, Download } from 'phosphor-react-native';
import EmergencyMap from '../components/EmergencyMap';
import * as EmergencyLocationService from '../services/__mocks__/emergencyLocationService';
import * as OfflineStorageService from '../services/__mocks__/offlineStorageService';

const OfflineMapViewer = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    checkOfflineData();
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

  const checkOfflineData = async () => {
    try {
      const hasData = await OfflineStorageService.isOfflineDataAvailable();
      setHasOfflineData(hasData);
    } catch (error) {
      console.error('Error checking offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to download offline maps.'
      );
      return;
    }

    setDownloading(true);
    try {
      await OfflineStorageService.downloadOfflineArea(
        currentLocation.latitude,
        currentLocation.longitude,
        5000 // 5km radius
      );
      setHasOfflineData(true);
      Alert.alert(
        'Download Complete',
        'Offline map data has been downloaded successfully.'
      );
    } catch (error) {
      console.error('Error downloading offline data:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download offline map data. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear Offline Data',
      'Are you sure you want to delete all offline map data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineStorageService.clearOfflineData();
              setHasOfflineData(false);
              Alert.alert('Success', 'Offline map data has been cleared.');
            } catch (error) {
              console.error('Error clearing offline data:', error);
              Alert.alert(
                'Error',
                'Failed to clear offline map data. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EmergencyMap
        initialRegion={currentLocation}
        showFacilities={false}
        onRegionChange={(region) => {
          // Handle region change
        }}
      />
      <View style={styles.overlay}>
        {hasOfflineData ? (
          <>
            <Text style={styles.statusText}>Offline Map Available</Text>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearData}
            >
              <MapPin size={24} color="#FF3B30" weight="fill" />
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Clear Offline Data
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, downloading && styles.buttonDisabled]}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Download size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {downloading ? 'Downloading...' : 'Download This Area'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    color: '#FF3B30',
  },
  statusText: {
    backgroundColor: '#4CD964',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineMapViewer;
