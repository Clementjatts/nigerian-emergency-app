import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';

const OFFLINE_MAPS_DIR = `${FileSystem.documentDirectory}offline_maps/`;
const EMERGENCY_CONTACTS_KEY = 'emergency_contacts';
const EMERGENCY_PROCEDURES_KEY = 'emergency_procedures';
const OFFLINE_SYNC_TIMESTAMP = 'offline_sync_timestamp';

export class OfflineStorageService {
  static async initializeOfflineStorage() {
    try {
      // Create offline maps directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_MAPS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_MAPS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing offline storage:', error);
      throw error;
    }
  }

  static async saveEmergencyContacts(contacts) {
    try {
      await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: contacts
      }));
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      throw error;
    }
  }

  static async getEmergencyContacts() {
    try {
      const contacts = await AsyncStorage.getItem(EMERGENCY_CONTACTS_KEY);
      return contacts ? JSON.parse(contacts).data : [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      throw error;
    }
  }

  static async saveEmergencyProcedures(procedures) {
    try {
      await AsyncStorage.setItem(EMERGENCY_PROCEDURES_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: procedures
      }));
    } catch (error) {
      console.error('Error saving emergency procedures:', error);
      throw error;
    }
  }

  static async getEmergencyProcedures() {
    try {
      const procedures = await AsyncStorage.getItem(EMERGENCY_PROCEDURES_KEY);
      return procedures ? JSON.parse(procedures).data : [];
    } catch (error) {
      console.error('Error getting emergency procedures:', error);
      throw error;
    }
  }

  static async downloadMapTile(latitude, longitude, zoom) {
    try {
      const fileName = `map_${latitude}_${longitude}_${zoom}.png`;
      const fileUri = `${OFFLINE_MAPS_DIR}${fileName}`;

      // Check if tile already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        return fileUri;
      }

      // Download map tile
      const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},${zoom},0,0/256x256?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
      await FileSystem.downloadAsync(mapUrl, fileUri);

      return fileUri;
    } catch (error) {
      console.error('Error downloading map tile:', error);
      throw error;
    }
  }

  static async downloadOfflineArea(centerLat, centerLng, radiusKm) {
    try {
      const zoomLevels = [12, 14, 16]; // Different zoom levels for offline use
      const tilesToDownload = [];

      // Calculate tile coordinates for each zoom level
      zoomLevels.forEach(zoom => {
        // Calculate number of tiles needed based on radius and zoom level
        const tilesNeeded = Math.ceil(radiusKm * (2 ** zoom) / 156.543);
        
        for (let x = -tilesNeeded; x <= tilesNeeded; x++) {
          for (let y = -tilesNeeded; y <= tilesNeeded; y++) {
            const lat = centerLat + (y * 0.01);
            const lng = centerLng + (x * 0.01);
            tilesToDownload.push({ lat, lng, zoom });
          }
        }
      });

      // Download tiles in parallel with rate limiting
      const chunks = this.chunkArray(tilesToDownload, 5);
      for (const chunk of chunks) {
        await Promise.all(chunk.map(tile => 
          this.downloadMapTile(tile.lat, tile.lng, tile.zoom)
        ));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      }

      await AsyncStorage.setItem(OFFLINE_SYNC_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error downloading offline area:', error);
      throw error;
    }
  }

  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async clearOfflineData() {
    try {
      await FileSystem.deleteAsync(OFFLINE_MAPS_DIR, { idempotent: true });
      await AsyncStorage.multiRemove([
        EMERGENCY_CONTACTS_KEY,
        EMERGENCY_PROCEDURES_KEY,
        OFFLINE_SYNC_TIMESTAMP
      ]);
      await this.initializeOfflineStorage();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  static async isOfflineDataAvailable() {
    try {
      const timestamp = await AsyncStorage.getItem(OFFLINE_SYNC_TIMESTAMP);
      return !!timestamp;
    } catch (error) {
      console.error('Error checking offline data availability:', error);
      return false;
    }
  }
}
