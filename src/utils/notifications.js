import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationManager = {
  async registerForPushNotifications() {
    try {
      let token;

      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      await this.saveUserPushToken(token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  },

  async saveUserPushToken(token) {
    try {
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/user/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to save push token');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  },

  async scheduleLocalNotification(title, body, trigger = null) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null,
    });
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Listen for notification interactions
  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Listen for notifications received while app is foregrounded
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Categories for different types of notifications
  async setNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('EMERGENCY', [
      {
        identifier: 'RESPOND',
        buttonTitle: 'Respond Now',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: {
          isDestructive: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('COMMUNITY', [
      {
        identifier: 'VIEW',
        buttonTitle: 'View Post',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  },
};
