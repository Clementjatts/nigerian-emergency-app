# Nigerian Emergency App API Documentation

## Overview
This document provides comprehensive documentation for the Nigerian Emergency App API. The API provides endpoints for emergency response management, resource tracking, facility management, community coordination, analytics, user management, emergency alerts, resource management, emergency facilities, safety zones, community management, chat system, event management, and more.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Analytics and Reporting

#### Generate Performance Report
```http
POST /analytics/reports/performance
```
Generate a performance report for specified scope and time period.

**Request Body:**
```json
{
  "scope": "system",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "title": "Performance Report (2023)",
  "type": "performance",
  "scope": "system",
  "period": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-12-31T23:59:59Z"
  },
  "data": [
    {
      "category": "emergency_response",
      "metrics": [
        {
          "name": "Average Response Time",
          "value": 8.5,
          "trend": "down",
          "changePercentage": -15
        }
      ]
    }
  ]
}
```

#### Generate Usage Report
```http
POST /analytics/reports/usage
```
Generate a usage report for resources and facilities.

**Request Body:**
```json
{
  "scope": "resource",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-12-31T23:59:59Z"
}
```

#### Get Insights
```http
GET /analytics/insights
```
Get analytical insights for a specific metric type.

**Query Parameters:**
- `type`: Type of metrics (emergency_response, resource_usage, etc.)
- `startDate`: Start date for analysis
- `endDate`: End date for analysis

#### Track Custom Metrics
```http
POST /analytics/track
```
Track custom metrics for any entity in the system.

**Request Body:**
```json
{
  "type": "resource_usage",
  "entityId": "resource_id",
  "entityType": "Resource",
  "metrics": [
    {
      "name": "usageCount",
      "value": 5
    }
  ],
  "tags": ["ambulance", "emergency"]
}
```

#### Get Analytics Data
```http
GET /analytics
```
Query analytics data with filters.

**Query Parameters:**
- `type`: Type of analytics
- `entityType`: Type of entity
- `startDate`: Start date
- `endDate`: End date
- `tags`: Comma-separated tags

#### Get Reports
```http
GET /analytics/reports
```
Get generated reports with filters.

**Query Parameters:**
- `type`: Report type
- `scope`: Report scope
- `status`: Report status
- `startDate`: Start date
- `endDate`: End date

#### Update Report Status
```http
PATCH /analytics/reports/:id/status
```
Update the status of a report.

**Request Body:**
```json
{
  "status": "published"
}
```

### User Management

#### Register User
```http
POST /auth/register
```
Register a new user in the system.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+2341234567890",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  }
}
```

#### Login
```http
POST /auth/login
```
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Update Push Token
```http
PUT /users/push-token
```
Update user's push notification token.

**Request Body:**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### Emergency Alerts

#### Create Alert
```http
POST /emergencies
```
Create a new emergency alert.

**Request Body:**
```json
{
  "type": "MEDICAL",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "description": "Medical emergency at Victoria Island",
  "severity": "HIGH"
}
```

#### Get Nearby Alerts
```http
GET /emergencies/nearby
```
Get emergency alerts near a location.

**Query Parameters:**
- `longitude`: Location longitude
- `latitude`: Location latitude
- `radius`: Search radius in kilometers (default: 5)

#### Verify Alert
```http
PUT /emergencies/:id/verify
```
Verify an emergency alert.

**Request Body:**
```json
{
  "status": "VERIFIED",
  "verificationNotes": "Confirmed by local authorities"
}
```

### Resource Management

#### Register Resource
```http
POST /resources
```
Register a new emergency resource.

**Request Body:**
```json
{
  "type": "AMBULANCE",
  "name": "Ambulance Unit 1",
  "capacity": 4,
  "status": "AVAILABLE",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  }
}
```

#### Update Resource Status
```http
PUT /resources/:id/status
```
Update resource availability status.

**Request Body:**
```json
{
  "status": "IN_USE",
  "notes": "Responding to emergency at VI"
}
```

#### Log Resource Usage
```http
POST /resources/:id/usage
```
Log resource usage details.

**Request Body:**
```json
{
  "startTime": "2023-01-01T10:00:00Z",
  "endTime": "2023-01-01T11:30:00Z",
  "purpose": "Emergency response",
  "emergencyId": "emergency123"
}
```

### Emergency Facilities

#### Register Facility
```http
POST /facilities
```
Register a new emergency facility.

**Request Body:**
```json
{
  "name": "General Hospital Lagos",
  "type": "HOSPITAL",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "capacity": {
    "beds": 200,
    "icu": 20,
    "ambulances": 5
  },
  "services": ["EMERGENCY", "ICU", "SURGERY"]
}
```

#### Update Facility Status
```http
PUT /facilities/:id/status
```
Update facility operational status.

**Request Body:**
```json
{
  "operationalStatus": "FULLY_OPERATIONAL",
  "availableBeds": 45,
  "availableICU": 5
}
```

### Safety Zones

#### Create Safety Zone
```http
POST /safety-zones
```
Create a new safety zone.

**Request Body:**
```json
{
  "name": "VI Safe Zone",
  "type": "EVACUATION_POINT",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[3.37, 6.52], [3.38, 6.52], [3.38, 6.53], [3.37, 6.53], [3.37, 6.52]]]
  },
  "capacity": 1000,
  "facilities": ["WATER", "MEDICAL", "SHELTER"]
}
```

#### Update Zone Status
```http
PUT /safety-zones/:id/status
```
Update safety zone status.

**Request Body:**
```json
{
  "status": "ACTIVE",
  "currentCapacity": 250,
  "securityStatus": "SECURED"
}
```

### Community Management

#### Create Community
```http
POST /communities
```
Create a new community group.

**Request Body:**
```json
{
  "name": "VI Neighborhood Watch",
  "type": "NEIGHBORHOOD_WATCH",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "coverage": {
    "type": "Polygon",
    "coordinates": [[[3.37, 6.52], [3.38, 6.52], [3.38, 6.53], [3.37, 6.53], [3.37, 6.52]]]
  }
}
```

#### Join Community
```http
POST /communities/:id/members
```
Join a community group.

**Request Body:**
```json
{
  "role": "MEMBER",
  "skills": ["FIRST_AID", "FIREFIGHTING"]
}
```

### Chat System

#### Create Chat
```http
POST /chats
```
Create a new chat channel.

**Request Body:**
```json
{
  "type": "EMERGENCY_GROUP",
  "name": "VI Emergency Response",
  "participants": ["user1", "user2"],
  "emergencyId": "emergency123"
}
```

#### Send Message
```http
POST /chats/:id/messages
```
Send a message in a chat.

**Request Body:**
```json
{
  "content": "Ambulance arriving in 5 minutes",
  "type": "TEXT",
  "priority": "HIGH"
}
```

### Event Management

#### Create Event
```http
POST /events
```
Create a new safety event.

**Request Body:**
```json
{
  "title": "Emergency Response Training",
  "type": "TRAINING",
  "startTime": "2023-02-01T09:00:00Z",
  "endTime": "2023-02-01T17:00:00Z",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "capacity": 50,
  "resources": ["TRAINING_ROOM", "EQUIPMENT"]
}
```

## Models

### Analytics Model
```javascript
{
  type: String,          // Type of analytics
  entityId: ObjectId,    // ID of the related entity
  entityType: String,    // Type of the entity
  metrics: [{
    name: String,        // Metric name
    value: Mixed,        // Metric value
    timestamp: Date      // Time of measurement
  }],
  period: {
    start: Date,         // Start of period
    end: Date           // End of period
  },
  tags: [String]        // Tags for categorization
}
```

### Report Model
```javascript
{
  title: String,         // Report title
  type: String,         // Report type
  scope: String,        // Report scope
  period: {
    start: Date,        // Start of period
    end: Date          // End of period
  },
  data: [{
    category: String,   // Data category
    metrics: [{
      name: String,     // Metric name
      value: Mixed,     // Metric value
      trend: String,    // Trend direction
      changePercentage: Number
    }]
  }],
  insights: [{
    severity: String,   // Insight severity
    message: String    // Insight message
  }],
  status: String       // Report status
}
```

### User Model
```javascript
{
  fullName: String,
  email: String,
  password: String,  // Hashed
  phone: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  role: String,
  pushToken: String,
  communities: [{ type: ObjectId, ref: 'Community' }],
  createdAt: Date,
  updatedAt: Date
}
```

### Emergency Model
```javascript
{
  type: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  description: String,
  severity: String,
  status: String,
  reporter: { type: ObjectId, ref: 'User' },
  responders: [{ type: ObjectId, ref: 'User' }],
  resources: [{ type: ObjectId, ref: 'Resource' }],
  verificationStatus: String,
  verificationNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Resource Model
```javascript
{
  type: String,
  name: String,
  capacity: Number,
  status: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  facility: { type: ObjectId, ref: 'Facility' },
  currentEmergency: { type: ObjectId, ref: 'Emergency' },
  usageLog: [{
    startTime: Date,
    endTime: Date,
    purpose: String,
    emergency: { type: ObjectId, ref: 'Emergency' }
  }],
  maintenanceLog: [{
    date: Date,
    type: String,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Facility Model
```javascript
{
  name: String,
  type: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  capacity: {
    beds: Number,
    icu: Number,
    ambulances: Number
  },
  services: [String],
  operationalStatus: String,
  resources: [{ type: ObjectId, ref: 'Resource' }],
  staff: [{ type: ObjectId, ref: 'User' }],
  createdAt: Date,
  updatedAt: Date
}
```

### SafetyZone Model
```javascript
{
  name: String,
  type: String,
  geometry: {
    type: { type: String },
    coordinates: [[Number]]
  },
  capacity: Number,
  currentCapacity: Number,
  status: String,
  facilities: [String],
  securityStatus: String,
  managers: [{ type: ObjectId, ref: 'User' }],
  createdAt: Date,
  updatedAt: Date
}
```

### Community Model
```javascript
{
  name: String,
  type: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  coverage: {
    type: { type: String },
    coordinates: [[Number]]
  },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: String,
    skills: [String],
    joinedAt: Date
  }],
  resources: [{ type: ObjectId, ref: 'Resource' }],
  events: [{ type: ObjectId, ref: 'Event' }],
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Model
```javascript
{
  type: String,
  name: String,
  participants: [{ type: ObjectId, ref: 'User' }],
  emergency: { type: ObjectId, ref: 'Emergency' },
  messages: [{
    sender: { type: ObjectId, ref: 'User' },
    content: String,
    type: String,
    priority: String,
    timestamp: Date
  }],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  title: String,
  type: String,
  startTime: Date,
  endTime: Date,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  capacity: Number,
  attendees: [{ type: ObjectId, ref: 'User' }],
  resources: [String],
  status: String,
  organizer: { type: ObjectId, ref: 'User' },
  community: { type: ObjectId, ref: 'Community' },
  createdAt: Date,
  updatedAt: Date
}
```

## WebSocket Events

### Emergency Updates
```javascript
// Subscribe to emergency updates
socket.on('emergency:update', (data) => {
  // Handle emergency update
  // data: { emergencyId, type, status, location }
});

// Subscribe to nearby emergencies
socket.emit('emergency:subscribe', {
  location: { coordinates: [3.3792, 6.5244] },
  radius: 5 // km
});
```

### Chat Messages
```javascript
// Subscribe to chat messages
socket.on('chat:message', (data) => {
  // Handle new message
  // data: { chatId, message }
});

// Join chat room
socket.emit('chat:join', { chatId: 'chat123' });

// Leave chat room
socket.emit('chat:leave', { chatId: 'chat123' });
```

### Resource Updates
```javascript
// Subscribe to resource status updates
socket.on('resource:update', (data) => {
  // Handle resource update
  // data: { resourceId, status, location }
});
```

## Rate Limits

- Authentication endpoints: 5 requests per minute
- Emergency creation: 10 requests per minute
- Resource updates: 30 requests per minute
- Chat messages: 60 messages per minute
- Analytics queries: 30 requests per minute

## Security

### API Key
For third-party integrations, use API key in the header:
```
X-API-Key: your_api_key_here
```

### JWT Token
All authenticated endpoints require a valid JWT token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Data Encryption
- All sensitive data is encrypted at rest
- WebSocket connections are secured with WSS
- File uploads are scanned for malware
- Geolocation data is encrypted

### Access Control
- Role-based access control (RBAC)
- Resource-level permissions
- IP whitelisting for admin endpoints
- Rate limiting per API key

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

**Response Format:**
```json
{
  "data": [],
  "pagination": {
    "total": 100,
    "pages": 5,
    "current": 1,
    "limit": 20
  }
}
```

## Best Practices
1. Always specify date ranges to limit data volume
2. Use appropriate scopes for reports
3. Include relevant tags for better organization
4. Monitor rate limits and data quotas
5. Cache frequently accessed reports

## Changelog
- 2023-12-XX: Added Analytics and Reporting API
- 2023-XX-XX: Initial API release

## Error Responses
All endpoints may return the following error responses:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
