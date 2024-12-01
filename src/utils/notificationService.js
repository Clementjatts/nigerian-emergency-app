import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { firebase } from './firebase';

// Notification channels for Android
export const CHANNELS = {
  EMERGENCY_ALERTS: {
    id: 'emergency_alerts',
    name: 'Emergency Alerts',
    description: 'High priority emergency notifications',
    importance: 'high',
    sound: 'emergency_alert.mp3',
  },
  RESPONDER_UPDATES: {
    id: 'responder_updates',
    name: 'Responder Updates',
    description: 'Updates for emergency responders',
    importance: 'high',
    sound: 'responder_alert.mp3',
  },
  GENERAL: {
    id: 'general_notifications',
    name: 'General Notifications',
    description: 'General app notifications',
    importance: 'default',
    sound: 'default',
  },
};

class NotificationService {
  constructor() {
    this.lastNotificationId = 0;
  }

  async init() {
    // Configure Android channels
    if (Platform.OS === 'android') {
      this.createChannels();
    }

    // Initialize notifications
    PushNotification.configure({
      onNotification: this.onNotification.bind(this),
      onRegister: this.onRegister.bind(this),
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Check and request permissions
    const enabled = await this.checkPermission();
    if (enabled) {
      // Subscribe to topics
      await this.subscribeToTopics();
      await this.getFCMToken();
    }
  }

  createChannels() {
    Object.values(CHANNELS).forEach(channel => {
      PushNotification.createChannel({
        channelId: channel.id,
        channelName: channel.name,
        channelDescription: channel.description,
        importance: channel.importance,
        playSound: true,
        soundName: channel.sound,
        vibrate: true,
      });
    });
  }

  async checkPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  }

  async getFCMToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await this.updateFCMToken(fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  async updateFCMToken(token) {
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        // Update token in user's document
        await firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .update({
            fcmToken: token,
            devicePlatform: Platform.OS,
            lastTokenUpdate: firebase.firestore.FieldValue.serverTimestamp(),
          });

        // Store token locally
        await AsyncStorage.setItem('fcmToken', token);
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  async subscribeToTopics() {
    try {
      // Subscribe to emergency alerts (all users)
      await messaging().subscribeToTopic('emergency_alerts');
      await messaging().subscribeToTopic('community_alerts');

      // Check if user is a responder
      const user = firebase.auth().currentUser;
      if (user) {
        const userDoc = await firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        
        if (userDoc.data()?.isResponder) {
          await messaging().subscribeToTopic('responder_updates');
        }
      }
    } catch (error) {
      console.error('Error subscribing to topics:', error);
    }
  }

  onRegister(token) {
    this.updateFCMToken(token.token);
  }

  onNotification(notification) {
    // Handle notification when app is in foreground
    if (notification.foreground) {
      this.displayNotification(notification);
    }

    // Handle notification tap
    if (notification.userInteraction) {
      this.handleNotificationTap(notification);
    }

    // Required on iOS only
    notification.finish(PushNotification.FetchResult.NoData);
  }

  displayNotification(notification) {
    const { title, body, data } = notification;
    const channelId = this.getChannelId(data?.type);

    PushNotification.localNotification({
      channelId,
      title,
      message: body,
      data: data,
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      priority: 'high',
      visibility: 'public',
      importance: 'high',
      allowWhileIdle: true,
      ignoreInForeground: false,
      playSound: true,
      soundName: CHANNELS[channelId]?.sound,
    });
  }

  getChannelId(type) {
    switch (type) {
      case 'EMERGENCY':
        return CHANNELS.EMERGENCY_ALERTS.id;
      case 'RESPONDER':
        return CHANNELS.RESPONDER_UPDATES.id;
      default:
        return CHANNELS.GENERAL.id;
    }
  }

  async handleNotificationTap(notification) {
    // Handle different notification types
    const { data } = notification;
    if (data?.emergencyId) {
      // Navigate to emergency details
      // You'll need to implement this navigation logic
      console.log('Navigate to emergency:', data.emergencyId);
    }
  }

  // Save notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        await firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .update({
            notificationPreferences: preferences,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

        // Store preferences locally
        await AsyncStorage.setItem(
          'notificationPreferences',
          JSON.stringify(preferences)
        );
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        const doc = await firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .get();

        return doc.data()?.notificationPreferences || this.getDefaultPreferences();
      }
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      emergencyAlerts: true,
      responderUpdates: true,
      communityAlerts: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    };
  }
}

export default new NotificationService();
