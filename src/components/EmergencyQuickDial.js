import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Phone, Star } from 'phosphor-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmergencyQuickDial = ({ contacts = [], onAddContact }) => {
  const handleCall = async (number) => {
    const phoneNumber = Platform.OS === 'android' ? `tel:${number}` : `telprompt:${number}`;
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  };

  const handleFavorite = async (contact) => {
    try {
      const favorites = await AsyncStorage.getItem('emergencyFavorites');
      const currentFavorites = favorites ? JSON.parse(favorites) : [];
      
      const updatedFavorites = contact.isFavorite
        ? currentFavorites.filter(c => c.id !== contact.id)
        : [...currentFavorites, { ...contact, isFavorite: true }];
      
      await AsyncStorage.setItem('emergencyFavorites', JSON.stringify(updatedFavorites));
      // Trigger refresh of contacts if needed
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Emergency Contacts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddContact}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactsList}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.number}</Text>
              <Text style={styles.contactType}>{contact.type}</Text>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleFavorite(contact)}
              >
                <Star
                  size={24}
                  color={contact.isFavorite ? '#FFB800' : '#666'}
                  weight={contact.isFavorite ? 'fill' : 'regular'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(contact.number)}
              >
                <Phone size={24} color="#fff" weight="fill" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactType: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  callButton: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmergencyQuickDial;
