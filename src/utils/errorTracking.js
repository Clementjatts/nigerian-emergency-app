import * as Sentry from '@sentry/react-native';

export const initializeErrorTracking = () => {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN", // You'll need to replace this with your actual Sentry DSN
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    debug: __DEV__, // Enable debug in development only
    enabled: !__DEV__, // Disable in development
    tracesSampleRate: 1.0,
  });
};

export const captureError = (error, context = {}) => {
  if (__DEV__) {
    console.error(error);
  }
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};
