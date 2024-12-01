import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, FirstAid, MapPin, Bell, House, Users, Book, Gear } from 'phosphor-react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const EmergencyButton = ({ title, icon: Icon, onPress, color }) => (
  <TouchableOpacity
    style={[styles.emergencyButton, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Icon size={32} color="#fff" weight="bold" />
    <Text style={styles.emergencyButtonText}>{title}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ title, icon: Icon, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <Icon size={24} color="#457B9D" />
    </View>
    <Text style={styles.quickActionText}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handleEmergency = (type) => {
    navigation.navigate('Emergency', { emergencyType: type });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.email}</Text>
        </View>

        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>Emergency Assistance</Text>
          <View style={styles.emergencyGrid}>
            <EmergencyButton
              title="Emergency Call"
              icon={Phone}
              onPress={() => navigation.navigate('Emergency')}
              color="#E63946"
            />
            <EmergencyButton
              title="Find Facility"
              icon={FirstAid}
              onPress={() => navigation.navigate('EmergencyFacilityFinder')}
              color="#457B9D"
            />
            <EmergencyButton
              title="Fire"
              icon={Bell}
              onPress={() => handleEmergency('fire')}
              color="#E76F51"
            />
            <EmergencyButton
              title="Security"
              icon={MapPin}
              onPress={() => handleEmergency('security')}
              color="#457B9D"
            />
          </View>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Home"
              icon={House}
              onPress={() => navigation.navigate('Home')}
            />
            <QuickAction
              title="Community"
              icon={Users}
              onPress={() => navigation.navigate('Community')}
            />
            <QuickAction
              title="Resources"
              icon={Book}
              onPress={() => navigation.navigate('Resources')}
            />
            <QuickAction
              title="Profile"
              icon={Gear}
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </View>

        <View style={styles.safetyTipsSection}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.safetyTip}>
            <MapPin name="information-circle" size={24} color="#457B9D" />
            <Text style={styles.safetyTipText}>
              Stay alert and aware of your surroundings at all times
            </Text>
          </View>
          <View style={styles.safetyTip}>
            <Bell name="bulb" size={24} color="#457B9D" />
            <Text style={styles.safetyTipText}>
              Keep emergency numbers saved and easily accessible
            </Text>
          </View>
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
  header: {
    padding: 20,
    backgroundColor: '#F1FAEE',
  },
  welcomeText: {
    fontSize: 16,
    color: '#457B9D',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  emergencySection: {
    paddingVertical: 20,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  emergencyButton: {
    width: (width - 60) / 2,
    height: 120,
    margin: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  quickActionsSection: {
    paddingVertical: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  quickAction: {
    width: (width - 60) / 2,
    margin: 10,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#F1FAEE',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1D3557',
    textAlign: 'center',
  },
  safetyTipsSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    fontSize: 14,
    color: '#1D3557',
    marginLeft: 10,
    flex: 1,
  },
});
