import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// App Screens
import HomeScreen from '../screens/HomeScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import CommunityScreen from '../screens/CommunityScreen';
import NewPostScreen from '../screens/NewPostScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResourceDetailScreen from '../screens/ResourceDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContactFormScreen from '../screens/ContactFormScreen';
import EmergencyContacts from '../screens/EmergencyContacts';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E63946',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Emergency Response' }}
            />
            <Stack.Screen
              name="Emergency"
              component={EmergencyScreen}
              options={{ title: 'Emergency Alert' }}
            />
            <Stack.Screen
              name="Community"
              component={CommunityScreen}
              options={{ title: 'Community Forum' }}
            />
            <Stack.Screen
              name="NewPost"
              component={NewPostScreen}
              options={{ title: 'Create Post' }}
            />
            <Stack.Screen
              name="Resources"
              component={ResourcesScreen}
              options={{ title: 'Safety Resources' }}
            />
            <Stack.Screen
              name="ResourceDetail"
              component={ResourceDetailScreen}
              options={({ route }) => ({
                title: route.params?.categoryId
                  ? RESOURCE_DETAILS[route.params.categoryId]?.title
                  : 'Resource Details',
              })}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen
              name="AddContact"
              component={ContactFormScreen}
              options={{ title: 'Add Emergency Contact' }}
            />
            <Stack.Screen
              name="EditContact"
              component={ContactFormScreen}
              options={{ title: 'Edit Emergency Contact' }}
            />
            <Stack.Screen 
              name="EmergencyContacts" 
              component={EmergencyContacts}
              options={{
                title: 'Emergency Contacts',
                headerStyle: {
                  backgroundColor: '#E63946',
                },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
