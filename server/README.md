# Nigerian Emergency App - Backend Server

This is the backend server for the Nigerian Emergency App, providing API endpoints and real-time communication for community features.

## Features

- Real-time chat system with Socket.IO
- Community alerts with geolocation support
- Resource sharing and emergency tips
- Community event organization
- Push notifications using Expo
- File upload support
- Authentication and authorization

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server root directory with the following variables:
```
# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nigerian-emergency-app

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880 # 5MB in bytes
UPLOAD_DIR=uploads

# Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token
```

3. Create the uploads directory:
```bash
mkdir uploads
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Chat Routes
- `POST /api/chats` - Create a new chat room
- `GET /api/chats` - Get user's chat rooms
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/messages` - Send a message
- `PUT /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/chats/:chatId/leave` - Leave chat room

### Alert Routes
- `POST /api/alerts` - Create a new alert
- `GET /api/alerts/nearby` - Get alerts within radius
- `GET /api/alerts/user` - Get user's alerts
- `POST /api/alerts/:alertId/verify` - Verify alert
- `POST /api/alerts/:alertId/report` - Report false alert
- `PATCH /api/alerts/:alertId/status` - Update alert status

### Resource Routes
- `POST /api/resources` - Create a new resource
- `GET /api/resources` - Get resources by category
- `GET /api/resources/user` - Get user's resources
- `POST /api/resources/:resourceId/like` - Like resource
- `POST /api/resources/:resourceId/share` - Share resource
- `GET /api/resources/search` - Search resources

### Event Routes
- `POST /api/events` - Create a new event
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/user` - Get user's events
- `POST /api/events/:eventId/join` - Join event
- `POST /api/events/:eventId/leave` - Leave event
- `PATCH /api/events/:eventId` - Update event
- `POST /api/events/:eventId/cancel` - Cancel event
- `GET /api/events/search` - Search events

## Real-time Events

### Socket.IO Events
- `connection` - Client connected
- `disconnect` - Client disconnected
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `new_message` - New message sent
- `message_received` - Message received
- `typing_start` - User started typing
- `typing_end` - User stopped typing

## Dependencies

- express
- mongoose
- socket.io
- jsonwebtoken
- multer
- expo-server-sdk
- cors
- dotenv

## Development Dependencies

- nodemon

## File Structure

```
server/
├── models/
│   ├── Chat.js
│   ├── Message.js
│   ├── Alert.js
│   ├── Resource.js
│   └── Event.js
├── routes/
│   ├── chatRoutes.js
│   ├── alertRoutes.js
│   ├── resourceRoutes.js
│   └── eventRoutes.js
├── services/
│   ├── socketService.js
│   └── notificationService.js
├── middleware/
│   └── upload.js
├── uploads/
├── .env
└── server.js
```

## Error Handling

The server implements centralized error handling middleware that catches and processes all errors. Errors are logged and returned to the client in a consistent format:

```json
{
  "error": "Error message"
}
```

## Security

- JWT authentication for all protected routes
- File upload validation and sanitization
- CORS configuration
- Rate limiting (recommended to implement)
- Request validation (recommended to implement)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
