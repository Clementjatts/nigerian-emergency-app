import * as Sentry from '@sentry/react-native';
import Config from '../config';

class LoggingService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;

    Sentry.init({
      dsn: Config.SENTRY_DSN,
      environment: Config.ENV,
      release: Config.APP_VERSION,
      dist: Config.BUILD_VERSION,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      debug: Config.ENV === 'development',
      beforeSend: (event) => this.beforeSend(event),
    });

    this.initialized = true;
  }

  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request?.headers) {
      const sanitizedHeaders = { ...event.request.headers };
      ['Authorization', 'Cookie'].forEach(header => {
        if (sanitizedHeaders[header]) {
          sanitizedHeaders[header] = '[Redacted]';
        }
      });
      event.request.headers = sanitizedHeaders;
    }

    return event;
  }

  setUser(user) {
    if (!user) {
      Sentry.setUser(null);
      return;
    }

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  addBreadcrumb(category, message, data = {}) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }

  captureMessage(message, level = 'info') {
    if (Config.ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
    Sentry.captureMessage(message, level);
  }

  captureError(error, context = {}) {
    if (Config.ENV === 'development') {
      console.error(error);
    }

    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  }

  // Performance monitoring
  startTransaction(name, operation) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  // Custom logging levels
  debug(message, data = {}) {
    if (Config.ENV === 'development') {
      console.debug(message, data);
    }
    this.addBreadcrumb('debug', message, data);
  }

  info(message, data = {}) {
    if (Config.ENV === 'development') {
      console.info(message, data);
    }
    this.captureMessage(message, 'info');
  }

  warn(message, data = {}) {
    if (Config.ENV === 'development') {
      console.warn(message, data);
    }
    this.captureMessage(message, 'warning');
  }

  error(error, context = {}) {
    this.captureError(error, context);
  }

  // Analytics events
  trackEvent(eventName, properties = {}) {
    this.addBreadcrumb('analytics', eventName, properties);
    
    // You can add other analytics services here
    // For example, Firebase Analytics, Mixpanel, etc.
  }

  // Performance metrics
  measurePerformance(name, fn) {
    const transaction = this.startTransaction(name, 'performance');
    try {
      return fn();
    } finally {
      transaction.finish();
    }
  }

  async measureAsyncPerformance(name, fn) {
    const transaction = this.startTransaction(name, 'performance');
    try {
      return await fn();
    } finally {
      transaction.finish();
    }
  }
}

export default new LoggingService();
