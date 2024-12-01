import auth from '@react-native-firebase/auth';
import { firebaseAuth } from './firebase';

export const phoneAuth = {
  // Send verification code
  async sendVerificationCode(phoneNumber) {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  },

  // Verify code and sign in
  async verifyCode(confirmation, code) {
    try {
      const credential = await confirmation.confirm(code);
      
      // If this is a new user, create a profile
      if (credential.additionalUserInfo?.isNewUser) {
        await firebaseAuth.updateUserProfile({
          uid: credential.user.uid,
          phone: credential.user.phoneNumber,
          provider: 'phone',
        });
      }

      return credential.user;
    } catch (error) {
      console.error('Verify code error:', error);
      throw error;
    }
  },

  // Link phone number to existing account
  async linkPhoneNumber(phoneNumber) {
    try {
      const confirmation = await auth().currentUser?.linkWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Link phone number error:', error);
      throw error;
    }
  },

  // Verify code for linked phone number
  async verifyLinkedPhoneCode(confirmation, code) {
    try {
      const credential = auth.PhoneAuthProvider.credential(
        confirmation.verificationId,
        code
      );
      const result = await auth().currentUser?.linkWithCredential(credential);
      
      // Update user profile with phone number
      await firebaseAuth.updateUserProfile({
        phone: result.user.phoneNumber,
      });

      return result.user;
    } catch (error) {
      console.error('Verify linked phone code error:', error);
      throw error;
    }
  },
};
