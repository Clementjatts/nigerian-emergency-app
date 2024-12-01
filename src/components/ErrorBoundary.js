import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";
import { captureError } from "../utils/errorTracking";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to Sentry
    this.logError(error, errorInfo);
  }

  logError = async (error, errorInfo) => {
    try {
      captureError(error, {
        extra: {
          componentStack: errorInfo?.componentStack,
          name: error?.name,
          message: error?.message,
          ...this.props.extraErrorData,
        },
      });

      if (__DEV__) {
        console.error("Error:", error);
        console.error("Error Info:", errorInfo);
      }
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
      // Attempt to log the logging failure
      Sentry.captureException(loggingError);
    }
  };

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error("Failed to reload app:", error);
      captureError(error, { context: "ErrorBoundary.handleRestart" });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We apologize for the inconvenience. Please try restarting the app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Restart App</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Error: {this.state.error?.toString()}
              </Text>
              <Text style={styles.debugText}>
                Stack: {this.state.errorInfo?.componentStack}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#E63946",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: "#dc3545",
    marginVertical: 5,
  },
});

export default ErrorBoundary;
