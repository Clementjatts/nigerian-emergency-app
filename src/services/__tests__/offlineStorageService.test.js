import { OfflineStorageService } from '../offlineStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-file-system');

describe('OfflineStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FileSystem.documentDirectory = 'file://test-directory/';
  });

  describe('initializeOfflineStorage', () => {
    it('should create offline maps directory if it does not exist', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: false });

      await OfflineStorageService.initializeOfflineStorage();

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });

    it('should not create directory if it already exists', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: true });

      await OfflineStorageService.initializeOfflineStorage();

      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe('emergency contacts', () => {
    const mockContacts = [
      { id: 1, name: 'Emergency Contact 1', phone: '1234567890' }
    ];

    it('should save emergency contacts', async () => {
      await OfflineStorageService.saveEmergencyContacts(mockContacts);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'emergency_contacts',
        expect.any(String)
      );
    });

    it('should retrieve emergency contacts', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timestamp: Date.now(),
        data: mockContacts
      }));

      const result = await OfflineStorageService.getEmergencyContacts();

      expect(result).toEqual(mockContacts);
    });

    it('should return empty array when no contacts exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await OfflineStorageService.getEmergencyContacts();

      expect(result).toEqual([]);
    });
  });

  describe('emergency procedures', () => {
    const mockProcedures = [
      { id: 1, title: 'First Aid', content: 'Step 1...' }
    ];

    it('should save emergency procedures', async () => {
      await OfflineStorageService.saveEmergencyProcedures(mockProcedures);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'emergency_procedures',
        expect.any(String)
      );
    });

    it('should retrieve emergency procedures', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timestamp: Date.now(),
        data: mockProcedures
      }));

      const result = await OfflineStorageService.getEmergencyProcedures();

      expect(result).toEqual(mockProcedures);
    });
  });

  describe('offline maps', () => {
    it('should download map tile if it does not exist', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
      FileSystem.downloadAsync.mockResolvedValue({ uri: 'downloaded-file-uri' });

      const result = await OfflineStorageService.downloadMapTile(9.0820, 8.6753, 14);

      expect(FileSystem.downloadAsync).toHaveBeenCalled();
      expect(result).toContain('map_9.082_8.6753_14.png');
    });

    it('should not download map tile if it already exists', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: true });

      const result = await OfflineStorageService.downloadMapTile(9.0820, 8.6753, 14);

      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
      expect(result).toContain('map_9.082_8.6753_14.png');
    });
  });

  describe('offline data management', () => {
    it('should clear offline data', async () => {
      await OfflineStorageService.clearOfflineData();

      expect(FileSystem.deleteAsync).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should check if offline data is available', async () => {
      AsyncStorage.getItem.mockResolvedValue('1234567890');

      const result = await OfflineStorageService.isOfflineDataAvailable();

      expect(result).toBe(true);
    });

    it('should return false when no offline data is available', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await OfflineStorageService.isOfflineDataAvailable();

      expect(result).toBe(false);
    });
  });
});
