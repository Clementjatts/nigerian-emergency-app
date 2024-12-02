import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { storage } from '../utils/storage';
import { Phone, User, Heart, Envelope, NotePencil } from 'phosphor-react-native';

const ContactFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editingContact = route.params?.contact;

  const [formData, setFormData] = useState({
    id: editingContact?.id || Date.now().toString(),
    name: editingContact?.name || '',
    relation: editingContact?.relation || '',
    phone: editingContact?.phone || '',
    email: editingContact?.email || '',
    notes: editingContact?.notes || '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    try {
      const contacts = await storage.getEmergencyContacts();
      let updatedContacts;

      if (editingContact) {
        updatedContacts = contacts.map((contact) =>
          contact.id === editingContact.id ? formData : contact
        );
      } else {
        updatedContacts = [...contacts, formData];
      }

      await storage.saveEmergencyContacts(updatedContacts);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDelete = async () => {
    if (!editingContact) return;

    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const contacts = await storage.getEmergencyContacts();
              const updatedContacts = contacts.filter(
                (contact) => contact.id !== editingContact.id
              );
              await storage.saveEmergencyContacts(updatedContacts);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Contact Name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship *</Text>
          <TextInput
            style={styles.input}
            value={formData.relation}
            onChangeText={(text) => setFormData({ ...formData, relation: text })}
            placeholder="e.g., Parent, Sibling, Friend"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+234 XXX XXX XXXX"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Additional information..."
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {editingContact ? 'Update Contact' : 'Save Contact'}
          </Text>
        </TouchableOpacity>

        {editingContact && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <NotePencil name="delete" size={24} color="white" />
            <Text style={styles.deleteButtonText}>Delete Contact</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export { ContactFormScreen };
export default ContactFormScreen;
