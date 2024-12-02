import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, Plus, Trash } from 'phosphor-react-native';
import GeofencingService from '../services/geofencingService';

const SafetyZonesScreen = () => {
  const [safetyZones, setSafetyZones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneRadius, setZoneRadius] = useState('100');

  useEffect(() => {
    loadSafetyZones();
    getCurrentLocation();
  }, []);

  const loadSafetyZones = async () => {
    try {
      const zones = await GeofencingService.getSafetyZones();
      setSafetyZones(zones);
    } catch (error) {
      Alert.alert('Error', 'Failed to load safety zones');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleMapLongPress = (event) => {
    setSelectedLocation(event.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const handleAddZone = async () => {
    if (!selectedLocation || !zoneName) {
      Alert.alert('Error', 'Please provide zone name and location');
      return;
    }

    try {
      const newZone = await GeofencingService.addSafetyZone({
        name: zoneName,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radius: parseInt(zoneRadius, 10),
      });

      setSafetyZones([...safetyZones, newZone]);
      setModalVisible(false);
      setZoneName('');
      setZoneRadius('100');
      setSelectedLocation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add safety zone');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      const updatedZones = await GeofencingService.removeSafetyZone(zoneId);
      setSafetyZones(updatedZones);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete safety zone');
    }
  };

  const renderZoneItem = ({ item }) => (
    <View style={styles.zoneItem}>
      <View style={styles.zoneInfo}>
        <Text style={styles.zoneName}>{item.name}</Text>
        <Text style={styles.zoneRadius}>Radius: {item.radius}m</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteZone(item.id)}
      >
        <Trash size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={currentLocation}
        onLongPress={handleMapLongPress}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
          >
            <MapPin size={24} color="#007AFF" weight="fill" />
          </Marker>
        )}

        {safetyZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Marker
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
            >
              <MapPin size={24} color="#34C759" weight="fill" />
            </Marker>
            <Circle
              center={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              radius={zone.radius}
              fillColor="rgba(52, 199, 89, 0.2)"
              strokeColor="rgba(52, 199, 89, 0.5)"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}

        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="New Safety Zone"
          >
            <MapPin size={24} color="#FF9500" weight="fill" />
          </Marker>
        )}
      </MapView>

      <View style={styles.zonesList}>
        <Text style={styles.title}>Safety Zones</Text>
        <FlatList
          data={safetyZones}
          renderItem={renderZoneItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Safety Zone</Text>
            <TextInput
              style={styles.input}
              placeholder="Zone Name"
              value={zoneName}
              onChangeText={setZoneName}
            />
            <TextInput
              style={styles.input}
              placeholder="Radius (meters)"
              value={zoneRadius}
              onChangeText={setZoneRadius}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddZone}
              >
                <Text style={styles.buttonText}>Add Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addZoneButton}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  zonesList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '40%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    marginBottom: 10,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
  },
  zoneRadius: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 5,
  },
  addZoneButton: {
    position: 'absolute',
    right: 20,
    bottom: '45%',
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export { SafetyZonesScreen };
export default SafetyZonesScreen;
