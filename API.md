# API Documentation

## Public Endpoints

### Get Poll Details
```http
GET /poll/{pollId}
```

**Response:**
```json
{
  "poll": {
    "id": "uuid",
    "title": "Weekly Lunch Poll",
    "description": "Where should we eat?",
    "isRecurring": true,
    "allowSuggestions": true
  },
  "activeInstance": {
    "instanceId": "2024-W48",
    "status": "Active",
    "options": [
      { "id": "uuid", "text": "Pizza", "votes": 0 },
      { "id": "uuid", "text": "Sushi", "votes": 0 }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Submit Vote
```http
POST /vote
```

**Request:**
```json
{
  "keyId": "uuid",
  "pollId": "uuid",
  "optionId": "uuid",
  "voterName": "John Doe" // optional
}
```

**Response:**
```json
{
  "message": "Vote recorded successfully",
  "remainingUses": 0
}
```

### Submit Suggestion
```http
POST /suggestions
```

**Request:**
```json
{
  "pollId": "uuid",
  "text": "Mexican Food",
  "targetWeek": "next" // or "current"
}
```

**Response:**
```json
{
  "message": "Suggestion submitted successfully",
  "suggestionId": "uuid"
}
```

### Get Results
```http
GET /results/{pollInstanceId}
```

**Response:**
```json
{
  "pollInstanceId": "2024-W48",
  "totalVotes": 42,
  "results": {
    "option-id-1": 25,
    "option-id-2": 17
  },
  "votes": [
    {
      "optionId": "uuid",
      "voterName": "John Doe",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Admin Endpoints (Requires Authentication)

### Create Poll
```http
POST /admin/polls
Authorization: Bearer {cognito-token}
```

**Request:**
```json
{
  "title": "Weekly Lunch Poll",
  "description": "Where should we eat this week?",
  "options": [
    { "id": "uuid", "text": "Pizza" },
    { "id": "uuid", "text": "Sushi" }
  ],
  "isRecurring": true,
  "frequency": "WEEKLY",
  "allowSuggestions": true
}
```

**Response:**
```json
{
  "pollId": "uuid",
  "instanceId": "2024-W48",
  "message": "Poll created successfully"
}
```

### List Polls
```http
GET /admin/polls
Authorization: Bearer {cognito-token}
```

**Response:**
```json
{
  "polls": [
    {
      "id": "uuid",
      "title": "Weekly Lunch Poll",
      "description": "...",
      "isRecurring": true,
      "frequency": "WEEKLY",
      "allowSuggestions": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Generate Access Keys
```http
POST /admin/access-keys
Authorization: Bearer {cognito-token}
```

**Request:**
```json
{
  "pollId": "uuid",
  "count": 10,
  "maxUses": 1,
  "expiryDate": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "message": "10 access keys generated successfully",
  "keys": [
    {
      "keyId": "uuid",
      "maxUses": 1,
      "expiryDate": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Get Suggestions
```http
GET /admin/suggestions?pollId={pollId}&status={status}
Authorization: Bearer {cognito-token}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "pollId": "uuid",
      "text": "Mexican Food",
      "status": "Pending",
      "targetWeek": "next",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Update Suggestion
```http
PUT /admin/suggestions
Authorization: Bearer {cognito-token}
```

**Request:**
```json
{
  "pollId": "uuid",
  "suggestionId": "uuid",
  "status": "Approved" // or "Rejected"
}
```

**Response:**
```json
{
  "message": "Suggestion updated successfully"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (invalid/expired key)
- `404`: Not Found
- `409`: Conflict (e.g., already voted)
- `500`: Internal Server Error

