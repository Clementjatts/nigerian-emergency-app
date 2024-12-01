import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RELATIONSHIPS = [
  'Family',
  'Spouse',
  'Parent',
  'Sibling',
  'Friend',
  'Neighbor',
  'Doctor',
  'Caregiver',
  'Other',
];

const PRIORITIES = [
  { id: 1, label: 'Primary Contact', description: 'First person to contact in emergency' },
  { id: 2, label: 'Secondary Contact', description: 'Contact if primary is unavailable' },
  { id: 3, label: 'Tertiary Contact', description: 'Additional emergency contact' },
];

const ContactRelationshipModal = ({ visible, onClose, onSave, initialData }) => {
  const [relationship, setRelationship] = useState(initialData?.relationship || '');
  const [customRelationship, setCustomRelationship] = useState('');
  const [priority, setPriority] = useState(initialData?.priority || 3);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSave = () => {
    onSave({
      relationship: relationship === 'Other' ? customRelationship : relationship,
      priority,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Contact Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Relationship</Text>
            <View style={styles.relationshipContainer}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relationshipButton,
                    relationship === rel && styles.selectedRelationship,
                  ]}
                  onPress={() => setRelationship(rel)}
                >
                  <Text
                    style={[
                      styles.relationshipText,
                      relationship === rel && styles.selectedRelationshipText,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {relationship === 'Other' && (
              <TextInput
                style={styles.customInput}
                placeholder="Specify relationship"
                value={customRelationship}
                onChangeText={setCustomRelationship}
              />
            )}

            <Text style={styles.sectionTitle}>Priority Level</Text>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.priorityButton,
                  priority === p.id && styles.selectedPriority,
                ]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={styles.priorityLabel}>{p.label}</Text>
                <Text style={styles.priorityDescription}>{p.description}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any important notes about this contact"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Contact Details</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 4,
  },
  selectedRelationship: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  relationshipText: {
    color: '#000',
  },
  selectedRelationshipText: {
    color: '#fff',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  priorityButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPriority: {
    backgroundColor: '#f0f9ff',
    borderColor: '#007AFF',
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityDescription: {
    fontSize: 14,
    color: '#666',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactRelationshipModal;
