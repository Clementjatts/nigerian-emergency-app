import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AccessibilityService {
  constructor() {
    this.screenReaderEnabled = false;
    this.highContrastEnabled = false;
    this.fontScale = 1;
    this.initialize();
  }

  async initialize() {
    // Check if screen reader is enabled
    this.screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    
    // Load saved accessibility preferences
    try {
      const preferences = await AsyncStorage.getItem('accessibilityPreferences');
      if (preferences) {
        const { highContrast, fontScale } = JSON.parse(preferences);
        this.highContrastEnabled = highContrast;
        this.fontScale = fontScale;
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error);
    }

    // Listen for screen reader changes
    AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      this.handleScreenReaderChange
    );
  }

  handleScreenReaderChange = (isEnabled) => {
    this.screenReaderEnabled = isEnabled;
  };

  async savePreferences() {
    try {
      await AsyncStorage.setItem(
        'accessibilityPreferences',
        JSON.stringify({
          highContrast: this.highContrastEnabled,
          fontScale: this.fontScale,
        })
      );
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  }

  setHighContrast(enabled) {
    this.highContrastEnabled = enabled;
    this.savePreferences();
  }

  setFontScale(scale) {
    this.fontScale = scale;
    this.savePreferences();
  }

  getColors() {
    return this.highContrastEnabled
      ? {
          primary: '#FFFFFF',
          secondary: '#000000',
          accent: '#FF0000',
          background: '#000000',
          text: '#FFFFFF',
          border: '#FFFFFF',
        }
      : {
          primary: '#2A9D8F',
          secondary: '#457B9D',
          accent: '#E63946',
          background: '#FFFFFF',
          text: '#333333',
          border: '#DDDDDD',
        };
  }

  getFontSize(baseSize) {
    return baseSize * this.fontScale;
  }

  getAccessibleProps(label, hint) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'button',
      accessibilityState: { disabled: false },
    };
  }

  announceForAccessibility(message) {
    AccessibilityInfo.announceForAccessibility(message);
  }

  cleanup() {
    AccessibilityInfo.removeEventListener(
      'screenReaderChanged',
      this.handleScreenReaderChange
    );
  }
}

export default new AccessibilityService();
