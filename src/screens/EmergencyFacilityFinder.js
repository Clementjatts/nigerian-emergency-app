import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { MapPin, FirstAid, Hospital, Phone, CaretLeft, MagnifyingGlass } from 'phosphor-react-native';
import EmergencyMap from '../components/EmergencyMap';
import * as EmergencyLocationService from '../services/emergencyLocationService';
import useOfflineData from '../hooks/useOfflineData';
import offlineDataManager from '../services/offlineDataManager';

const FACILITY_TYPES = [
  { id: 'all', label: 'All', icon: 'medical' },
  { id: 'hospital', label: 'Hospitals', icon: 'medical' },
  { id: 'police', label: 'Police', icon: 'shield-checkmark' },
  { id: 'fire', label: 'Fire Station', icon: 'flame' },
];

const STORAGE_KEY = '@emergency_facilities';

const EmergencyFacilityFinder = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 9.0820,
    longitude: 8.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const {
    data: facilities,
    loading,
    error,
    isOffline,
    refresh
  } = useOfflineData(
    STORAGE_KEY,
    () => EmergencyLocationService.findNearbyFacilities(selectedType),
    { maxAge: 12 * 60 * 60 * 1000 } // 12 hours cache
  );

  const [selectedFacility, setSelectedFacility] = useState(null);
  const [route, setRoute] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const mapRef = useRef(null);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleCall = async (phoneNumber) => {
    const url = Platform.select({
      ios: `tel:${phoneNumber}`,
      android: `tel:${phoneNumber}`,
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Phone number is not supported');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  };

  const handleGetDirections = async (facility) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${facility.latitude},${facility.longitude}`,
      android: `google.navigation:q=${facility.latitude},${facility.longitude}`,
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Maps application is not supported');
      }
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  const calculateRoute = async (facility) => {
    try {
      if (!currentRegion) return;

      const origin = {
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude
      };

      const destination = {
        latitude: facility.latitude,
        longitude: facility.longitude
      };

      // Get route with traffic consideration
      const routeData = await EmergencyLocationService.getRoute(origin, destination, {
        mode: 'driving',
        alternatives: true,
        traffic: true
      });

      if (routeData) {
        setRoute(routeData.routes[0]);
        setEstimatedTime(routeData.duration);
        setSelectedFacility(facility);

        // Fit map to show entire route
        mapRef.current?.fitToCoordinates(routeData.routes[0].coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const renderFacility = ({ item }) => (
    <View style={styles.facilityCard}>
      <View style={styles.facilityInfo}>
        <Text style={styles.facilityName}>{item.name}</Text>
        <Text style={styles.facilityType}>{item.type}</Text>
        <Text style={styles.facilityAddress}>{item.address}</Text>
        {selectedFacility?.id === item.id && estimatedTime && (
          <Text style={styles.estimatedTime}>
            Estimated arrival: {Math.round(estimatedTime)} minutes
          </Text>
        )}
      </View>
      <View style={styles.facilityActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCall(item.phoneNumber)}
        >
          <Phone size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => calculateRoute(item)}
        >
          <MapPin size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You are offline. Showing cached data.
          </Text>
        </View>
      )}

      <View style={styles.typeSelector}>
        <FlatList
          horizontal
          data={FACILITY_TYPES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === item.id && styles.selectedType,
              ]}
              onPress={() => handleTypeSelect(item.id)}
            >
              {item.id === 'all' && <FirstAid size={24} color={selectedType === item.id ? '#fff' : '#007AFF'} />}
              {item.id === 'hospital' && <Hospital size={24} color={selectedType === item.id ? '#fff' : '#007AFF'} />}
              {item.id === 'police' && <CaretLeft size={24} color={selectedType === item.id ? '#fff' : '#007AFF'} />}
              {item.id === 'fire' && <CaretLeft size={24} color={selectedType === item.id ? '#fff' : '#007AFF'} />}
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === item.id && styles.selectedTypeLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {facilities && facilities.length > 0 && (
        <EmergencyMap
          ref={mapRef}
          style={styles.map}
          facilities={facilities}
          currentRegion={currentRegion}
          onRegionChange={setCurrentRegion}
          route={route}
          selectedFacility={selectedFacility}
        />
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error loading facilities. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={facilities}
          renderItem={renderFacility}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  offlineBanner: {
    backgroundColor: '#FF9500',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  typeSelector: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  selectedType: {
    backgroundColor: '#007AFF',
  },
  typeLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  selectedTypeLabel: {
    color: '#fff',
  },
  map: {
    height: 200,
  },
  list: {
    flex: 1,
  },
  facilityCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  facilityType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  facilityAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  facilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyFacilityFinder;
