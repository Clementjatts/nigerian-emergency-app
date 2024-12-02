import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Gear, Bell, Phone, Lock, CaretRight } from 'phosphor-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProfileEditor from '../components/ProfileEditor';
import ProfilePicture from '../components/ProfilePicture';
import SettingsManager from '../components/SettingsManager';
import { EmergencyContactManager } from '../components/EmergencyContactManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${api.url}/auth/profile`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Handle unauthorized access
        logout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(
        'Profile Error',
        'Unable to load your profile. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${api.url}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Error',
        'Unable to update your profile. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (uri) => {
    try {
      setImageLoading(true);
      const imageUrl = await api.uploadProfileImage(uri);
      await handleProfileUpdate({ ...profile, avatar: imageUrl });
      setProfile(prev => ({ ...prev, avatar: imageUrl }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings) => {
    try {
      await api.updateSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2A9D8F" />
      ) : (
        <View style={styles.content}>
          <ProfilePicture
            uri={profile.avatar}
            onImageSelected={handleImageUpload}
            loading={imageLoading}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          
          {editMode ? (
            <ProfileEditor
              profile={profile}
              onSave={handleProfileUpdate}
              onCancel={() => setEditMode(false)}
              loading={loading}
            />
          ) : (
            <View style={styles.sections}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              
              <SettingsManager 
                settings={settings} 
                onSettingChange={handleSettingsUpdate} 
              />
              
              <EmergencyContactManager />
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  sections: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#2A9D8F',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#E63946',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
