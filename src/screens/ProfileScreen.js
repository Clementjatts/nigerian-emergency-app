import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { User, Gear, Bell, Phone, Lock, CaretRight } from 'phosphor-react-native';
import { firebaseAuth, firebaseDB } from '../utils/firebase';
import storage from '@react-native-firebase/storage';
import { firestore } from '../utils/firebase';
import EmergencyContactManager from '../components/EmergencyContactManager';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null,
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

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          avatar: userData.avatar || null,
        });
        setSettings(userData.settings || settings);
      }

      const contacts = await firebaseDB.getEmergencyContacts();
      setEmergencyContacts(contacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await firebaseAuth.updateUserProfile({
        ...profile,
        settings,
      });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setLoading(true);
        const user = firebaseAuth.getCurrentUser();
        const reference = storage().ref(`avatars/${user.uid}`);
        
        // Convert image to blob
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        
        // Upload image
        await reference.put(blob);
        
        // Get download URL
        const downloadURL = await reference.getDownloadURL();
        
        // Update profile
        await firebaseAuth.updateUserProfile({
          ...profile,
          avatar: downloadURL,
        });
        
        setProfile(prev => ({ ...prev, avatar: downloadURL }));
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
      console.error(error);
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
    await firebaseAuth.updateUserProfile({
      ...profile,
      settings: updatedSettings,
    });
  };

  const renderSettingItem = (icon, title, value, onToggle) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          {icon === 'notifications' && <Bell size={24} color="#666" />}
          {icon === 'location-on' && <Phone size={24} color="#666" />}
          {icon === 'fingerprint' && <Lock size={24} color="#666" />}
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
          <Image
            source={
              profile.avatar
                ? { uri: profile.avatar }
                : require('../../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.editIconContainer}>
            <Gear size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {renderSettingItem(
          'notifications',
          'Push Notifications',
          settings.notificationsEnabled,
          (value) => handleSettingChange('notificationsEnabled', value)
        )}
        {renderSettingItem(
          'location-on',
          'Location Services',
          settings.locationEnabled,
          (value) => handleSettingChange('locationEnabled', value)
        )}
        {renderSettingItem(
          'fingerprint',
          'Biometric Authentication',
          settings.biometricEnabled,
          (value) => handleSettingChange('biometricEnabled', value)
        )}
      </View>

      <View style={styles.section}>
        <EmergencyContactManager />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
    borderRadius: 15,
    padding: 5,
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
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
