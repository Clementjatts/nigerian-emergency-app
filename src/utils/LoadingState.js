import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Warning } from 'phosphor-react-native';

export const LoadingView = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#2A9D8F" />
    <Text style={styles.message}>{message}</Text>
  </View>
);

export const ErrorView = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Warning size={48} color="#E63946" weight="fill" />
    <Text style={styles.errorMessage}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 10,
    fontSize: 16,
    color: '#E63946',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2A9D8F',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
