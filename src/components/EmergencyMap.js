import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as EmergencyLocationService from '../services/emergencyLocationService';

const EmergencyMap = ({
  initialRegion,
  markers = [],
  showFacilities = false,
  facilityType = 'all',
  onRegionChange,
  onMarkerPress,
}) => {
  const [currentLocation, setCurrentLocation] = useState(initialRegion);
  const [isLoading, setIsLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    loadCurrentLocation();
    if (showFacilities) {
      loadNearbyFacilities();
    }
  }, [facilityType]);

  const loadCurrentLocation = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadNearbyFacilities = async () => {
    try {
      const nearbyFacilities = await EmergencyLocationService.findNearbyFacilities(facilityType);
      setFacilities(nearbyFacilities);
    } catch (error) {
      console.error('Error loading nearby facilities:', error);
    }
  };

  const handleRegionChange = (region) => {
    if (onRegionChange) {
      onRegionChange(region);
    }
  };

  const handleMarkerPress = (marker) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        testID="mock-map-view"
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={currentLocation}
        onRegionChange={handleRegionChange}
      >
        {/* Current location marker */}
        <Marker
          testID="mock-marker"
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Current Location"
          pinColor="blue"
        />

        {/* Custom markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            testID="mock-marker"
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}

        {/* Facility markers */}
        {showFacilities &&
          facilities.map((facility) => (
            <Marker
              key={facility.id}
              testID="mock-marker"
              coordinate={{
                latitude: facility.location.lat,
                longitude: facility.location.lng,
              }}
              title={facility.name}
              description={facility.type}
              onPress={() => handleMarkerPress(facility)}
            />
          ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EmergencyMap;
