import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ENV = {
  development: {
    API_BASE_URL: 'https://api-dev.emergency-ng.com/v1',
    SENTRY_DSN: 'your-sentry-dsn-here',
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    RATE_LIMIT: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
  },
  staging: {
    API_BASE_URL: 'https://api-staging.emergency-ng.com/v1',
    SENTRY_DSN: 'your-sentry-dsn-here',
    CACHE_TTL: 5 * 60 * 1000,
    RATE_LIMIT: {
      maxRequests: 100,
      windowMs: 60 * 1000,
    },
  },
  production: {
    API_BASE_URL: 'https://api.emergency-ng.com/v1',
    SENTRY_DSN: 'your-sentry-dsn-here',
    CACHE_TTL: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT: {
      maxRequests: 50,
      windowMs: 60 * 1000,
    },
  },
};

const getEnvVars = (env = Constants.manifest.releaseChannel) => {
  // What is the current environment?
  if (__DEV__) return ENV.development;
  if (env === 'staging') return ENV.staging;
  if (env === 'prod') return ENV.production;

  return ENV.development;
};

export default {
  ...getEnvVars(),
  ENV: Constants.manifest.releaseChannel || 'development',
  APP_VERSION: Constants.manifest.version,
  BUILD_VERSION: Constants.manifest.revisionId,
  PLATFORM: Platform.OS,
  IS_ANDROID: Platform.OS === 'android',
  IS_IOS: Platform.OS === 'ios',
};
