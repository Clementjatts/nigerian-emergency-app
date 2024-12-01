import axios from 'axios';
import { API_URL } from '../config';
import { getAuthToken } from './authService';
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = io(API_URL);
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
  }

  // Create a new chat room
  async createChatRoom(name, type = 'public', members = [], location = null) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/chats`, {
        name,
        type,
        members,
        location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(chatId, content, type = 'text', attachments = []) {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_URL}/api/messages`, {
        chatId,
        content,
        type,
        attachments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Emit message through socket
      this.socket.emit('new_message', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload attachment
  async uploadAttachment(file) {
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/uploads`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  // Subscribe to chat messages
  subscribeToMessages(chatId, callback) {
    this.socket.on(`messages_${chatId}`, callback);
    return () => this.socket.off(`messages_${chatId}`, callback);
  }

  // Get chat messages
  async getChatMessages(chatId, page = 1, limit = 20) {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/messages/${chatId}`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // Get user's chat rooms
  async getChatRooms() {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const token = await getAuthToken();
      await axios.put(`${API_URL}/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Leave chat room
  async leaveChatRoom(chatId) {
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/chats/${chatId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error leaving chat room:', error);
      throw error;
    }
  }

  // Clean up socket connection
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new ChatService();
