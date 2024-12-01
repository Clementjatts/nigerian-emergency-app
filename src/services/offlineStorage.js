import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Storage keys
const STORAGE_KEYS = {
  EMERGENCY_FACILITIES: '@emergency_facilities',
  EMERGENCY_CONTACTS: '@emergency_contacts',
  RESOURCES: '@resources',
  USER_PROFILE: '@user_profile',
  SYNC_QUEUE: '@sync_queue',
  LAST_SYNC: '@last_sync',
  CACHE_TIMESTAMP: '@cache_timestamp',
};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

class OfflineStorage {
  constructor() {
    this.syncQueue = [];
    this.isOnline = true;
    this.setupNetworkListener();
    this.loadSyncQueue();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  async loadSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      this.syncQueue = queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  async addToSyncQueue(action) {
    try {
      this.syncQueue.push({ ...action, timestamp: Date.now() });
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));

    for (const action of queue) {
      try {
        await this.performSync(action);
      } catch (error) {
        console.error('Error processing sync action:', error);
        await this.addToSyncQueue(action);
      }
    }
  }

  async performSync(action) {
    // Implementation will vary based on action type
    switch (action.type) {
      case 'UPDATE_PROFILE':
        // Sync with backend
        break;
      case 'ADD_EMERGENCY_CONTACT':
        // Sync with backend
        break;
      // Add more cases as needed
    }
  }

  async saveData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async getData(key) {
    try {
      const result = await AsyncStorage.getItem(key);
      if (!result) return null;

      const { data, timestamp } = JSON.parse(result);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRATION;

      if (isExpired && this.isOnline) {
        // If cache is expired and we're online, we should refresh the data
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting data:', error);
      throw error;
    }
  }

  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const timestamp = Date.now();

      for (const key of keys) {
        const result = await AsyncStorage.getItem(key);
        if (!result) continue;

        const data = JSON.parse(result);
        if (data.timestamp && timestamp - data.timestamp > CACHE_EXPIRATION) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Specific data type methods
  async saveEmergencyFacilities(facilities) {
    await this.saveData(STORAGE_KEYS.EMERGENCY_FACILITIES, facilities);
  }

  async getEmergencyFacilities() {
    return await this.getData(STORAGE_KEYS.EMERGENCY_FACILITIES);
  }

  async saveResources(resources) {
    await this.saveData(STORAGE_KEYS.RESOURCES, resources);
  }

  async getResources() {
    return await this.getData(STORAGE_KEYS.RESOURCES);
  }

  async saveUserProfile(profile) {
    await this.saveData(STORAGE_KEYS.USER_PROFILE, profile);
    if (!this.isOnline) {
      await this.addToSyncQueue({
        type: 'UPDATE_PROFILE',
        data: profile,
      });
    }
  }

  async getUserProfile() {
    return await this.getData(STORAGE_KEYS.USER_PROFILE);
  }

  // Cache management
  async clearCache() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        totalSize += data ? new Blob([data]).size : 0;
      }

      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }
}

export default new OfflineStorage();
