const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

class SocketService {
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          throw new Error('User not found');
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user._id}`);
      
      // Join user's rooms
      this.joinUserRooms(socket);

      // Handle joining chat room
      socket.on('join_chat', async (chatId) => {
        try {
          const chat = await Chat.findById(chatId);
          if (chat && chat.members.includes(socket.user._id)) {
            socket.join(chatId);
          }
        } catch (error) {
          console.error('Error joining chat:', error);
        }
      });

      // Handle leaving chat room
      socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
      });

      // Handle new message
      socket.on('new_message', async (message) => {
        try {
          const chat = await Chat.findById(message.chatId);
          if (chat && chat.members.includes(socket.user._id)) {
            socket.to(message.chatId).emit('message_received', {
              ...message,
              sender: {
                _id: socket.user._id,
                name: socket.user.name,
                avatar: socket.user.avatar
              }
            });
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      });

      // Handle typing status
      socket.on('typing_start', (chatId) => {
        socket.to(chatId).emit('user_typing', {
          userId: socket.user._id,
          name: socket.user.name
        });
      });

      socket.on('typing_end', (chatId) => {
        socket.to(chatId).emit('user_stopped_typing', {
          userId: socket.user._id
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user._id}`);
      });
    });
  }

  // Join user to their chat rooms
  async joinUserRooms(socket) {
    try {
      const chats = await Chat.find({
        members: socket.user._id
      });

      chats.forEach(chat => {
        socket.join(chat._id.toString());
      });
    } catch (error) {
      console.error('Error joining user rooms:', error);
    }
  }

  // Emit event to specific room
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // Emit event to specific user
  emitToUser(userId, event, data) {
    this.io.to(userId.toString()).emit(event, data);
  }

  // Emit event to all connected clients
  emitToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = new SocketService();
