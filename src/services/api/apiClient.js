import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Config from '../../config';
import { getDeviceInfo } from '../utils/deviceInfo';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100, // Maximum requests per window
  windowMs: 60 * 1000, // 1 minute window
  requests: new Map(), // Track requests
};

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Platform': Platform.OS,
        'X-App-Version': Config.APP_VERSION,
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        if (!this.checkRateLimit()) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Add auth token if available
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device info
        const deviceInfo = await getDeviceInfo();
        config.headers['X-Device-Info'] = JSON.stringify(deviceInfo);

        return config;
      },
      (error) => {
        Sentry.captureException(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful requests if needed
        if (Config.ENV === 'development') {
          console.log(`API Success: ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error) => {
        // Handle different types of errors
        if (error.response) {
          // Server responded with error status
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              await this.handleUnauthorized();
              break;
            case 403:
              // Handle forbidden
              this.handleForbidden(error);
              break;
            case 429:
              // Handle rate limit
              this.handleRateLimit(error);
              break;
            default:
              // Log other errors
              this.logError(error);
          }
        } else if (error.request) {
          // Request made but no response
          this.logNetworkError(error);
        } else {
          // Other errors
          this.logError(error);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  checkRateLimit() {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;

    // Clean up old requests
    for (const [timestamp] of RATE_LIMIT.requests) {
      if (timestamp < windowStart) {
        RATE_LIMIT.requests.delete(timestamp);
      }
    }

    // Check if limit exceeded
    if (RATE_LIMIT.requests.size >= RATE_LIMIT.maxRequests) {
      return false;
    }

    // Add current request
    RATE_LIMIT.requests.set(now, true);
    return true;
  }

  async handleUnauthorized() {
    // Clear auth token
    await AsyncStorage.removeItem('authToken');
    // Notify auth state
    // You might want to use your auth context here
    // authContext.signOut();
  }

  handleForbidden(error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        type: 'forbidden_access',
      },
    });
  }

  handleRateLimit(error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        type: 'rate_limit_exceeded',
      },
    });
  }

  logError(error) {
    Sentry.captureException(error, {
      extra: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });

    if (Config.ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  }

  logNetworkError(error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        type: 'network_error',
      },
    });
  }

  normalizeError(error) {
    return {
      message: this.getErrorMessage(error),
      status: error.response?.status,
      code: error.response?.data?.code || 'unknown_error',
      originalError: error,
    };
  }

  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    switch (error.response?.status) {
      case 401:
        return 'Please log in to continue';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'An unexpected error occurred. Please try again later';
      default:
        return error.message || 'Something went wrong';
    }
  }

  // API methods
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }
}

export default new ApiClient();
