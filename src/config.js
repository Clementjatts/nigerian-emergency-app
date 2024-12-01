export const API_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:3000';

export const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};
