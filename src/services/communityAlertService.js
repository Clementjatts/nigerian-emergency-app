import axios from 'axios';
import { API_URL } from '../config';
import { getAuthToken } from './authService';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

class CommunityAlertService {
  constructor() {
    this.setupNotifications();
  }

  async setupNotifications() {
    await Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  // Create a new alert
  async createAlert(data) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/alerts`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Notify nearby users if location is provided
      if (data.location) {
        await this.notifyNearbyUsers(data.location, {
          title: data.title,
          body: data.description,
          data: { alertId: response.data._id },
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  // Upload alert image
  async uploadAlertImage(file) {
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/uploads`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading alert image:', error);
      throw error;
    }
  }

  // Get alerts within radius
  async getAlertsInRadius(center, radius) {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/alerts/nearby`, {
        params: {
          latitude: center.latitude,
          longitude: center.longitude,
          radius
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting alerts in radius:', error);
      throw error;
    }
  }

  // Verify alert
  async verifyAlert(alertId) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/alerts/${alertId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying alert:', error);
      throw error;
    }
  }

  // Report false alert
  async reportAlert(alertId, reason) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/alerts/${alertId}/report`, {
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting alert:', error);
      throw error;
    }
  }

  // Get user's alerts
  async getUserAlerts() {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/alerts/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw error;
    }
  }

  // Helper function to calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Notify nearby users
  async notifyNearbyUsers(location, notification) {
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/alerts/notify`, {
        location,
        notification
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error notifying nearby users:', error);
      throw error;
    }
  }
}

export default new CommunityAlertService();
