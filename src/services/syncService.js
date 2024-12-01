import NetInfo from '@react-native-community/netinfo';
import offlineStorage from './offlineStorage';
import api from './api'; // Your API service

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncData();
      }
    });
  }

  async syncData() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;

      // Sync emergency facilities
      await this.syncEmergencyFacilities();

      // Sync resources
      await this.syncResources();

      // Process any pending offline actions
      await offlineStorage.processSyncQueue();

      this.lastSyncTime = Date.now();
      await offlineStorage.saveData('lastSyncTime', this.lastSyncTime);

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncEmergencyFacilities() {
    try {
      const facilities = await api.getEmergencyFacilities();
      await offlineStorage.saveEmergencyFacilities(facilities);
    } catch (error) {
      console.error('Error syncing emergency facilities:', error);
    }
  }

  async syncResources() {
    try {
      const resources = await api.getResources();
      await offlineStorage.saveResources(resources);
    } catch (error) {
      console.error('Error syncing resources:', error);
    }
  }

  async forceSyncData() {
    await offlineStorage.clearCache();
    return this.syncData();
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }

  async shouldSync() {
    const lastSync = await offlineStorage.getData('lastSyncTime');
    if (!lastSync) return true;

    // Sync if last sync was more than 1 hour ago
    const ONE_HOUR = 60 * 60 * 1000;
    return Date.now() - lastSync > ONE_HOUR;
  }
}

export default new SyncService();
