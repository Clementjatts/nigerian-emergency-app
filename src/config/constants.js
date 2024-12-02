// API Configuration
const API_BASE = 'http://192.168.0.146:4000'; // Your computer's IP address

export const API_URL = `${API_BASE}/api`;
export const API_TIMEOUT = 10000; // 10 seconds

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  CONTACTS: {
    EMERGENCY: '/contacts/emergency',
  },
  SETTINGS: '/settings',
};

// For development, you can use these test credentials
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};
