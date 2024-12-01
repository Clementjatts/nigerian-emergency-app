import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock React Native components
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => 'TouchableOpacity');
jest.mock('react-native/Libraries/Components/TextInput/TextInput', () => 'TextInput');
jest.mock('react-native/Libraries/Text/Text', () => 'Text');
jest.mock('react-native/Libraries/Components/View/View', () => 'View');

// Mock expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  Accuracy: {
    High: 'high',
  },
}));

jest.mock('expo-contacts', () => ({
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  Fields: {
    PhoneNumbers: 'phoneNumbers',
    Name: 'name',
  },
}));

jest.mock('expo-sharing', () => ({
  share: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-directory/',
  makeDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    callback({ isConnected: true });
    return jest.fn();
  }),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = (props) => {
    return React.createElement(View, { testID: 'mock-map-view', ...props });
  };
  
  const MockMarker = (props) => {
    return React.createElement(View, { testID: 'mock-marker', ...props });
  };
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});

// Set up global fetch mock
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
}));

// Set up global error handling for tests
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
};

// Set up navigation mock
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Add missing expect
global.expect = expect;
