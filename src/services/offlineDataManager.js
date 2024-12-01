import AsyncStorage from '@react-native-async-storage/async-storage';
import networkManager from '../utils/networkManager';

const STORAGE_KEYS = {
  EMERGENCY_DATA: '@emergency_data',
  RESOURCES: '@resources',
  USER_DATA: '@user_data',
  PENDING_ACTIONS: '@pending_actions',
  CACHE_MANIFEST: '@cache_manifest',
};

const CACHE_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 50 * 1024 * 1024, // 50MB
};

class OfflineDataManager {
  constructor() {
    this.pendingActions = [];
    this.cacheManifest = new Map();
    this.initialize();
  }

  async initialize() {
    await this.loadPendingActions();
    await this.loadCacheManifest();
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    networkManager.subscribe(async (isConnected) => {
      if (isConnected) {
        await this.syncPendingActions();
      }
    });
  }

  async loadPendingActions() {
    try {
      const actions = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      this.pendingActions = actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  async loadCacheManifest() {
    try {
      const manifest = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_MANIFEST);
      this.cacheManifest = new Map(manifest ? JSON.parse(manifest) : []);
    } catch (error) {
      console.error('Error loading cache manifest:', error);
    }
  }

  async saveCacheManifest() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHE_MANIFEST,
        JSON.stringify(Array.from(this.cacheManifest.entries()))
      );
    } catch (error) {
      console.error('Error saving cache manifest:', error);
    }
  }

  async cacheData(key, data, options = {}) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (options.maxAge || CACHE_CONFIG.maxAge),
        size: new Blob([JSON.stringify(data)]).size,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      this.cacheManifest.set(key, {
        expires: cacheEntry.expires,
        size: cacheEntry.size,
      });
      await this.saveCacheManifest();
      await this.enforceStorageLimit();
    } catch (error) {
      console.error('Error caching data:', error);
      throw error;
    }
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, expires } = JSON.parse(cached);
      if (Date.now() > expires) {
        await this.removeCachedData(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async removeCachedData(key) {
    try {
      await AsyncStorage.removeItem(key);
      this.cacheManifest.delete(key);
      await this.saveCacheManifest();
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  async enforceStorageLimit() {
    try {
      let totalSize = 0;
      const entries = Array.from(this.cacheManifest.entries());
      
      // Calculate total cache size
      entries.forEach(([, meta]) => {
        totalSize += meta.size;
      });

      if (totalSize > CACHE_CONFIG.maxSize) {
        // Sort by expiration date, oldest first
        entries.sort((a, b) => a[1].expires - b[1].expires);

        // Remove oldest entries until we're under the limit
        while (totalSize > CACHE_CONFIG.maxSize && entries.length) {
          const [key, meta] = entries.shift();
          await this.removeCachedData(key);
          totalSize -= meta.size;
        }
      }
    } catch (error) {
      console.error('Error enforcing storage limit:', error);
    }
  }

  async addPendingAction(action) {
    try {
      this.pendingActions.push({
        ...action,
        timestamp: Date.now(),
        retries: 0,
      });
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  }

  async syncPendingActions() {
    if (!networkManager.isConnected || this.pendingActions.length === 0) return;

    const actions = [...this.pendingActions];
    this.pendingActions = [];
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify([]));

    for (const action of actions) {
      try {
        await this.executePendingAction(action);
      } catch (error) {
        console.error('Error executing pending action:', error);
        if (action.retries < 3) {
          action.retries += 1;
          await this.addPendingAction(action);
        }
      }
    }
  }

  async executePendingAction(action) {
    // Implementation will depend on your API structure
    switch (action.type) {
      case 'UPDATE_EMERGENCY_CONTACT':
        // await api.updateEmergencyContact(action.data);
        break;
      case 'UPDATE_USER_PROFILE':
        // await api.updateUserProfile(action.data);
        break;
      // Add more cases as needed
    }
  }

  // Utility methods
  async getCacheSize() {
    let totalSize = 0;
    this.cacheManifest.forEach(meta => {
      totalSize += meta.size;
    });
    return totalSize;
  }

  async clearCache() {
    try {
      const keys = Array.from(this.cacheManifest.keys());
      await AsyncStorage.multiRemove(keys);
      this.cacheManifest.clear();
      await this.saveCacheManifest();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async clearExpiredCache() {
    try {
      const now = Date.now();
      const expiredKeys = Array.from(this.cacheManifest.entries())
        .filter(([, meta]) => meta.expires < now)
        .map(([key]) => key);

      await AsyncStorage.multiRemove(expiredKeys);
      expiredKeys.forEach(key => this.cacheManifest.delete(key));
      await this.saveCacheManifest();
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
}

export default new OfflineDataManager();
