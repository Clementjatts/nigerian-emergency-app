import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';
import auth from '@react-native-firebase/auth';
import { firebaseAuth } from './firebase';

WebBrowser.maybeCompleteAuthSession();

// Replace these with your own credentials
const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
const FACEBOOK_APP_ID = 'your-facebook-app-id';

export const socialAuth = {
  // Google Sign In Configuration
  useGoogleAuth() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      responseType: ResponseType.IdToken,
      scopes: ['profile', 'email'],
    });

    const handleGoogleSignIn = async () => {
      try {
        const result = await promptAsync();
        if (result?.type === 'success') {
          const { id_token } = result.params;
          const credential = auth.GoogleAuthProvider.credential(id_token);
          const userCredential = await auth().signInWithCredential(credential);
          
          // Create or update user profile
          await firebaseAuth.updateUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            fullName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            provider: 'google',
          });

          return userCredential.user;
        }
      } catch (error) {
        console.error('Google Sign In Error:', error);
        throw error;
      }
    };

    return {
      request,
      handleGoogleSignIn,
    };
  },

  // Facebook Sign In Configuration
  useFacebookAuth() {
    const [request, response, promptAsync] = Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,
      responseType: ResponseType.Token,
    });

    const handleFacebookSignIn = async () => {
      try {
        const result = await promptAsync();
        if (result?.type === 'success') {
          const { access_token } = result.params;
          const credential = auth.FacebookAuthProvider.credential(access_token);
          const userCredential = await auth().signInWithCredential(credential);

          // Create or update user profile
          await firebaseAuth.updateUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            fullName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            provider: 'facebook',
          });

          return userCredential.user;
        }
      } catch (error) {
        console.error('Facebook Sign In Error:', error);
        throw error;
      }
    };

    return {
      request,
      handleFacebookSignIn,
    };
  },
};
