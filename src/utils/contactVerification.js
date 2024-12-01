import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';

export const contactVerification = {
  async verifyContact(phoneNumber) {
    try {
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.isVerified;
    } catch (error) {
      console.error('Error verifying contact:', error);
      throw error;
    }
  },

  async sendVerificationCode(phoneNumber) {
    try {
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.success;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  },

  async confirmVerificationCode(phoneNumber, code) {
    try {
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/contacts/confirm-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phoneNumber, code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.success;
    } catch (error) {
      console.error('Error confirming verification code:', error);
      throw error;
    }
  },
};
