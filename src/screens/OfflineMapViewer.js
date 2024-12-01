import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { MapPin, Download, Star, Navigation, X } from 'phosphor-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import mapTileManager from '../services/mapTileManager';
import offlineRoutingService from '../services/offlineRoutingService';
import { useNetInfo } from '@react-native-community/netinfo';

const OfflineMapViewer = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSaveLocation, setShowSaveLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [route, setRoute] = useState(null);
  const mapRef = useRef(null);
  const netInfo = useNetInfo();

  useEffect(() => {
    getCurrentLocation();
    loadFavoriteLocations();
    mapTileManager.setProgressCallback(setDownloadProgress);
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
      setLoading(false);
    }
  };

  const downloadOfflineData = async () => {
    if (!currentLocation) return;

    try {
      setDownloading(true);
      await mapTileManager.downloadRegion(
        currentLocation.latitude,
        currentLocation.longitude,
        5 // 5km radius
      );
      setHasOfflineData(true);
      Alert.alert('Success', 'Offline map data downloaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to download offline map data');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const loadFavoriteLocations = async () => {
    try {
      const locations = await offlineRoutingService.getFavoriteLocations();
      setFavoriteLocations(locations);
    } catch (error) {
      console.error('Error loading favorite locations:', error);
    }
  };

  const handleMapLongPress = (event) => {
    setSelectedLocation(event.nativeEvent.coordinate);
    setShowSaveLocation(true);
  };

  const saveLocation = async () => {
    if (!selectedLocation || !locationName) return;

    try {
      await offlineRoutingService.saveFavoriteLocation({
        id: Date.now().toString(),
        name: locationName,
        ...selectedLocation,
        address: 'Custom Location', // You can implement reverse geocoding here
      });
      await loadFavoriteLocations();
      setShowSaveLocation(false);
      setLocationName('');
      Alert.alert('Success', 'Location saved to favorites');
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const calculateRoute = async (destination) => {
    if (!currentLocation) return;

    try {
      const routeData = await offlineRoutingService.findRoute(currentLocation, destination);
      if (routeData) {
        setRoute(routeData);
        mapRef.current?.fitToCoordinates([currentLocation, destination], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate route');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2A9D8F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onLongPress={handleMapLongPress}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You are here"
            pinColor="#2A9D8F"
          />
        )}
        {favoriteLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            pinColor="#E9C46A"
          >
            <Star size={24} color="#E9C46A" weight="fill" />
          </Marker>
        ))}
        {route && (
          <Polyline
            coordinates={route}
            strokeColor="#2A9D8F"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowFavorites(true)}
        >
          <Star size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, downloading && styles.buttonDisabled]}
          onPress={downloadOfflineData}
          disabled={downloading}
        >
          {downloading ? (
            <View>
              <ActivityIndicator color="#fff" />
              <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
            </View>
          ) : (
            <Download size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSaveLocation}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location name"
              value={locationName}
              onChangeText={setLocationName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSaveLocation(false);
                  setLocationName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveLocation}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFavorites}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Favorite Locations</Text>
              <TouchableOpacity
                onPress={() => setShowFavorites(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={favoriteLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteItem}
                  onPress={() => {
                    calculateRoute({
                      latitude: item.latitude,
                      longitude: item.longitude,
                    });
                    setShowFavorites(false);
                  }}
                >
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteName}>{item.name}</Text>
                    <Text style={styles.favoriteAddress}>{item.address}</Text>
                  </View>
                  <Navigation size={24} color="#2A9D8F" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#2A9D8F',
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
  },
  cancelButton: {
    backgroundColor: '#E63946',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default OfflineMapViewer;
