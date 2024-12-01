import axios from 'axios';
import { API_URL } from '../config';
import { getAuthToken } from './authService';

class ResourceService {
  // Share emergency tip or resource
  async shareResource(data) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/resources`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing resource:', error);
      throw error;
    }
  }

  // Create community event
  async createEvent(data) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Upload resource attachment
  async uploadResourceAttachment(file) {
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
      console.error('Error uploading resource attachment:', error);
      throw error;
    }
  }

  // Get resources by category
  async getResourcesByCategory(category) {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/resources`, {
        params: { category },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting resources by category:', error);
      throw error;
    }
  }

  // Get upcoming events
  async getUpcomingEvents() {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/events/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  // Join event
  async joinEvent(eventId) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/events/${eventId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  }

  // Leave event
  async leaveEvent(eventId) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/events/${eventId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  }

  // Like resource
  async likeResource(resourceId) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/resources/${resourceId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error liking resource:', error);
      throw error;
    }
  }

  // Share resource
  async shareResourceCount(resourceId) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/resources/${resourceId}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating share count:', error);
      throw error;
    }
  }

  // Get user's resources
  async getUserResources() {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/resources/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user resources:', error);
      throw error;
    }
  }

  // Get user's events
  async getUserEvents() {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/events/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }
}

export default new ResourceService();
