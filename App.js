import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import networkManager from './src/utils/networkManager';
import offlineDataManager from './src/services/offlineDataManager';

const OfflineBanner = () => (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineText}>
      You are offline. Some features may be limited.
    </Text>
  </View>
);

export default function App() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = networkManager.subscribe(setIsOnline);

    // Initialize offline data manager
    offlineDataManager.initialize().catch(error => {
      console.error('Error initializing offline data manager:', error);
    });

    // Clean up expired cache periodically
    const cacheCleanupInterval = setInterval(() => {
      offlineDataManager.clearExpiredCache().catch(error => {
        console.error('Error clearing expired cache:', error);
      });
    }, 60 * 60 * 1000); // Every hour

    return () => {
      unsubscribe();
      clearInterval(cacheCleanupInterval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          {!isOnline && <OfflineBanner />}
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#E63946',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
