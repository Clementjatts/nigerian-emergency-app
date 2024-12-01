import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Gear, Bell, Phone, Lock, CaretRight } from 'phosphor-react-native';
import { firebaseAuth, firebaseDB, firebaseStorage } from '../utils/firebase';
import ProfileEditor from '../components/ProfileEditor';
import ProfilePicture from '../components/ProfilePicture';
import SettingsManager from '../components/SettingsManager';
import EmergencyContactManager from '../components/EmergencyContactManager';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null,
    bloodType: '',
    allergies: '',
    medications: '',
  });
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    locationEnabled: true,
    biometricEnabled: false,
    theme: 'light',
    language: 'en',
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    loadProfileData();
    setupProfileListener();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const user = firebaseAuth.getCurrentUser();
      if (user) {
        const userProfile = await firebaseDB.getUserProfile(user.uid);
        if (userProfile) {
          setProfile(prev => ({ ...prev, ...userProfile }));
        }
        const userSettings = await firebaseDB.getUserSettings(user.uid);
        if (userSettings) {
          setSettings(prev => ({ ...prev, ...userSettings }));
        }
        const contacts = await firebaseDB.getEmergencyContacts(user.uid);
        setEmergencyContacts(contacts || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const setupProfileListener = () => {
    const user = firebaseAuth.getCurrentUser();
    if (user) {
      return firebaseDB.onUserProfileChange(user.uid, (updatedProfile) => {
        if (updatedProfile) {
          setProfile(prev => ({ ...prev, ...updatedProfile }));
        }
      });
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      setLoading(true);
      const user = firebaseAuth.getCurrentUser();
      if (user) {
        await firebaseDB.updateUserProfile(user.uid, updatedProfile);
        setEditMode(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings) => {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (user) {
        await firebaseDB.updateUserSettings(user.uid, updatedSettings);
        setSettings(updatedSettings);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleImageUpload = async (uri) => {
    try {
      setImageLoading(true);
      const user = firebaseAuth.getCurrentUser();
      if (user) {
        const imageRef = `profiles/${user.uid}/avatar.jpg`;
        const downloadUrl = await firebaseStorage.uploadImage(uri, imageRef);
        await firebaseDB.updateUserProfile(user.uid, { avatar: downloadUrl });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfilePicture
          uri={profile.avatar}
          onImageSelected={handleImageUpload}
          loading={imageLoading}
          size={120}
        />
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.editButtonText}>
            {editMode ? 'Cancel Edit' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {editMode ? (
        <ProfileEditor
          profile={profile}
          onSave={handleProfileUpdate}
          onCancel={() => setEditMode(false)}
          loading={loading}
        />
      ) : (
        <>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalLabel}>Blood Type:</Text>
              <Text style={styles.medicalValue}>{profile.bloodType || 'Not specified'}</Text>
              <Text style={styles.medicalLabel}>Allergies:</Text>
              <Text style={styles.medicalValue}>{profile.allergies || 'None'}</Text>
              <Text style={styles.medicalLabel}>Medications:</Text>
              <Text style={styles.medicalValue}>{profile.medications || 'None'}</Text>
            </View>
          </View>

          <SettingsManager
            settings={settings}
            onSettingChange={handleSettingsUpdate}
          />

          <EmergencyContactManager
            contacts={emergencyContacts}
            onContactsUpdate={setEmergencyContacts}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#2A9D8F',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  medicalInfo: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  medicalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  medicalValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

export default ProfileScreen;
