import AsyncStorage from '@react-native-async-storage/async-storage';
import networkManager, { offlineStorage } from '../utils/networkManager';
import { retryWithBackoff, retryQueue } from '../utils/retryMechanism';

const API_URL = 'http://localhost:5000/api';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status,
      data.code
    );
  }
  
  return data;
};

const makeRequest = async (endpoint, options) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return await handleApiResponse(response);
  } catch (error) {
    if (!error.status) {
      error.name = 'NetworkError';
    }
    throw error;
  }
};

export const api = {
  // Auth
  register: async (userData) => {
    return await retryWithBackoff(async () => {
      return await makeRequest('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    });
  },

  login: async (credentials) => {
    return await retryWithBackoff(async () => {
      return await makeRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    });
  },

  getProfile: async () => {
    return await retryWithBackoff(async () => {
      return await makeRequest('/auth/profile', {
        headers: await getHeaders(),
      });
    });
  },

  // Emergencies
  createEmergency: async (emergencyData) => {
    const isOnline = await networkManager.isNetworkAvailable();
    const emergencyId = `emergency_${Date.now()}`;

    if (!isOnline) {
      await offlineStorage.saveOfflineData(emergencyId, {
        type: 'emergency',
        data: emergencyData,
      });
      
      // Queue the operation for when we're back online
      retryQueue.add(
        async () => {
          const result = await makeRequest('/emergencies', {
            method: 'POST',
            headers: await getHeaders(),
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

    return await retryWithBackoff(async () => {
      return await makeRequest('/emergencies', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(emergencyData),
      });
    });
  },

  getUserEmergencies: async () => {
    const isOnline = await networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      const offlineData = await offlineStorage.getAllUnsyncedData();
      return offlineData.filter(item => item.data.type === 'emergency');
    }

    return await retryWithBackoff(async () => {
      return await makeRequest('/emergencies/user', {
        headers: await getHeaders(),
      });
    });
  },

  updateEmergencyStatus: async (emergencyId, status) => {
    const isOnline = await networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      await offlineStorage.saveOfflineData(`status_${emergencyId}`, {
        type: 'status_update',
        data: { emergencyId, status },
      });
      
      retryQueue.add(
        async () => {
          const result = await makeRequest(`/emergencies/${emergencyId}/status`, {
            method: 'PUT',
            headers: await getHeaders(),
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

    return await retryWithBackoff(async () => {
      return await makeRequest(`/emergencies/${emergencyId}/status`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ status }),
      });
    });
  },

  // Contacts
  getContacts: async () => {
    const isOnline = await networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      const cachedContacts = await offlineStorage.getOfflineData('contacts');
      if (cachedContacts) {
        return cachedContacts.data;
      }
      throw new Error('No cached contacts available offline');
    }

    const contacts = await retryWithBackoff(async () => {
      return await makeRequest('/contacts', {
        headers: await getHeaders(),
      });
    });

    // Cache contacts for offline use
    await offlineStorage.saveOfflineData('contacts', contacts);
    return contacts;
  },

  addContact: async (contactData) => {
    const isOnline = await networkManager.isNetworkAvailable();
    const contactId = `contact_${Date.now()}`;
    
    if (!isOnline) {
      await offlineStorage.saveOfflineData(contactId, {
        type: 'contact',
        data: contactData,
      });
      
      retryQueue.add(
        async () => {
          const result = await makeRequest('/contacts', {
            method: 'POST',
            headers: await getHeaders(),
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

    return await retryWithBackoff(async () => {
      return await makeRequest('/contacts', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(contactData),
      });
    });
  },

  updateContact: async (contactId, contactData) => {
    const isOnline = await networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      await offlineStorage.saveOfflineData(`update_${contactId}`, {
        type: 'contact_update',
        data: { contactId, ...contactData },
      });
      
      retryQueue.add(
        async () => {
          const result = await makeRequest(`/contacts/${contactId}`, {
            method: 'PUT',
            headers: await getHeaders(),
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

    return await retryWithBackoff(async () => {
      return await makeRequest(`/contacts/${contactId}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(contactData),
      });
    });
  },

  deleteContact: async (contactId) => {
    const isOnline = await networkManager.isNetworkAvailable();
    
    if (!isOnline) {
      await offlineStorage.saveOfflineData(`delete_${contactId}`, {
        type: 'contact_delete',
        data: { contactId },
      });
      
      retryQueue.add(
        async () => {
          const result = await makeRequest(`/contacts/${contactId}`, {
            method: 'DELETE',
            headers: await getHeaders(),
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

    return await retryWithBackoff(async () => {
      return await makeRequest(`/contacts/${contactId}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
    });
  },
};
