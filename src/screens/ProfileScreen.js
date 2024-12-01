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
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProfileEditor from '../components/ProfileEditor';
import ProfilePicture from '../components/ProfilePicture';
import SettingsManager from '../components/SettingsManager';
import EmergencyContactManager from '../components/EmergencyContactManager';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user: authUser, logout } = useAuth();
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
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://your-express-api.com/profile/${authUser.uid}`);
      if (response.data) {
        setProfile(response.data);
      }
      const settingsResponse = await axios.get(`https://your-express-api.com/settings/${authUser.uid}`);
      if (settingsResponse.data) {
        setSettings(settingsResponse.data);
      }
      const contactsResponse = await axios.get(`https://your-express-api.com/emergency-contacts/${authUser.uid}`);
      setEmergencyContacts(contactsResponse.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      setLoading(true);
      await axios.put(`https://your-express-api.com/profile/${authUser.uid}`, updatedProfile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings) => {
    try {
      await axios.put(`https://your-express-api.com/settings/${authUser.uid}`, updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleImageUpload = async (uri) => {
    try {
      setImageLoading(true);
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      const response = await axios.post(`https://your-express-api.com/upload-image/${authUser.uid}`, formData);
      await axios.put(`https://your-express-api.com/profile/${authUser.uid}`, { avatar: response.data });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfilePicture
          uri={profile.avatar}
          onImageSelect={handleImageUpload}
          loading={imageLoading}
        />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      {editMode ? (
        <ProfileEditor
          profile={profile}
          onSave={handleProfileUpdate}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <User size={24} color="#666" />
            <Text style={styles.infoLabel}>Blood Type:</Text>
            <Text style={styles.infoValue}>{profile.bloodType || 'Not set'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Phone size={24} color="#666" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{profile.phone || 'Not set'}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <SettingsManager
          settings={settings}
          onUpdate={handleSettingsUpdate}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <EmergencyContactManager
          contacts={emergencyContacts}
          onUpdate={setEmergencyContacts}
        />
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  editButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    margin: 20,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
