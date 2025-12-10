# Tsharok API Documentation

## Base URL
- **Local Development:** `http://localhost:8788`
- **Production:** `https://tsharok.pages.dev`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Authentication

#### POST /api/auth - Login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

#### POST /api/auth - Register
```json
{
  "action": "register",
  "email": "newuser@uqu.edu.sa",
  "password": "Password123!",
  "firstName": "Ahmed",
  "lastName": "Ali"
}
```

#### GET /api/auth - Verify Token
**Headers:** `Authorization: Bearer <token>`

---

### 2. Courses

#### GET /api/courses - List Courses
**Query Parameters:**
- `limit` (default: 50) - Number of results
- `offset` (default: 0) - Pagination offset
- `search` - Search in title/code/description
- `level` - Filter by level (beginner/intermediate/advanced)
- `category` - Filter by category

**Example:**
```
GET /api/courses?limit=10&search=programming&level=beginner
```

**Response:**
```json
{
  "success": true,
  "courses": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/courses/[id] - Course Details
```
GET /api/courses/1
```

---

### 3. File Upload

#### POST /api/upload - Upload File
**Headers:** `Authorization: Bearer <token>`

**Form Data:**
- `file` (required) - The file to upload
- `courseId` (optional) - Associated course ID
- `title` (optional) - File title
- `description` (optional) - File description

**Allowed Types:**
- PDF, Images (JPEG, PNG, GIF)
- Videos (MP4, WebM)
- Documents (Word, PowerPoint)

**Max Size:** 100MB

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": 123,
    "key": "uploads/1/1234567890-uuid-filename.pdf",
    "filename": "filename.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://pub-xxxxx.r2.dev/uploads/1/...",
    "uploadedAt": "2025-12-10T19:00:00.000Z"
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Cloudflare Pages Functions free tier:
- 100,000 requests per day
- No rate limiting on individual IPs

---

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
