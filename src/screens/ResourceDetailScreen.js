import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Download, Share, BookOpen } from 'phosphor-react-native';

// Mock data for resource details (replace with Firebase data later)
const RESOURCE_DETAILS = {
  emergency: {
    title: 'Emergency Procedures',
    color: '#E63946',
    icon: 'warning-outline',
    sections: [
      {
        title: 'In Case of Armed Robbery',
        content: [
          'Stay calm and do not resist',
          'Avoid sudden movements',
          'Remember descriptive details if possible',
          'Call emergency services once safe',
          'Report to local authorities',
        ],
      },
      {
        title: 'During Natural Disasters',
        content: [
          'Follow evacuation orders immediately',
          'Keep emergency kit accessible',
          'Stay tuned to local news',
          'Help others if safe to do so',
          'Document damage for insurance',
        ],
      },
    ],
  },
  firstaid: {
    title: 'First Aid Guide',
    color: '#2A9D8F',
    icon: 'medical-outline',
    sections: [
      {
        title: 'Basic First Aid Steps',
        content: [
          'Check the scene for danger',
          'Call for emergency help',
          'Check breathing and circulation',
          'Control severe bleeding',
          'Treat for shock',
        ],
      },
      {
        title: 'Common Injuries',
        content: [
          'Clean wounds with clean water',
          'Apply direct pressure to bleeding',
          'Elevate injured limbs',
          'Apply cold to reduce swelling',
          'Seek medical attention if severe',
        ],
      },
    ],
  },
  security: {
    title: 'Security Tips',
    color: '#457B9D',
    icon: 'shield-checkmark-outline',
    sections: [
      {
        title: 'Personal Safety',
        content: [
          'Stay aware of surroundings',
          'Travel in groups when possible',
          'Keep valuables concealed',
          'Share location with trusted contacts',
          'Know emergency exits',
        ],
      },
      {
        title: 'Home Security',
        content: [
          'Install security systems',
          'Keep doors and windows locked',
          'Use outdoor lighting',
          'Know your neighbors',
          'Have an emergency plan',
        ],
      },
    ],
  },
  contacts: {
    title: 'Emergency Contacts',
    color: '#E9C46A',
    icon: 'call-outline',
    sections: [
      {
        title: 'National Emergency Numbers',
        content: [
          'Police: 112',
          'Fire Service: 112',
          'Ambulance: 112',
          'NEMA: 0800CALLNEMA',
          'Anti-Kidnapping: 112',
        ],
      },
      {
        title: 'Important Tips',
        content: [
          'Save these numbers on speed dial',
          'Keep a written copy accessible',
          'Teach children emergency numbers',
          'Update contacts regularly',
          'Test emergency numbers periodically',
        ],
      },
    ],
  },
};

const ResourceDetailScreen = ({ route, navigation }) => {
  const { categoryId } = route.params;
  const resource = RESOURCE_DETAILS[categoryId];

  if (!resource) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Resource not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <CaretLeft size={24} color="#457B9D" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.resourceIcon}>
              <BookOpen size={32} color="#457B9D" />
            </View>
            <Text style={styles.headerTitle}>{resource.title}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {resource.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <CaretLeft size={20} color="#457B9D" />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Download size={24} color="#457B9D" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Share size={24} color="#457B9D" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: resource.color }]}
          onPress={() => {
            // TODO: Implement save functionality
            navigation.goBack();
          }}
        >
          <BookOpen size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save for Offline Access</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F1FAEE',
    padding: 15,
    borderRadius: 10,
  },
  listItemText: {
    fontSize: 16,
    color: '#1D3557',
    marginLeft: 10,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F1FAEE',
  },
  actionText: {
    fontSize: 16,
    color: '#1D3557',
    marginLeft: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#E63946',
    textAlign: 'center',
    margin: 20,
  },
});
