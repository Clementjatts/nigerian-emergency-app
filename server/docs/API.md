# Nigerian Emergency App API Documentation

## Overview
This document provides comprehensive documentation for the Nigerian Emergency App API. The API provides endpoints for emergency response management, resource tracking, facility management, community coordination, and analytics.

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

### User Management

#### Register User
```http
POST /users/register
```
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+2341234567890",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  }
}
```

#### Login
```http
POST /users/login
```
Authenticate user and get JWT token.

#### Update Push Token
```http
POST /users/push-token
```
Update user's push notification token.

#### Get Nearby Users
```http
GET /users/nearby
```
Find users within a specified radius.

### Emergency Alerts

#### Create Alert
```http
POST /alerts
```
Create a new emergency alert.

**Request Body:**
```json
{
  "title": "Medical Emergency",
  "description": "Need immediate medical assistance",
  "type": "emergency",
  "severity": "high",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  }
}
```

#### Get Nearby Alerts
```http
GET /alerts/nearby
```
Get alerts within specified radius.

#### Verify Alert
```http
POST /alerts/:alertId/verify
```
Verify an emergency alert.

### Resource Management

#### Create Resource
```http
POST /resources
```
Register a new emergency resource.

**Request Body:**
```json
{
  "name": "Ambulance Unit 1",
  "type": "vehicle",
  "status": "available",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "specifications": {
    "capacity": 2,
    "equipment": ["stretcher", "first_aid"]
  }
}
```

#### Track Resource Usage
```http
POST /resources/:id/usage
```
Log resource usage.

#### Log Maintenance
```http
POST /resources/:id/maintenance
```
Log resource maintenance activity.

### Emergency Facilities

#### Register Facility
```http
POST /emergency-facilities
```
Register a new emergency facility.

**Request Body:**
```json
{
  "name": "City General Hospital",
  "facilityType": "hospital",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "services": ["emergency", "trauma", "ambulance"],
  "operatingHours": [
    {
      "day": "monday",
      "open": "00:00",
      "close": "23:59"
    }
  ]
}
```

#### Update Facility Status
```http
PATCH /emergency-facilities/:id/status
```
Update facility operational status.

#### Find Nearby Facilities
```http
GET /emergency-facilities/nearby
```
Find emergency facilities within radius.

### Safety Zones

#### Create Safety Zone
```http
POST /safety-zones
```
Create a new safety zone.

**Request Body:**
```json
{
  "name": "Safe Haven Area",
  "description": "24/7 monitored safe zone",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[3.3792, 6.5244], [3.3793, 6.5244], [3.3793, 6.5245], [3.3792, 6.5245], [3.3792, 6.5244]]]
  }
}
```

#### Check Point Safety
```http
POST /safety-zones/check-point
```
Check if a location is within any safety zone.

### Community Management

#### Create Community
```http
POST /communities
```
Create a new community group.

**Request Body:**
```json
{
  "name": "Lekki Safety Network",
  "description": "Community safety group for Lekki area",
  "type": "neighborhood",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "coverageArea": {
    "type": "Polygon",
    "coordinates": [[[3.3792, 6.5244], [3.3793, 6.5244], [3.3793, 6.5245], [3.3792, 6.5245], [3.3792, 6.5244]]]
  }
}
```

#### Join Community
```http
POST /communities/:id/join
```
Join an existing community.

#### Community Updates
```http
POST /communities/:id/updates
```
Post community safety updates.

### Chat System

#### Create Chat
```http
POST /chats
```
Create a new chat session.

**Request Body:**
```json
{
  "type": "emergency",
  "participants": ["user_id1", "user_id2"],
  "metadata": {
    "emergencyType": "medical"
  }
}
```

#### Send Message
```http
POST /chats/:id/messages
```
Send a message in a chat.

#### Emergency Status
```http
PATCH /chats/:id/emergency
```
Update chat emergency status.

### Event Management

#### Create Event
```http
POST /events
```
Create a safety or emergency response event.

**Request Body:**
```json
{
  "title": "Emergency Response Training",
  "description": "First aid and emergency response training",
  "date": "2024-01-15T10:00:00Z",
  "location": {
    "type": "Point",
    "coordinates": [3.3792, 6.5244]
  },
  "type": "training"
}
```

#### Update Event
```http
PATCH /events/:id
```
Update event details.

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

## Models

### User Model
```javascript
{
  name: String,
  email: String,
  phone: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  pushToken: String
}
```

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

## WebSocket Events

### Real-time Updates
```javascript
// Connect to WebSocket
socket.connect('ws://localhost:3000', {
  auth: { token: 'jwt_token' }
});

// Emergency alert
socket.on('emergency_alert', (data) => {
  // Handle new emergency alert
});

// Resource status update
socket.on('resource_status', (data) => {
  // Handle resource status change
});

// Chat message
socket.on('new_message', (data) => {
  // Handle new chat message
});
```

## Best Practices
1. Always specify date ranges to limit data volume
2. Use appropriate scopes for reports
3. Include relevant tags for better organization
4. Monitor rate limits and data quotas
5. Cache frequently accessed reports
6. Implement proper error handling
7. Use WebSocket connections for real-time features
8. Follow security best practices for sensitive data

## Rate Limiting
The API implements rate limiting to ensure fair usage:
- 100 requests per minute per IP
- 1000 requests per hour per user
- 50 report generations per day per user
- 20 emergency alerts per hour per user
- 100 messages per minute per chat

## Security
- All endpoints require valid JWT authentication
- Sensitive data is encrypted at rest
- WebSocket connections require authentication
- Rate limiting prevents abuse
- Input validation on all endpoints
- CORS protection enabled
- Request sanitization implemented

## Error Codes
Standard HTTP status codes plus custom error codes:
- `ERR_RESOURCE_UNAVAILABLE`: Resource is currently unavailable
- `ERR_ZONE_ACCESS_DENIED`: Access to safety zone denied
- `ERR_EMERGENCY_DUPLICATE`: Duplicate emergency alert
- `ERR_CAPACITY_EXCEEDED`: Facility capacity exceeded
- `ERR_MAINTENANCE_REQUIRED`: Resource requires maintenance

## Changelog
- 2023-12-XX: Added Analytics and Reporting API
- 2023-XX-XX: Initial API release
