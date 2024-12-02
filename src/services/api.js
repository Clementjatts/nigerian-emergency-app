import AsyncStorage from '@react-native-async-storage/async-storage';
import networkManager, { offlineStorage } from '../utils/networkManager';
import { retryWithBackoff, retryQueue } from '../utils/retryMechanism';
import { API_URL as BASE_URL } from '../config/constants';

const API_URL = BASE_URL; // Use the URL from constants

const api = {
  url: API_URL,
  timeout: 30000, // Increased timeout to 30 seconds

  async request(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('token');
      const defaultHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.url}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  },

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login({ email, password }) {
    try {
      const response = await fetch(`${this.url}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid content type');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      return {
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON Parse error:', error);
        throw new Error('Server returned invalid response format');
      }
      throw error;
    }
  },

  getProfile() {
    return this.request('/auth/profile');
  },

  // Emergencies endpoints
  createEmergency(emergencyData) {
    const isOnline = networkManager.isNetworkAvailable();
    const emergencyId = `emergency_${Date.now()}`;

    if (!isOnline) {
      offlineStorage.saveOfflineData(emergencyId, {
        type: 'emergency',
        data: emergencyData,
      });
      
      retryQueue.add(
        async () => {
          const result = await this.request('/emergencies', {
            method: 'POST',
            body: JSON.stringify(emergencyData),
          });
          await offlineStorage.markAsSynced(emergencyId);
          return result;
        },
        emergencyId
      );

      return {
        status: 'queued',
        message: 'Emergency alert saved offline and will be sent when connected',
        emergencyId,
      };
    }

    return this.request('/emergencies', {
      method: 'POST',
      body: JSON.stringify(emergencyData),
    });
  },

  getUserEmergencies() {
    const isOnline = networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      const offlineData = offlineStorage.getAllUnsyncedData();
      return offlineData.filter(item => item.data.type === 'emergency');
    }

    return this.request('/emergencies/user');
  },

  updateEmergencyStatus(emergencyId, status) {
    const isOnline = networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      offlineStorage.saveOfflineData(`status_${emergencyId}`, {
        type: 'status_update',
        data: { emergencyId, status },
      });
      
      retryQueue.add(
        async () => {
          const result = await this.request(`/emergencies/${emergencyId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
          });
          await offlineStorage.markAsSynced(`status_${emergencyId}`);
          return result;
        },
        `status_${emergencyId}`
      );

      return {
        status: 'queued',
        message: 'Status update saved offline and will be sent when connected',
      };
    }

    return this.request(`/emergencies/${emergencyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Contacts endpoints
  getContacts() {
    const isOnline = networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      const cachedContacts = offlineStorage.getOfflineData('contacts');
      if (cachedContacts) {
        return cachedContacts.data;
      }
      throw new Error('No cached contacts available offline');
    }

    return this.request('/contacts');
  },

  addContact(contactData) {
    const isOnline = networkManager.isNetworkAvailable();
    const contactId = `contact_${Date.now()}`;
    
    if (!isOnline) {
      offlineStorage.saveOfflineData(contactId, {
        type: 'contact',
        data: contactData,
      });
      
      retryQueue.add(
        async () => {
          const result = await this.request('/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData),
          });
          await offlineStorage.markAsSynced(contactId);
          return result;
        },
        contactId
      );

      return {
        status: 'queued',
        message: 'Contact saved offline and will be synced when connected',
        contactId,
      };
    }

    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  updateContact(contactId, contactData) {
    const isOnline = networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      offlineStorage.saveOfflineData(`update_${contactId}`, {
        type: 'contact_update',
        data: { contactId, ...contactData },
      });
      
      retryQueue.add(
        async () => {
          const result = await this.request(`/contacts/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify(contactData),
          });
          await offlineStorage.markAsSynced(`update_${contactId}`);
          return result;
        },
        `update_${contactId}`
      );

      return {
        status: 'queued',
        message: 'Contact update saved offline and will be synced when connected',
      };
    }

    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  },

  deleteContact(contactId) {
    const isOnline = networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      offlineStorage.saveOfflineData(`delete_${contactId}`, {
        type: 'contact_delete',
        data: { contactId },
      });
      
      retryQueue.add(
        async () => {
          const result = await this.request(`/contacts/${contactId}`, {
            method: 'DELETE',
          });
          await offlineStorage.markAsSynced(`delete_${contactId}`);
          return result;
        },
        `delete_${contactId}`
      );

      return {
        status: 'queued',
        message: 'Contact deletion will be processed when connected',
      };
    }

    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  },
};

export default api;
