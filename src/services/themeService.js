import React, { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export const lightTheme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    disabled: '#8E8E93',
    inverse: '#FFFFFF',
  },
  border: '#C6C6C8',
  divider: '#C6C6C8',
  elevation: {
    1: '#00000014',
    2: '#0000001F',
    3: '#00000029',
  },
  statusBar: 'dark-content',
};

export const darkTheme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    disabled: '#3A3A3C',
    inverse: '#000000',
  },
  border: '#38383A',
  divider: '#38383A',
  elevation: {
    1: '#FFFFFF14',
    2: '#FFFFFF1F',
    3: '#FFFFFF29',
  },
  statusBar: 'light-content',
};

class ThemeService {
  static async getTheme() {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      return savedTheme || 'system';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'system';
    }
  }

  static async setTheme(theme) {
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  static useTheme() {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState('system');
    const [currentTheme, setCurrentTheme] = useState(
      systemColorScheme === 'dark' ? darkTheme : lightTheme
    );

    useEffect(() => {
      const loadTheme = async () => {
        const savedTheme = await ThemeService.getTheme();
        setTheme(savedTheme);
      };
      loadTheme();
    }, []);

    useEffect(() => {
      switch (theme) {
        case 'dark':
          setCurrentTheme(darkTheme);
          break;
        case 'light':
          setCurrentTheme(lightTheme);
          break;
        default:
          setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
      }
    }, [theme, systemColorScheme]);

    return { theme, setTheme, currentTheme };
  }
}

export default ThemeService;
