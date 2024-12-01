import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Bell,
  MapPin,
  Lock,
  Moon,
  Globe,
  CaretRight,
} from 'phosphor-react-native';

const SettingItem = ({ icon: Icon, title, description, value, onValueChange, type = 'switch' }) => (
  <View style={styles.settingItem}>
    <View style={styles.settingIcon}>
      <Icon size={24} color="#2A9D8F" weight="bold" />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {description && <Text style={styles.settingDescription}>{description}</Text>}
    </View>
    {type === 'switch' ? (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ddd', true: '#2A9D8F' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    ) : (
      <TouchableOpacity onPress={onValueChange} style={styles.settingAction}>
        <Text style={styles.settingValue}>{value}</Text>
        <CaretRight size={20} color="#666" />
      </TouchableOpacity>
    )}
  </View>
);

const SettingsManager = ({ settings, onSettingChange }) => {
  const handleSettingChange = (key, value) => {
    onSettingChange({ ...settings, [key]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={Bell}
          title="Push Notifications"
          description="Receive emergency alerts and updates"
          value={settings.notificationsEnabled}
          onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <SettingItem
          icon={MapPin}
          title="Location Services"
          description="Allow access to your location"
          value={settings.locationEnabled}
          onValueChange={(value) => handleSettingChange('locationEnabled', value)}
        />
        <SettingItem
          icon={Lock}
          title="Biometric Authentication"
          description="Use fingerprint or face ID"
          value={settings.biometricEnabled}
          onValueChange={(value) => handleSettingChange('biometricEnabled', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingItem
          icon={Moon}
          title="Theme"
          value={settings.theme === 'dark' ? 'Dark' : 'Light'}
          onValueChange={() => handleSettingChange('theme', settings.theme === 'dark' ? 'light' : 'dark')}
          type="select"
        />
        <SettingItem
          icon={Globe}
          title="Language"
          value={settings.language === 'en' ? 'English' : 'Nigerian'}
          onValueChange={() => handleSettingChange('language', settings.language === 'en' ? 'ng' : 'en')}
          type="select"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
});

export default SettingsManager;
