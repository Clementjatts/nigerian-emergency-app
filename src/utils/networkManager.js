import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkManager {
  static instance = null;
  subscribers = [];
  isConnected = true;

  static getInstance() {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  constructor() {
    this.initNetworkListener();
  }

  initNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isConnected = state.isConnected;
      this.notifySubscribers(state.isConnected);
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(isConnected) {
    this.subscribers.forEach(callback => callback(isConnected));
  }

  async isNetworkAvailable() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }
}

export const offlineStorage = {
  async saveOfflineData(key, data) {
    try {
      const timestamp = new Date().toISOString();
      const offlineData = {
        data,
        timestamp,
        synced: false,
      };
      await AsyncStorage.setItem(
        `offline_${key}`,
        JSON.stringify(offlineData)
      );
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  },

  async getOfflineData(key) {
    try {
      const data = await AsyncStorage.getItem(`offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  },

  async getAllUnsyncedData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      const unsyncedData = [];

      for (const key of offlineKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData = JSON.parse(data);
          if (!parsedData.synced) {
            unsyncedData.push({
              key: key.replace('offline_', ''),
              ...parsedData,
            });
          }
        }
      }

      return unsyncedData;
    } catch (error) {
      console.error('Error getting unsynced data:', error);
      return [];
    }
  },

  async markAsSynced(key) {
    try {
      const data = await this.getOfflineData(key);
      if (data) {
        data.synced = true;
        await AsyncStorage.setItem(
          `offline_${key}`,
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error('Error marking data as synced:', error);
    }
  },

  async removeOfflineData(key) {
    try {
      await AsyncStorage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Error removing offline data:', error);
    }
  },
};

export default NetworkManager.getInstance();
