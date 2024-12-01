import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import networkManager from './src/utils/networkManager';
import offlineDataManager from './src/services/offlineDataManager';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
});

const OfflineBanner = () => (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineText}>
      You are offline. Some features may be limited.
    </Text>
  </View>
);

const AppContent = () => {
  const { currentTheme } = useTheme();
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
    <>
      <StatusBar
        barStyle={currentTheme.statusBar}
        backgroundColor={currentTheme.background}
      />
      <NavigationContainer
        theme={{
          dark: currentTheme === 'dark',
          colors: {
            primary: currentTheme.primary,
            background: currentTheme.background,
            card: currentTheme.surface,
            text: currentTheme.text.primary,
            border: currentTheme.border,
            notification: currentTheme.primary,
          },
        }}
      >
        <AuthProvider>
          {!isOnline && <OfflineBanner />}
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
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
