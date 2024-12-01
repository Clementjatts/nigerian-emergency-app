import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { MaterialIcons } from '@expo/vector-icons';

const ContactPicker = ({ onSelectContact, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          // Filter out contacts without phone numbers and sort by name
          const validContacts = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));
          setContacts(validContacts);
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to add emergency contacts'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers.some(phone =>
        phone.number.includes(searchQuery)
      )
    );
    setFilteredContacts(filtered);
  };

  const handleSelectContact = (contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      Alert.alert('Invalid Contact', 'Selected contact has no phone number');
      return;
    }

    // If contact has multiple phone numbers, show picker
    if (contact.phoneNumbers.length > 1) {
      Alert.alert(
        'Select Phone Number',
        'This contact has multiple phone numbers',
        contact.phoneNumbers.map(phone => ({
          text: `${phone.label}: ${phone.number}`,
          onPress: () => onSelectContact({ ...contact, phoneNumbers: [phone] }),
        }))
      );
    } else {
      onSelectContact(contact);
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleSelectContact(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.name[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.phoneNumbers && item.phoneNumbers[0] && (
          <Text style={styles.contactPhone}>
            {item.phoneNumbers[0].number}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="close-button"
          onPress={onClose}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Contact</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching contacts found' : 'No contacts available'}
            </Text>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
});

export default ContactPicker;
