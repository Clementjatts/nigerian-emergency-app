import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmergencyFacilityFinder from '../screens/EmergencyFacilityFinder';
import OfflineMapViewer from '../screens/OfflineMapViewer';
import LocationSharing from '../screens/LocationSharing';
import SafetyZonesScreen from '../screens/SafetyZonesScreen';

const Stack = createStackNavigator();

const EmergencyNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066CC',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="EmergencyFacilityFinder"
        component={EmergencyFacilityFinder}
        options={({ navigation }) => ({
          title: 'Emergency Facilities',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate('OfflineMapViewer')}
            >
              <Ionicons name="cloud-download-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OfflineMapViewer"
        component={OfflineMapViewer}
        options={{
          title: 'Offline Maps',
        }}
      />
      <Stack.Screen
        name="LocationSharing"
        component={LocationSharing}
        options={{
          title: 'Share Location',
        }}
      />
      <Stack.Screen
        name="SafetyZones"
        component={SafetyZonesScreen}
        options={{
          title: 'Safety Zones',
        }}
      />
    </Stack.Navigator>
  );
};

export default EmergencyNavigator;
