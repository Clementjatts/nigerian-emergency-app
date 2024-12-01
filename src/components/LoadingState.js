import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import accessibilityService from '../services/accessibilityService';

const LoadingState = ({ message = 'Loading...', size = 'large' }) => {
  const { currentTheme } = useTheme();

  const accessibleProps = accessibilityService.getAccessibleProps(
    message,
    'Loading in progress'
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.background }
      ]}
      {...accessibleProps}
    >
      <ActivityIndicator
        size={size}
        color={currentTheme.primary}
      />
      <Text
        style={[
          styles.message,
          {
            color: currentTheme.text.primary,
            fontSize: accessibilityService.getFontSize(16)
          }
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
  },
});

export default LoadingState;
