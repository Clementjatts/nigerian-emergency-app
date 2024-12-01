import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.initializeNotifications();
  }

  async initializeNotifications() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await this.savePushToken(token);
    }
  }

  async savePushToken(token) {
    try {
      await AsyncStorage.setItem('pushToken', token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async getPushToken() {
    try {
      return await AsyncStorage.getItem('pushToken');
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async scheduleLocalNotification(title, body, data = {}, options = {}) {
    const defaultOptions = {
      sound: true,
      priority: 'high',
      vibrate: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        ...defaultOptions,
        ...options,
      },
      trigger: null, // Immediate notification
    });
  }

  async scheduleEmergencyUpdate(status, details) {
    const notifications = {
      ACCEPTED: {
        title: 'Emergency Response Update',
        body: `Help is on the way! ${details.unit} is ${details.distance.toFixed(1)}km away.`,
        priority: 'high',
      },
      ARRIVED: {
        title: 'Emergency Response Arrived',
        body: 'Emergency responders have arrived at your location.',
        priority: 'high',
      },
      COMPLETED: {
        title: 'Emergency Response Completed',
        body: 'Emergency response has been completed. Stay safe!',
        priority: 'normal',
      },
      ERROR: {
        title: 'Emergency Alert Error',
        body: 'There was an issue with your emergency alert. Please try again or call emergency services directly.',
        priority: 'high',
      },
    };

    const notification = notifications[status];
    if (notification) {
      await this.scheduleLocalNotification(
        notification.title,
        notification.body,
        { status, details },
        { priority: notification.priority }
      );
    }
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
