import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import accessibilityService from '../services/accessibilityService';

const FeedbackToast = ({
  message,
  type = 'info',
  duration = 3000,
  onPress,
  onDismiss,
}) => {
  const { currentTheme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    show();
    if (type === 'error') {
      Vibration.vibrate(200);
    }
    accessibilityService.announceForAccessibility(message);

    const timer = setTimeout(() => {
      hide();
    }, duration);

    return () => {
      clearTimeout(timer);
      hide();
    };
  }, [message]);

  const show = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return currentTheme.success;
      case 'error':
        return currentTheme.error;
      case 'warning':
        return currentTheme.warning;
      default:
        return currentTheme.primary;
    }
  };

  const accessibleProps = accessibilityService.getAccessibleProps(
    message,
    type === 'error' ? 'Alert: ' + message : message
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...accessibleProps}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          if (onPress) {
            onPress();
          }
          hide();
        }}
      >
        <Text
          style={[
            styles.message,
            {
              color: currentTheme.text.inverse,
              fontSize: accessibilityService.getFontSize(16),
            },
          ]}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default FeedbackToast;
