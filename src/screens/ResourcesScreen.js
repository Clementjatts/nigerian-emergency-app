import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, CaretRight, MagnifyingGlass } from 'phosphor-react-native';

// Mock data for safety resources (replace with Firebase data later)
const SAFETY_CATEGORIES = [
  {
    id: 'emergency',
    title: 'Emergency Procedures',
    icon: 'warning-outline',
    color: '#E63946',
  },
  {
    id: 'firstaid',
    title: 'First Aid Guide',
    icon: 'medical-outline',
    color: '#2A9D8F',
  },
  {
    id: 'security',
    title: 'Security Tips',
    icon: 'shield-checkmark-outline',
    color: '#457B9D',
  },
  {
    id: 'contacts',
    title: 'Emergency Contacts',
    icon: 'call-outline',
    color: '#E9C46A',
  },
];

const EMERGENCY_NUMBERS = [
  { id: '1', name: 'Police Emergency', number: '112' },
  { id: '2', name: 'Fire Service', number: '112' },
  { id: '3', name: 'Ambulance', number: '112' },
  { id: '4', name: 'NEMA', number: '0800CALLNEMA' },
];

const ResourceCard = ({ title, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.resourceCard, { borderLeftColor: color }]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Book size={32} color={color} />
    </View>
    <Text style={styles.resourceTitle}>{title}</Text>
    <CaretRight size={24} color="#666" />
  </TouchableOpacity>
);

const EmergencyContact = ({ name, number }) => (
  <TouchableOpacity
    style={styles.contactCard}
    onPress={() => {
      Alert.alert(
        'Call Emergency Number',
        `Do you want to call ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
        ],
        { cancelable: true }
      );
    }}
  >
    <View style={styles.contactInfo}>
      <MagnifyingGlass size={24} color="#E63946" />
      <View style={styles.contactText}>
        <Text style={styles.contactName}>{name}</Text>
        <Text style={styles.contactNumber}>{number}</Text>
      </View>
    </View>
    <CaretRight size={24} color="#457B9D" />
  </TouchableOpacity>
);

const SafetyTip = ({ tip }) => (
  <View style={styles.safetyTip}>
    <MagnifyingGlass size={24} color="#457B9D" />
    <Text style={styles.safetyTipText}>{tip}</Text>
  </View>
);

const ResourcesScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleResourcePress = (categoryId) => {
    // Navigate to detailed resource screen
    navigation.navigate('ResourceDetail', { categoryId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access Resources</Text>
          <View style={styles.resourcesGrid}>
            {SAFETY_CATEGORIES.map((category) => (
              <ResourceCard
                key={category.id}
                title={category.title}
                icon={category.icon}
                color={category.color}
                onPress={() => handleResourcePress(category.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Numbers</Text>
          <View style={styles.contactsContainer}>
            {EMERGENCY_NUMBERS.map((contact) => (
              <EmergencyContact
                key={contact.id}
                name={contact.name}
                number={contact.number}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <SafetyTip tip="Save emergency numbers on speed dial for quick access." />
          <SafetyTip tip="Keep a first aid kit in your home and vehicle." />
          <SafetyTip tip="Identify safe meeting points with family members." />
          <SafetyTip tip="Stay informed about your local emergency protocols." />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              // TODO: Implement offline resources download
              Alert.alert(
                'Download Resources',
                'Would you like to download safety resources for offline access?'
              );
            }}
          >
            <MagnifyingGlass size={24} color="#fff" />
            <Text style={styles.downloadButtonText}>
              Download Resources for Offline Access
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 15,
  },
  resourcesGrid: {
    flexDirection: 'column',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resourceTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
  },
  contactsContainer: {
    marginTop: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1FAEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
  },
  contactNumber: {
    fontSize: 14,
    color: '#457B9D',
    marginTop: 2,
  },
  safetyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FAEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  safetyTipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1D3557',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#457B9D',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});
