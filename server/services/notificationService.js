const axios = require('axios');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.expo = require('expo-server-sdk').Expo;
    this.expo = new this.expo();
  }

  // Send push notification to a single token
  async sendPushNotification(pushToken, notification) {
    try {
      if (!this.expo.isExpoPushToken(pushToken)) {
        throw new Error(`Push token ${pushToken} is not a valid Expo push token`);
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'default',
      };

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Send notifications to multiple users
  async sendBulkNotifications(userIds, notification) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        pushToken: { $exists: true }
      });

      const validTokens = users
        .map(user => user.pushToken)
        .filter(token => this.expo.isExpoPushToken(token));

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'default',
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Send notification to users in a specific area
  async sendLocationBasedNotification(center, radius, notification) {
    try {
      const users = await User.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [center.longitude, center.latitude]
            },
            $maxDistance: radius
          }
        },
        pushToken: { $exists: true }
      });

      return this.sendBulkNotifications(
        users.map(user => user._id),
        notification
      );
    } catch (error) {
      console.error('Error sending location-based notification:', error);
      throw error;
    }
  }

  // Handle notification receipts
  async handleNotificationReceipts(tickets) {
    try {
      const receiptIds = tickets
        .filter(ticket => ticket.id)
        .map(ticket => ticket.id);

      const receiptChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (let chunk of receiptChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

          for (let receiptId in receipts) {
            const { status, message, details } = receipts[receiptId];
            
            if (status === 'error') {
              console.error(
                `There was an error sending a notification: ${message}`
              );
              
              if (details && details.error) {
                console.error(`The error code is ${details.error}`);
              }
            }
          }
        } catch (error) {
          console.error('Error checking receipts:', error);
        }
      }
    } catch (error) {
      console.error('Error handling notification receipts:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
