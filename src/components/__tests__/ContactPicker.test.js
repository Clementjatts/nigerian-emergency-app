import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import ContactPicker from '../ContactPicker';
import * as Contacts from 'expo-contacts';

// Mock expo-contacts
jest.mock('expo-contacts');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ContactPicker', () => {
  const mockOnSelectContact = jest.fn();
  const mockOnClose = jest.fn();
  const mockContacts = [
    {
      id: '1',
      name: 'John Doe',
      phoneNumbers: [{ number: '+2341234567890' }],
    },
    {
      id: '2',
      name: 'Jane Smith',
      phoneNumbers: [{ number: '+2349876543210' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });
  });

  it('requests contacts permission on mount', async () => {
    render(<ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(Contacts.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('loads and displays contacts when permission is granted', async () => {
    const { getByText } = render(
      <ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
    });
  });

  it('shows alert when permission is denied', async () => {
    Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    render(<ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'Please grant contacts permission to add emergency contacts'
      );
    });
  });

  it('filters contacts based on search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search contacts...');
    fireEvent.changeText(searchInput, 'Jane');

    await waitFor(() => {
      expect(queryByText('John Doe')).toBeNull();
      expect(getByText('Jane Smith')).toBeTruthy();
    });
  });

  it('calls onSelectContact when a contact is selected', async () => {
    const { getByText } = render(
      <ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    fireEvent.press(getByText('John Doe'));

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      id: '1',
      name: 'John Doe',
      phoneNumbers: [{ number: '+2341234567890' }],
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is pressed', async () => {
    const { getByTestId } = render(
      <ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />
    );

    fireEvent.press(getByTestId('close-button'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles error when loading contacts fails', async () => {
    Contacts.getContactsAsync.mockRejectedValue(new Error('Failed to load contacts'));

    render(<ContactPicker onSelectContact={mockOnSelectContact} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load contacts');
    });
  });
});
