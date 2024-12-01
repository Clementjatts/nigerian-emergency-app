import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';

const CONTACTS_STORAGE_KEY = '@emergency_contacts';

export const addContact = async (contact) => {
  try {
    const contacts = await getContacts();
    const newContacts = [...contacts, { ...contact, id: Date.now().toString() }];
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
    return true;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

export const getContacts = async () => {
  try {
    const contactsJson = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
    return contactsJson ? JSON.parse(contactsJson) : [];
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
};

export const updateContact = async (contactId, updatedContact) => {
  try {
    const contacts = await getContacts();
    const newContacts = contacts.map(contact => 
      contact.id === contactId ? { ...contact, ...updatedContact } : contact
    );
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
    return true;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const deleteContact = async (contactId) => {
  try {
    const contacts = await getContacts();
    const newContacts = contacts.filter(contact => contact.id !== contactId);
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};

export const shareLocationWithContacts = async (message = 'Emergency! Here is my current location:') => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    const contacts = await getContacts();
    const googleMapsUrl = `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
    const fullMessage = `${message}\n${googleMapsUrl}`;

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('SMS is not available on this device');
    }

    const phoneNumbers = contacts.map(contact => contact.phoneNumber);
    await SMS.sendSMSAsync(phoneNumbers, fullMessage);
    return true;
  } catch (error) {
    console.error('Error sharing location:', error);
    throw error;
  }
};
