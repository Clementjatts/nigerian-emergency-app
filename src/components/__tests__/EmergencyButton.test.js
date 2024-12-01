import React from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';
import EmergencyButton from '../EmergencyButton';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

// Mock the native modules
jest.mock('expo-location');
jest.mock('expo-linking');
jest.mock('expo-media-library');
jest.mock('expo-camera');
jest.mock('expo-av');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Vibration
jest.mock('react-native/Libraries/Vibration/Vibration', () => ({
  vibrate: jest.fn(),
}));

describe('EmergencyButton', () => {
  let mockOnEmergencyTriggered;
  let mockOnPanicModeChange;
  let mockLocation;

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnEmergencyTriggered = jest.fn();
    mockOnPanicModeChange = jest.fn();
    mockLocation = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    };
    jest.clearAllMocks();
    
    // Setup default mock implementations
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Audio.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    MediaLibrary.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock Platform.select
    Platform.select = jest.fn().mockImplementation((obj) => obj.ios);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('requests necessary permissions on mount', async () => {
    await act(async () => {
      render(<EmergencyButton onEmergencyTriggered={mockOnEmergencyTriggered} />);
    });

    expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('triggers emergency on quick press', async () => {
    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    await act(async () => {
      fireEvent.press(button);
      await Promise.resolve(); // Flush promises
    });

    expect(Vibration.vibrate).toHaveBeenCalledWith(200);
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    expect(mockOnEmergencyTriggered).toHaveBeenCalledWith(mockLocation);
    expect(mockOnPanicModeChange).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Emergency Call',
      'Do you want to call emergency services?',
      expect.any(Array)
    );
  });

  it('starts panic mode on long press', async () => {
    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    await act(async () => {
      fireEvent(button, 'onPressIn');
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Flush promises
    });

    expect(Vibration.vibrate).toHaveBeenCalledWith(500);
    expect(mockOnPanicModeChange).toHaveBeenCalledWith(true);
  });

  it('ends panic mode on button release', async () => {
    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    // Start panic mode
    await act(async () => {
      fireEvent(button, 'onPressIn');
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // End panic mode
    await act(async () => {
      fireEvent(button, 'onPressOut');
      await Promise.resolve();
    });

    expect(mockOnPanicModeChange).toHaveBeenCalledWith(false);
  });

  it('handles permission denial gracefully', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    await act(async () => {
      fireEvent.press(button);
    });

    expect(mockOnEmergencyTriggered).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('calls emergency number when call option is selected', async () => {
    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    await act(async () => {
      fireEvent.press(button);
    });

    // Get the call action from Alert.alert mock calls
    const alertCall = Alert.alert.mock.calls[0];
    const callAction = alertCall[2].find(action => action.text === 'Call');
    
    await act(async () => {
      callAction.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith('telprompt:112');
  });

  it('stops recording when panic mode is ended', async () => {
    const mockCamera = {
      recordAsync: jest.fn().mockResolvedValue({ uri: 'test-uri' }),
      stopRecording: jest.fn(),
    };

    const mockAudioRecording = {
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn().mockReturnValue('test-audio-uri'),
    };

    Audio.Recording.createAsync.mockResolvedValue({ recording: mockAudioRecording });

    const { getByTestId } = render(
      <EmergencyButton
        onEmergencyTriggered={mockOnEmergencyTriggered}
        onPanicModeChange={mockOnPanicModeChange}
      />
    );

    const button = getByTestId('emergency-button');

    // Start panic mode
    await act(async () => {
      fireEvent(button, 'onPressIn');
      jest.advanceTimersByTime(1000);
    });

    // End panic mode
    await act(async () => {
      fireEvent(button, 'onPressOut');
    });

    expect(mockAudioRecording.stopAndUnloadAsync).toHaveBeenCalled();
    expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith('test-audio-uri');
  });
});
