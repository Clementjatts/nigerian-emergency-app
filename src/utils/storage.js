import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  EMERGENCY_CONTACTS: '@emergency_contacts',
  APP_SETTINGS: '@app_settings',
  SAFETY_RESOURCES: '@safety_resources',
  OFFLINE_POSTS: '@offline_posts',
  CACHED_LOCATION: '@cached_location',
};

export const storage = {
  // User Profile
  async saveUserProfile(profile) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Emergency Contacts
  async saveEmergencyContacts(contacts) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(contacts)
      );
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      throw error;
    }
  },

  async getEmergencyContacts() {
    try {
      const contacts = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      throw error;
    }
  },

  async addEmergencyContact(contact) {
    try {
      const contacts = await this.getEmergencyContacts();
      contacts.push({ ...contact, id: Date.now().toString() });
      await this.saveEmergencyContacts(contacts);
      return contacts;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  },

  async updateEmergencyContact(updatedContact) {
    try {
      const contacts = await this.getEmergencyContacts();
      const index = contacts.findIndex((c) => c.id === updatedContact.id);
      if (index !== -1) {
        contacts[index] = updatedContact;
        await this.saveEmergencyContacts(contacts);
      }
      return contacts;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  },

  async deleteEmergencyContact(contactId) {
    try {
      const contacts = await this.getEmergencyContacts();
      const updatedContacts = contacts.filter((c) => c.id !== contactId);
      await this.saveEmergencyContacts(updatedContacts);
      return updatedContacts;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw error;
    }
  },

  // App Settings
  async saveAppSettings(settings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving app settings:', error);
      throw error;
    }
  },

  async getAppSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return settings
        ? JSON.parse(settings)
        : {
            notificationsEnabled: true,
            locationEnabled: true,
            biometricEnabled: false,
            theme: 'light',
            language: 'en',
          };
    } catch (error) {
      console.error('Error getting app settings:', error);
      throw error;
    }
  },

  // Safety Resources
  async saveSafetyResources(resources) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAFETY_RESOURCES,
        JSON.stringify(resources)
      );
    } catch (error) {
      console.error('Error saving safety resources:', error);
      throw error;
    }
  },

  async getSafetyResources() {
    try {
      const resources = await AsyncStorage.getItem(STORAGE_KEYS.SAFETY_RESOURCES);
      return resources ? JSON.parse(resources) : null;
    } catch (error) {
      console.error('Error getting safety resources:', error);
      throw error;
    }
  },

  // Offline Posts
  async saveOfflinePosts(posts) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_POSTS,
        JSON.stringify(posts)
      );
    } catch (error) {
      console.error('Error saving offline posts:', error);
      throw error;
    }
  },

  async getOfflinePosts() {
    try {
      const posts = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_POSTS);
      return posts ? JSON.parse(posts) : [];
    } catch (error) {
      console.error('Error getting offline posts:', error);
      throw error;
    }
  },

  async addOfflinePost(post) {
    try {
      const posts = await this.getOfflinePosts();
      posts.push({ ...post, id: Date.now().toString(), pendingSync: true });
      await this.saveOfflinePosts(posts);
      return posts;
    } catch (error) {
      console.error('Error adding offline post:', error);
      throw error;
    }
  },

  // Location Cache
  async saveCachedLocation(location) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_LOCATION,
        JSON.stringify(location)
      );
    } catch (error) {
      console.error('Error saving cached location:', error);
      throw error;
    }
  },

  async getCachedLocation() {
    try {
      const location = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_LOCATION);
      return location ? JSON.parse(location) : null;
    } catch (error) {
      console.error('Error getting cached location:', error);
      throw error;
    }
  },

  // Clear Storage
  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  async clearSpecific(key) {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
      throw error;
    }
  },
};
