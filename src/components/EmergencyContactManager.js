import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import ContactRelationshipModal from './ContactRelationshipModal';

export const EmergencyContactManager = () => {
  const [contacts, setContacts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/emergency`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setEmergencyContacts(data.contacts);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot access contacts');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        setSelectedContact({
          name: data[0].name,
          phoneNumber: data[0].phoneNumbers[0].number,
        });
        setShowContactPicker(false);
        setShowRelationshipModal(true);
      }
    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert('Error', 'Failed to access contacts');
    }
  };

  const saveEmergencyContact = async (contactData) => {
    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(contactData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setEmergencyContacts([...emergencyContacts, data.contact]);
      return data.contact;
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('Error', 'Failed to save emergency contact');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEmergencyContact = async (contactId) => {
    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/emergency/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setEmergencyContacts(emergencyContacts.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      Alert.alert('Error', 'Failed to delete emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContactDetails = async (details) => {
    try {
      setLoading(true);
      const contactData = {
        ...selectedContact,
        ...details,
      };

      await saveEmergencyContact(contactData);
      setShowRelationshipModal(false);
    } catch (error) {
      console.error('Error saving contact details:', error);
      Alert.alert('Error', 'Failed to save contact details');
    } finally {
      setLoading(false);
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Delete Contact',
            'Are you sure you want to remove this emergency contact?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                onPress: () => deleteEmergencyContact(item.id),
                style: 'destructive',
              },
            ],
          );
        }}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={emergencyContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
        />
      )}
      <TouchableOpacity onPress={handleAddContact} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Emergency Contact</Text>
      </TouchableOpacity>
      <Modal
        visible={showRelationshipModal}
        animationType="slide"
        onRequestClose={() => setShowRelationshipModal(false)}
      >
        <ContactRelationshipModal
          visible={showRelationshipModal}
          onClose={() => setShowRelationshipModal(false)}
          onSave={handleSaveContactDetails}
          initialData={selectedContact}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
