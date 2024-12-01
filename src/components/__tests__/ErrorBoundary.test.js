import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import ErrorBoundary from '../ErrorBoundary';
import * as Updates from 'expo-updates';
import * as Sentry from '@sentry/react-native';
import { captureError } from '../../utils/errorTracking';

// Mock expo-updates
jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(),
}));

// Mock errorTracking
jest.mock('../../utils/errorTracking', () => ({
  captureError: jest.fn(),
}));

describe('ErrorBoundary', () => {
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('renders error UI and captures error when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
    expect(captureError).toHaveBeenCalledWith(expect.any(Error));
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('reloads app when try again button is pressed', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    fireEvent.press(getByText('Try again'));
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });

  it('calls onError prop when error occurs', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(String));
  });

  it('logs error to console in development', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('resets error state when new children are received', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    rerender(
      <ErrorBoundary>
        <Text>New content</Text>
      </ErrorBoundary>
    );

    expect(getByText('New content')).toBeTruthy();
  });
});
