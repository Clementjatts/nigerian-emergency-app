import React from 'react';
import { render, act } from '@testing-library/react-native';
import EmergencyMap from '../EmergencyMap';
import * as EmergencyLocationService from '../../services/emergencyLocationService';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props) => {
    return <View testID="mock-map-view" {...props} />;
  };
  const MockMarker = (props) => {
    return <View testID="mock-marker" {...props} />;
  };
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

jest.mock('../../services/emergencyLocationService', () => ({
  getCurrentLocation: jest.fn(),
  findNearbyFacilities: jest.fn(),
}));

describe('EmergencyMap', () => {
  const mockInitialRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    EmergencyLocationService.getCurrentLocation.mockResolvedValue({
      coords: {
        latitude: mockInitialRegion.latitude,
        longitude: mockInitialRegion.longitude,
      },
    });
  });

  it('renders correctly with initial region', async () => {
    let component;
    await act(async () => {
      component = render(<EmergencyMap initialRegion={mockInitialRegion} />);
    });

    expect(component.getByTestId('mock-map-view')).toBeTruthy();
  });

  it('updates current location on mount', async () => {
    await act(async () => {
      render(<EmergencyMap initialRegion={mockInitialRegion} />);
    });

    expect(EmergencyLocationService.getCurrentLocation).toHaveBeenCalled();
  });

  it('handles location error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    EmergencyLocationService.getCurrentLocation.mockRejectedValue(new Error('Location error'));

    await act(async () => {
      render(<EmergencyMap initialRegion={mockInitialRegion} />);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting current location:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('renders markers for nearby facilities', async () => {
    const mockFacilities = [
      {
        id: '1',
        name: 'Hospital A',
        location: { lat: 37.7749, lng: -122.4194 },
        type: 'hospital',
      },
      {
        id: '2',
        name: 'Police Station B',
        location: { lat: 37.7833, lng: -122.4167 },
        type: 'police',
      },
    ];

    EmergencyLocationService.findNearbyFacilities.mockResolvedValue(mockFacilities);

    let component;
    await act(async () => {
      component = render(
        <EmergencyMap
          initialRegion={mockInitialRegion}
          showFacilities={true}
          facilityType="all"
        />
      );
    });

    const markers = component.getAllByTestId('mock-marker');
    expect(markers).toHaveLength(mockFacilities.length);
  });
});
