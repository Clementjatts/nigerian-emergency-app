import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import LocationSharing from '../LocationSharing';
import { EmergencyLocationService } from '../../services/emergencyLocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Share from 'expo-sharing';

// Mock the required services and components
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-contacts');
jest.mock('expo-sharing');
jest.mock('../../services/emergencyLocationService');
jest.mock('../../components/EmergencyMap', () => {
  const { View } = require('react-native');
  return function MockEmergencyMap(props) {
    return <View testID="mock-emergency-map" {...props} />;
  };
});

describe('LocationSharing', () => {
  const mockLocation = {
    coords: {
      latitude: 9.0820,
      longitude: 8.6753,
    },
  };

  const mockContact = {
    id: '1',
    name: 'Test Contact',
    phoneNumbers: [{ number: '1234567890' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    EmergencyLocationService.getCurrentLocation.mockResolvedValue(mockLocation);
    AsyncStorage.getItem.mockResolvedValue(null);
    Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Contacts.getContactsAsync.mockResolvedValue({ data: [mockContact] });
  });

  it('renders correctly with initial state', async () => {
    const { getByText } = render(<LocationSharing />);
    
    await waitFor(() => {
      expect(getByText('Location Sharing')).toBeTruthy();
      expect(getByText('Sharing Inactive')).toBeTruthy();
      expect(getByText('No trusted contacts added yet')).toBeTruthy();
    });
  });

  it('loads trusted contacts on mount', async () => {
    const mockContacts = [
      { id: '1', name: 'Saved Contact', phoneNumber: '0987654321' },
    ];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockContacts));

    const { getByText } = render(<LocationSharing />);
    
    await waitFor(() => {
      expect(getByText('Saved Contact')).toBeTruthy();
    });
  });

  it('handles adding new contact', async () => {
    const { getByText } = render(<LocationSharing />);
    
    await act(async () => {
      fireEvent.press(getByText('No trusted contacts added yet'));
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  it('handles removing contact', async () => {
    const mockContacts = [
      { id: '1', name: 'Test Contact', phoneNumber: '1234567890' },
    ];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockContacts));

    const { getByTestId } = render(<LocationSharing />);
    
    await waitFor(() => {
      const removeButton = getByTestId('remove-contact-1');
      fireEvent.press(removeButton);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'trusted_contacts',
      JSON.stringify([])
    );
  });

  it('handles toggling location sharing', async () => {
    const { getByTestId } = render(<LocationSharing />);
    
    await waitFor(() => {
      const toggle = getByTestId('location-sharing-toggle');
      fireEvent(toggle, 'valueChange', true);
    });

    expect(EmergencyLocationService.startLocationSharing).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'location_sharing_active',
      expect.any(String)
    );
  });

  it('handles stopping location sharing', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
      isActive: true,
      id: 'test-emergency'
    }));

    const { getByTestId } = render(<LocationSharing />);
    
    await waitFor(() => {
      const toggle = getByTestId('location-sharing-toggle');
      fireEvent(toggle, 'valueChange', false);
    });

    expect(EmergencyLocationService.stopLocationSharing).toHaveBeenCalledWith('test-emergency');
  });

  it('shares location with contacts when sharing is enabled', async () => {
    const mockContacts = [
      { id: '1', name: 'Test Contact', phoneNumber: '1234567890' },
    ];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockContacts));

    const { getByTestId } = render(<LocationSharing />);
    
    await waitFor(() => {
      const toggle = getByTestId('location-sharing-toggle');
      fireEvent(toggle, 'valueChange', true);
    });

    expect(Share.share).toHaveBeenCalled();
  });

  it('handles contacts permission denial', async () => {
    Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { getByText } = render(<LocationSharing />);
    
    await act(async () => {
      fireEvent.press(getByText('No trusted contacts added yet'));
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
