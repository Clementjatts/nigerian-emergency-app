import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import EmergencyFacilityFinder from '../EmergencyFacilityFinder';
import * as EmergencyLocationService from '../../services/emergencyLocationService';
import * as OfflineStorageService from '../../services/offlineStorageService';

// Mock the required native modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('../../services/emergencyLocationService');
jest.mock('../../services/offlineStorageService');
jest.mock('../../components/EmergencyMap', () => {
  const { View } = require('react-native');
  return function MockEmergencyMap(props) {
    return <View testID="mock-emergency-map" {...props} />;
  };
});

describe('EmergencyFacilityFinder', () => {
  const mockFacilities = [
    {
      id: '1',
      name: 'Test Hospital',
      address: '123 Test Street',
      location: { lat: 9.0820, lng: 8.6753 },
      isOpen: true,
      phoneNumber: '1234567890',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    EmergencyLocationService.findNearbyFacilities.mockResolvedValue(mockFacilities);
  });

  it('renders correctly with initial hospital type selected', () => {
    const { getByText, getAllByRole } = render(<EmergencyFacilityFinder />);
    
    expect(getByText('Hospital')).toBeTruthy();
    expect(getByText('Police')).toBeTruthy();
    expect(getByText('Fire Station')).toBeTruthy();
  });

  it('loads facilities on mount', async () => {
    render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(EmergencyLocationService.findNearbyFacilities).toHaveBeenCalledWith('hospital');
    });
  });

  it('changes facility type when selector is pressed', async () => {
    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await act(async () => {
      fireEvent.press(getByText('Police'));
    });

    await waitFor(() => {
      expect(EmergencyLocationService.findNearbyFacilities).toHaveBeenCalledWith('police');
    });
  });

  it('displays loading state while fetching facilities', async () => {
    EmergencyLocationService.findNearbyFacilities.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const { getByTestId } = render(<EmergencyFacilityFinder />);
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays error state when facility fetch fails', async () => {
    EmergencyLocationService.findNearbyFacilities.mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Failed to load facilities. Please check your connection.')).toBeTruthy();
    });
  });

  it('displays facility information in the list', async () => {
    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
      expect(getByText('123 Test Street')).toBeTruthy();
      expect(getByText('Open')).toBeTruthy();
    });
  });

  it('handles retry when facility fetch fails', async () => {
    EmergencyLocationService.findNearbyFacilities
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce(mockFacilities);

    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Retry'));
    });

    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
    });
  });

  it('renders loading state initially', async () => {
    const { getByTestId } = render(<EmergencyFacilityFinder />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('loads and displays facilities', async () => {
    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
    });
  });

  it('filters facilities by type', async () => {
    const { getByText, queryByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
    });

    fireEvent.press(getByText('Police'));
    
    await waitFor(() => {
      expect(queryByText('Test Hospital')).toBeNull();
    });
  });

  it('handles offline mode', async () => {
    OfflineStorageService.isOfflineDataAvailable.mockResolvedValueOnce(true);
    
    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Offline Mode')).toBeTruthy();
    });
  });

  it('handles location permission denial', async () => {
    EmergencyLocationService.requestLocationPermission.mockResolvedValueOnce(false);
    
    const { getByText } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Location access denied')).toBeTruthy();
    });
  });

  it('handles facility calling', async () => {
    const { getByText, getAllByTestId } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
    });

    const callButtons = getAllByTestId('call-button');
    fireEvent.press(callButtons[0]);

    expect(Linking.openURL).toHaveBeenCalledWith('tel:+1234567890');
  });

  it('handles get directions', async () => {
    const { getByText, getAllByTestId } = render(<EmergencyFacilityFinder />);
    
    await waitFor(() => {
      expect(getByText('Test Hospital')).toBeTruthy();
    });

    const navigationButtons = getAllByTestId('navigation-button');
    fireEvent.press(navigationButtons[0]);

    expect(Linking.openURL).toHaveBeenCalled();
  });
});
