import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationSyncService {
  constructor() {
    this.db = SQLite.openDatabase('offlineLocations.db');
    this.initDatabase();
    this.setupSyncInterval();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS favorite_locations (
            id TEXT PRIMARY KEY,
            name TEXT,
            latitude REAL,
            longitude REAL,
            address TEXT,
            timestamp INTEGER,
            synced INTEGER DEFAULT 0
          )`,
          [],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async saveFavoriteLocation(location) {
    // First save locally
    await this.saveToLocalDB(location);
    
    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await this.syncWithMongoDB();
    }
  }

  async saveToLocalDB(location) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO favorite_locations 
           (id, name, latitude, longitude, address, timestamp, synced) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            location.id,
            location.name,
            location.latitude,
            location.longitude,
            location.address,
            Date.now(),
            0 // not synced
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async syncWithMongoDB() {
    try {
      // Get unsynced locations
      const unsyncedLocations = await this.getUnsyncedLocations();
      if (unsyncedLocations.length === 0) return;

      // Get user token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

      // Send to MongoDB
      const response = await axios.post(
        '/api/locations/sync',
        { locations: unsyncedLocations },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Mark as synced in local DB
      if (response.data.success) {
        await this.markAsSynced(unsyncedLocations.map(loc => loc.id));
      }
    } catch (error) {
      console.error('Error syncing with MongoDB:', error);
      // We don't throw here - failed sync will be retried later
    }
  }

  async getUnsyncedLocations() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM favorite_locations WHERE synced = 0',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async markAsSynced(locationIds) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE favorite_locations SET synced = 1 WHERE id IN (?)',
          [locationIds.join(',')],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async getFavoriteLocations() {
    // Try to sync first if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        await this.syncWithMongoDB();
        // Also pull down any new locations from MongoDB
        await this.pullFromMongoDB();
      } catch (error) {
        console.error('Error syncing locations:', error);
      }
    }

    // Return all local locations
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM favorite_locations ORDER BY timestamp DESC',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async pullFromMongoDB() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get('/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local database with MongoDB data
      for (const location of response.data) {
        await this.saveToLocalDB({
          ...location,
          synced: 1 // Mark as synced since it came from MongoDB
        });
      }
    } catch (error) {
      console.error('Error pulling from MongoDB:', error);
    }
  }

  setupSyncInterval() {
    // Try to sync every 5 minutes when online
    setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.syncWithMongoDB();
      }
    }, 5 * 60 * 1000);
  }
}

export default new LocationSyncService();
