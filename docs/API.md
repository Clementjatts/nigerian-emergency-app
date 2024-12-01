# Nigerian Emergency App API Documentation

## Overview

This document provides comprehensive documentation for the Nigerian Emergency App API. The API follows RESTful principles and uses JSON for request and response payloads.

## Base URL

- Development: `https://api-dev.emergency-ng.com/v1`
- Staging: `https://api-staging.emergency-ng.com/v1`
- Production: `https://api.emergency-ng.com/v1`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

## Rate Limiting

- Standard rate limit: 100 requests per minute
- Enhanced rate limit (authenticated users): 200 requests per minute
- Emergency endpoints: No rate limiting

## Common Response Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Endpoints

### Emergency Facilities

#### Get All Facilities

```http
GET /facilities
```

Query Parameters:
- `type` (string): Filter by facility type (hospital, police, fire)
- `page` (integer): Page number for pagination
- `limit` (integer): Number of items per page
- `sort` (string): Sort field (name, distance, rating)

Response:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "location": {
        "latitude": number,
        "longitude": number
      },
      "address": "string",
      "phone": "string",
      "operating_hours": "string",
      "rating": number
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "limit": number
  }
}
```

#### Get Nearby Facilities

```http
GET /facilities/nearby
```

Query Parameters:
- `latitude` (number, required): User's latitude
- `longitude` (number, required): User's longitude
- `radius` (number): Search radius in meters (default: 5000)
- `type` (string): Filter by facility type

Response: Same as Get All Facilities

#### Get Facility Details

```http
GET /facilities/{id}
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "location": {
    "latitude": number,
    "longitude": number
  },
  "address": "string",
  "phone": "string",
  "operating_hours": "string",
  "rating": number,
  "services": [string],
  "photos": [string],
  "reviews": [
    {
      "id": "string",
      "rating": number,
      "comment": "string",
      "created_at": "string"
    }
  ]
}
```

### Emergency Contacts

#### Get User's Emergency Contacts

```http
GET /contacts
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "phone": "string",
      "relationship": "string",
      "priority": number
    }
  ]
}
```

#### Add Emergency Contact

```http
POST /contacts
```

Request Body:
```json
{
  "name": "string",
  "phone": "string",
  "relationship": "string",
  "priority": number
}
```

#### Update Emergency Contact

```http
PUT /contacts/{id}
```

Request Body: Same as Add Emergency Contact

#### Delete Emergency Contact

```http
DELETE /contacts/{id}
```

### Emergency Alerts

#### Create Emergency Alert

```http
POST /alerts
```

Request Body:
```json
{
  "type": "string",
  "location": {
    "latitude": number,
    "longitude": number
  },
  "description": "string",
  "contact_ids": [string]
}
```

Response:
```json
{
  "id": "string",
  "status": "string",
  "created_at": "string",
  "responders": [
    {
      "id": "string",
      "type": "string",
      "eta": "string"
    }
  ]
}
```

#### Get Alert Status

```http
GET /alerts/{id}
```

Response: Same as Create Emergency Alert response

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common error codes:
- `invalid_request`: Request validation failed
- `not_found`: Resource not found
- `rate_limited`: Too many requests
- `server_error`: Internal server error

## Webhooks

The API supports webhooks for real-time updates. Configure webhooks in your dashboard.

Events:
- `emergency.created`
- `emergency.updated`
- `facility.updated`
- `alert.status_changed`

## SDK Support

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- Java
- Swift

## API Versioning

The API is versioned through the URL path. The current version is v1.

## Best Practices

1. Always check response status codes
2. Implement proper error handling
3. Use appropriate HTTP methods
4. Cache responses when possible
5. Implement rate limiting on your end
6. Use HTTPS for all requests
7. Keep authentication tokens secure

## Support

For API support:
- Email: api-support@emergency-ng.com
- Documentation: https://docs.emergency-ng.com
- Status page: https://status.emergency-ng.com
