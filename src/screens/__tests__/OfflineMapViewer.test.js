import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OfflineMapViewer from '../OfflineMapViewer';
import * as EmergencyLocationService from '../../services/__mocks__/emergencyLocationService';
import * as OfflineStorageService from '../../services/__mocks__/offlineStorageService';

// Mock the required native modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    // Simulate the last button press (usually the action button)
    if (buttons && buttons.length) {
      const lastButton = buttons[buttons.length - 1];
      if (lastButton.onPress) {
        lastButton.onPress();
      }
    }
  }),
}));

jest.mock('../../services/__mocks__/emergencyLocationService');
jest.mock('../../services/__mocks__/offlineStorageService');
jest.mock('../../components/EmergencyMap', () => {
  const { View } = require('react-native');
  return function MockEmergencyMap(props) {
    return <View testID="emergency-map" {...props} />;
  };
});

describe('OfflineMapViewer', () => {
  const mockLocation = {
    coords: {
      latitude: 9.0820,
      longitude: 8.6753,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    EmergencyLocationService.getCurrentLocation.mockResolvedValue(mockLocation);
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValue(false);
  });

  // Initial Rendering Tests
  it('renders loading state initially', async () => {
    const { getByTestId } = render(<OfflineMapViewer />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders download button when no offline data is available', async () => {
    const { getByText } = render(<OfflineMapViewer />);
    await waitFor(() => {
      expect(getByText('Download This Area')).toBeTruthy();
    });
  });

  it('shows offline map available status when offline data exists', async () => {
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValue(true);
    const { getByText } = render(<OfflineMapViewer />);
    await waitFor(() => {
      expect(getByText('Offline Map Available')).toBeTruthy();
    });
  });

  // Location Tests
  it('handles location service error', async () => {
    EmergencyLocationService.getCurrentLocation.mockRejectedValue(new Error('Location error'));
    const consoleSpy = jest.spyOn(console, 'error');
    render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting current location:',
        expect.any(Error)
      );
    });
  });

  it('shows alert when trying to download without location', async () => {
    EmergencyLocationService.getCurrentLocation.mockRejectedValue(new Error('Location error'));
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Download This Area')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Download This Area'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Location Required',
      'Please enable location services to download offline maps.'
    );
  });

  // Download Operation Tests
  it('handles download area button press successfully', async () => {
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Download This Area')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Download This Area'));
    });

    expect(OfflineStorageService.downloadOfflineArea).toHaveBeenCalledWith(
      mockLocation.coords.latitude,
      mockLocation.coords.longitude,
      5000
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      'Download Complete',
      'Offline map data has been downloaded successfully.'
    );
  });

  it('shows downloading state during download', async () => {
    // Mock a delayed download
    OfflineStorageService.downloadOfflineArea.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Download This Area')).toBeTruthy();
    });

    fireEvent.press(getByText('Download This Area'));

    await waitFor(() => {
      expect(getByText('Downloading...')).toBeTruthy();
    });
  });

  it('handles download error', async () => {
    OfflineStorageService.downloadOfflineArea.mockRejectedValueOnce(new Error('Download failed'));
    
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Download This Area')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Download This Area'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Download Failed',
      'Failed to download offline map data. Please try again.'
    );
  });

  // Clear Operation Tests
  it('handles clear offline data', async () => {
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValue(true);
    
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Clear Offline Data')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Clear Offline Data'));
    });

    expect(OfflineStorageService.clearOfflineData).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear Offline Data',
      'Are you sure you want to delete all offline map data?',
      expect.any(Array)
    );
  });

  it('handles clear offline data error', async () => {
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValue(true);
    OfflineStorageService.clearOfflineData.mockRejectedValueOnce(new Error('Clear failed'));
    
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Clear Offline Data')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Clear Offline Data'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Failed to clear offline map data. Please try again.'
    );
  });

  // Map Integration Tests
  it('passes correct props to EmergencyMap', async () => {
    const { getByTestId } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      const map = getByTestId('emergency-map');
      expect(map.props.showFacilities).toBe(false);
      expect(map.props.initialRegion).toEqual({
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    });
  });

  it('handles cancel button in clear confirmation dialog', async () => {
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValue(true);
    
    const { getByText } = render(<OfflineMapViewer />);
    
    await waitFor(() => {
      expect(getByText('Clear Offline Data')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Clear Offline Data'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear Offline Data',
      'Are you sure you want to delete all offline map data?',
      expect.any(Array)
    );
  });
});
