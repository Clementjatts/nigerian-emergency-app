import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Phone, Plus, Pencil, Trash, X } from 'phosphor-react-native';
import * as EmergencyContactsService from '../services/emergencyContactsService';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState({ name: '', phoneNumber: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const savedContacts = await EmergencyContactsService.getContacts();
      setContacts(savedContacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  const handleSaveContact = async () => {
    try {
      if (!currentContact.name || !currentContact.phoneNumber) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (isEditing) {
        await EmergencyContactsService.updateContact(currentContact.id, currentContact);
      } else {
        await EmergencyContactsService.addContact(currentContact);
      }

      setModalVisible(false);
      setCurrentContact({ name: '', phoneNumber: '' });
      setIsEditing(false);
      loadContacts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await EmergencyContactsService.deleteContact(contactId);
      loadContacts();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const handleCall = async (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  };

  const handleShareLocation = async () => {
    try {
      await EmergencyContactsService.shareLocationWithContacts();
      Alert.alert('Success', 'Location shared with emergency contacts');
    } catch (error) {
      Alert.alert('Error', 'Failed to share location');
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          onPress={() => handleCall(item.phoneNumber)}
          style={styles.actionButton}
        >
          <Phone size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCurrentContact(item);
            setIsEditing(true);
            setModalVisible(true);
          }}
          style={styles.actionButton}
        >
          <Pencil size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteContact(item.id)}
          style={styles.actionButton}
        >
          <Trash size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareLocation}
        >
          <Text style={styles.shareButtonText}>Share Location</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentContact({ name: '', phoneNumber: '' });
          setIsEditing(false);
          setModalVisible(true);
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Contact' : 'Add Contact'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={currentContact.name}
              onChangeText={(text) =>
                setCurrentContact({ ...currentContact, name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={currentContact.phoneNumber}
              onChangeText={(text) =>
                setCurrentContact({ ...currentContact, phoneNumber: text })
              }
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveContact}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  list: {
    flex: 1,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default EmergencyContacts;
