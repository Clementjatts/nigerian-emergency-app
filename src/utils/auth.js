import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';

export const auth = {
  async signInWithPhone(phoneNumber, verificationCode) {
    try {
      const response = await fetch(`${API_URL}/auth/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, verificationCode }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      await AsyncStorage.setItem('token', data.token);
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  async signInWithSocial(provider, token) {
    try {
      const response = await fetch(`${API_URL}/auth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      await AsyncStorage.setItem('token', data.token);
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  async updateUserProfile(updates) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.user;
    } catch (error) {
      return null;
    }
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
};
