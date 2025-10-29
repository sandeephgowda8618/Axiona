# Axiona Backend Implementation & Recovery Guide

## Overview

This document provides a complete implementation guide for the Axiona Study Platform backend. The system has been thoroughly cleaned and optimized for crash-resistant operation with Firebase authentication integration.

## Quick Recovery Commands

### Database Setup
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Verify MongoDB is running
mongosh mongodb://localhost:27017/study-ai --eval "db.runCommand({ping: 1})"
```

### Backend Setup
```bash
# Navigate to backend directory
cd /Users/sandeeph/Documents/s2/Axiona/server

# Install dependencies
npm install

# Start the server
npm start
# OR
node src/app.js
```

### Quick Health Check
```bash
# Test server health
curl http://localhost:5050/api/health

# Expected response:
{
  "status": "OK",
  "message": "Study-AI API is running",
  "timestamp": "2025-10-29T05:18:03.018Z",
  "dataStats": {
    "users": 2,
    "videos": 16,
    "quizzes": 2,
    "studyMaterials": 2
  }
}
```

## Core Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Local: localhost:27017)
- **ODM**: Mongoose
- **Authentication**: Firebase Authentication
- **File Storage**: GridFS (MongoDB)
- **Port**: 5050

### Project Structure
```
server/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── User.js            # User model (Firebase integration)
│   │   ├── Note.js            # Notes model
│   │   ├── PDF.js             # PDF documents model
│   │   ├── Highlight.js       # PDF highlights model
│   │   └── StudyMaterial.js   # Study materials model
│   ├── routes/                # API endpoints
│   │   ├── notes.js           # Notes CRUD operations
│   │   ├── pdfs.js            # PDF management
│   │   ├── users.js           # User management
│   │   └── studyMaterials.js  # Study materials
│   ├── services/
│   │   └── firebaseUserService.js  # Firebase user integration
│   └── middleware/            # Express middleware
├── package.json              # Dependencies
└── .env                     # Environment variables
```

## Database Schema (Clean Implementation)

### 1. User Collection
**Collection**: `users`
**Primary Key**: Firebase UID (String)

```javascript
{
  _id: String,                    // Firebase UID (primary key)
  fullName: String,               // User display name
  email: String,                  // Email (unique)
  firebaseUID: String,            // Firebase UID (duplicate for safety)
  passwordHash: String,           // Optional (not used with Firebase)
  avatarUrl: String,              // Profile image URL
  preferences: {
    theme: String,                // 'light' | 'dark'
    language: String,             // Language code
    emailNotif: Boolean,          // Email notifications
    pushNotif: Boolean,           // Push notifications
    reminder: {
      enabled: Boolean,
      time: String,               // HH:MM format
      frequency: String           // 'daily' | 'weekdays' | 'custom'
    }
  },
  privacy: {
    exportExp: Date,              // Data export expiration
    deleteReqAt: Date            // Account deletion request date
  },
  security: {
    tfaSecret: String,            // Two-factor auth secret
    tfaEnabled: Boolean,          // Two-factor auth enabled
    sessions: [{                  // User sessions
      id: String,
      ua: String,                 // User agent
      ip: String,                 // IP address
      lastSeen: Date,
      current: Boolean
    }]
  },
  currentRoadmapId: ObjectId,     // Current learning roadmap
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Note Collection
**Collection**: `notes`
**Key Changes**: Removed `isPublic` - all notes are private

```javascript
{
  _id: ObjectId,
  title: String,                  // Note title (max 200 chars)
  content: String,                // Note content (max 10000 chars)
  pdfId: ObjectId,                // Reference to PDF
  userId: String,                 // Firebase UID (references User._id)
  pdfTitle: String,               // Cached PDF title for performance
  pageNumber: Number,             // PDF page number (optional)
  tags: [String],                 // Array of tags
  lastViewedAt: Date,             // Last access timestamp
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ userId: 1, pdfId: 1 }` - User-specific PDF notes
- `{ userId: 1, createdAt: -1 }` - User notes sorted by creation
- `{ pdfId: 1 }` - PDF-specific notes

### 3. PDF Collection
**Collection**: `pdfs`

```javascript
{
  _id: ObjectId,
  topic: String,                  // PDF title/topic (max 200 chars)
  fileName: String,               // Original filename
  gridFSFileId: ObjectId,         // GridFS file reference
  fileUrl: String,                // API endpoint for file access
  fileSize: Number,               // File size in bytes
  pages: Number,                  // Number of pages
  author: String,                 // Document author (max 100 chars)
  domain: String,                 // Subject domain enum
  year: Number,                   // Academic year or calendar year
  class: String,                  // Class/course
  description: String,            // Description (max 1000 chars)
  publishedAt: Date,              // Publication date
  downloadCount: Number,          // Download counter
  approved: Boolean,              // Approval status
  uploadedBy: String,             // Firebase UID (references User._id)
  createdAt: Date
}
```

**Domain Enum**: `['CS', 'ML', 'DBMS', 'OS', 'DSA', 'Networks', 'Security', 'AI', 'Web Dev', 'Mobile Dev', 'AFLL', 'Math', 'Other']`

### 4. Highlight Collection
**Collection**: `highlights`
**Key Changes**: Removed `isPublic` and sharing features

```javascript
{
  _id: ObjectId,
  pdfId: ObjectId,                // Reference to PDF
  userId: String,                 // Firebase UID (references User._id)
  content: {
    text: String,                 // Highlighted text (max 5000 chars)
    image: String                 // Optional screenshot
  },
  position: {
    pageNumber: Number,           // PDF page number
    boundingRect: {               // Main bounding rectangle
      x1: Number, y1: Number,
      x2: Number, y2: Number,
      width: Number, height: Number
    },
    rects: [{                     // Multiple rects for multi-line text
      x1: Number, y1: Number,
      x2: Number, y2: Number,
      width: Number, height: Number
    }],
    viewportDimensions: {         // Viewport info for scaling
      width: Number, height: Number
    }
  },
  style: {
    color: String,                // Highlight color (default: '#FFEB3B')
    opacity: Number               // Opacity (default: 0.4)
  },
  note: String,                   // Optional note attached to highlight
  tags: [String],                 // Array of tags
  createdAt: Date,
  updatedAt: Date,
  lastReviewed: Date,             // Last review timestamp
  reviewCount: Number             // Review counter
}
```

### 5. StudyMaterial Collection
**Collection**: `studymaterials`

```javascript
{
  _id: ObjectId,
  title: String,                  // Material title (max 200 chars)
  subject: String,                // Subject enum
  class: String,                  // Class enum
  year: String,                   // Academic year
  pages: Number,                  // Number of pages (1-1000)
  downloadUrl: String,            // Download URL
  thumbnail: String,              // Thumbnail URL
  author: String,                 // Author name (max 100 chars)
  description: String,            // Description (max 500 chars)
  uploadDate: Date,               // Upload timestamp
  downloadCount: Number,          // Download counter
  fileSize: String,               // File size (human readable)
  category: String,               // Category enum
  tags: [String],                 // Array of tags
  approved: Boolean,              // Approval status
  uploadedBy: String,             // Firebase UID (references User._id)
  fileType: String,               // File type enum
  isActive: Boolean,              // Active status
  createdAt: Date,
  updatedAt: Date
}
```

**Subject Enum**: `['IT', 'CS', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General']`

**Class Enum**: `['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD']`

**Category Enum**: `['lecture-notes', 'reference', 'assignments', 'textbooks', 'question-papers']`

## API Endpoints

### Authentication
All endpoints expecting `userId` parameter require Firebase UID format validation.

### Notes API (`/api/notes`)

#### GET `/api/notes/user/:userId`
Fetch user's notes with pagination and search.

**Parameters**:
- `userId` (String): Firebase UID
- `page` (Number, optional): Page number (default: 1)
- `limit` (Number, optional): Items per page (default: 20)
- `search` (String, optional): Search in title, content, pdfTitle

**Response**:
```json
{
  "success": true,
  "data": [/* Note objects */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### POST `/api/notes`
Create a new note.

**Body**:
```json
{
  "title": "My Note Title",
  "content": "Note content here...",
  "pdfId": "6718c40e18a4f3e123456789",
  "userId": "firebase-uid-here",
  "pageNumber": 1,
  "tags": ["tag1", "tag2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "_id": "672014a83c40123456789abc",
    "title": "My Note Title",
    "content": "Note content here...",
    "pdfId": "6718c40e18a4f3e123456789",
    "userId": "firebase-uid-here",
    "pdfTitle": "Regular Expressions - AFLL Course Material",
    "pageNumber": 1,
    "tags": ["tag1", "tag2"],
    "createdAt": "2025-10-29T12:34:56.789Z",
    "updatedAt": "2025-10-29T12:34:56.789Z"
  }
}
```

#### GET `/api/notes/pdf/:pdfId`
Get notes for a specific PDF.

**Parameters**:
- `pdfId` (String): PDF ObjectId
- `userId` (String, optional): Filter by user

#### GET `/api/notes/:noteId`
Get a specific note by ID.

#### PUT `/api/notes/:noteId`
Update a note.

**Body**:
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["updated", "tags"]
}
```

#### DELETE `/api/notes/:noteId`
Delete a note.

### PDF API (`/api/pdfs`)

#### GET `/api/pdfs`
Get all PDFs with filtering and pagination.

#### GET `/api/pdfs/subject/:domain`
Get PDFs by domain/subject.

#### GET `/api/pdfs/:id`
Get specific PDF by ID.

### Study Materials API (`/api/study-materials`)

#### GET `/api/study-materials`
Get all study materials with filtering.

#### GET `/api/study-materials/:id`
Get specific study material by ID.

## Firebase Integration

### FirebaseUserService
**Location**: `/server/src/services/firebaseUserService.js`

#### Key Methods:

##### `createOrUpdateUser(firebaseUser)`
Creates or updates user from Firebase authentication data.

```javascript
const user = await FirebaseUserService.createOrUpdateUser({
  uid: 'firebase-uid-here',
  email: 'user@example.com',
  displayName: 'John Doe',
  photoURL: 'https://example.com/photo.jpg'
});
```

##### `getUserByUID(uid)`
Retrieves user by Firebase UID.

```javascript
const user = await FirebaseUserService.getUserByUID('firebase-uid-here');
```

##### `isValidFirebaseUID(uid)`
Validates Firebase UID format.

```javascript
const isValid = FirebaseUserService.isValidFirebaseUID('firebase-uid-here');
// Returns true if valid (20+ chars, alphanumeric)
```

## Performance Optimizations

### Database Indexes
- All collections have optimized compound indexes
- Text search indexes on searchable fields
- Efficient user-specific data retrieval

### Query Optimizations
- Removed expensive PDF population in notes queries
- Using `lean()` queries where possible
- Cached PDF titles in notes for performance
- Minimal field selection in populated queries

### Memory Management
- Proper error handling and cleanup
- Connection pooling for MongoDB
- Efficient data serialization

## Environment Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/study-ai

# Server
PORT=5050
NODE_ENV=development

# Firebase (if using Firebase Admin SDK)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Sample `.env` file
```env
MONGODB_URI=mongodb://localhost:27017/study-ai
PORT=5050
NODE_ENV=development
```

## Error Handling

### Validation
- Firebase UID format validation in all user-related endpoints
- Mongoose schema validation for data integrity
- Proper HTTP status codes for different error types

### Logging
- Structured logging with emoji indicators:
  - `📋` API calls
  - `✅` Success operations
  - `❌` Error conditions
  - `🔍` Search operations
  - `💾` Database operations

### Error Response Format
```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "Technical error details (development only)"
}
```

## Testing

### Manual API Testing

#### Test Notes Creation
```bash
curl -X POST http://localhost:5050/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test note",
    "pdfId": "6718c40e18a4f3e123456789",
    "userId": "validFirebaseUID123456789",
    "pageNumber": 1,
    "tags": ["test"]
  }'
```

#### Test Notes Retrieval
```bash
curl "http://localhost:5050/api/notes/user/validFirebaseUID123456789"
```

#### Test Health Check
```bash
curl http://localhost:5050/api/health
```

### Database Testing

#### Connect to MongoDB
```bash
mongosh mongodb://localhost:27017/study-ai
```

#### Check Collections
```javascript
// List collections
show collections

// Count documents
db.notes.countDocuments()
db.users.countDocuments()
db.pdfs.countDocuments()

// Find sample data
db.notes.find().limit(1).pretty()
db.users.find().limit(1).pretty()
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Check connection
mongosh mongodb://localhost:27017/study-ai --eval "db.runCommand({ping: 1})"
```

#### 2. Port Already in Use (EADDRINUSE)
```bash
# Find process using port 5050
lsof -i :5050

# Kill the process
kill -9 <PID>

# Or kill all node processes
pkill -f "node src/app.js"
```

#### 3. Firebase UID Validation Errors
- Ensure Firebase UIDs are at least 20 characters
- Only alphanumeric characters allowed
- No special characters or spaces

#### 4. Note Creation Fails
- Verify PDF exists in database
- Check Firebase UID format
- Ensure all required fields are provided

### Debug Mode
Enable verbose logging by setting environment variable:
```bash
DEBUG=* node src/app.js
```

## Recovery Steps

### Complete System Recovery

#### 1. Environment Setup
```bash
# Install Node.js (if needed)
brew install node

# Install MongoDB (if needed)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

#### 2. Project Setup
```bash
# Clone/navigate to project
cd /Users/sandeeph/Documents/s2/Axiona/server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with appropriate values
```

#### 3. Database Setup
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/study-ai

# Create indexes (run in MongoDB shell)
db.notes.createIndex({ userId: 1, pdfId: 1 })
db.notes.createIndex({ userId: 1, createdAt: -1 })
db.pdfs.createIndex({ domain: 1, year: 1, class: 1 })
db.users.createIndex({ currentRoadmapId: 1 })
```

#### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# Or direct node
node src/app.js
```

#### 5. Verify Installation
```bash
# Health check
curl http://localhost:5050/api/health

# Test notes endpoint
curl "http://localhost:5050/api/notes/user/testUID123456789012345678"
```

## Security Considerations

### Data Protection
- All notes are private to the user (no public sharing)
- Firebase UID validation prevents unauthorized access
- Mongoose schema validation prevents data corruption
- Rate limiting in production environment

### Authentication
- Firebase authentication integration
- Automatic user creation for valid Firebase UIDs
- Session management through Firebase

### Input Validation
- Maximum field lengths enforced
- Email format validation
- Enum value validation for domains/categories
- XSS protection through proper data sanitization

## Maintenance

### Regular Tasks
1. **Database Cleanup**: Remove inactive users and orphaned data
2. **Index Optimization**: Monitor query performance and adjust indexes
3. **Log Rotation**: Clean up old log files
4. **Backup**: Regular database backups
5. **Security Updates**: Keep dependencies updated

### Monitoring
- Database connection health
- API response times
- Error rates
- Memory usage
- File storage usage

## Conclusion

This backend implementation provides a robust, crash-resistant foundation for the Axiona Study Platform. The system has been thoroughly cleaned of legacy code, optimized for performance, and designed for easy recovery and maintenance.

**Key Features**:
- ✅ Firebase authentication integration
- ✅ Clean database schema without public/private logic
- ✅ Performance-optimized queries
- ✅ Comprehensive error handling
- ✅ Structured logging and debugging
- ✅ Easy recovery and deployment
- ✅ Complete API documentation
- ✅ Crash-resistant design

The system is production-ready and can be easily rebuilt using this guide if needed.

## 🎥 Video Conference System (COMPLETED)

**Status**: ✅ Backend implementation complete and tested
**Documentation**: See `VIDEO_CONFERENCE_IMPLEMENTATION_STATUS.md`

### Features Completed:
- ✅ **REST API**: Complete meeting CRUD with password protection
- ✅ **Socket.IO**: Real-time communication with WebRTC signaling
- ✅ **Authentication**: Firebase integration throughout
- ✅ **Room Management**: 6-participant limit enforced
- ✅ **Chat System**: Message persistence and real-time delivery
- ✅ **Participant Controls**: Audio/video/screen sharing state management

### Database Models:
- ✅ `Meeting`: Comprehensive meeting management with participants
- ✅ `Message`: Chat message persistence
- ✅ Firebase UID integration for all user references

### Testing Results:
- ✅ Password-protected meetings work correctly
- ✅ Open meetings allow unrestricted joining
- ✅ 6-participant limit enforced (7th user rejected)
- ✅ Meeting info endpoint shows correct status
- ✅ Firebase UID validation working
- ✅ Real-time Socket.IO events implemented

### Ready for Frontend Integration:
The backend provides complete video conference infrastructure. Next step is frontend React components for:
- Socket.IO client connection
- WebRTC peer connection management  
- Video/audio stream handling
- Meeting UI components

### Architecture:
```
Frontend (React) ↔ Socket.IO ↔ Backend (Node.js) ↔ MongoDB
                 ↔ WebRTC P2P ↔ 
Firebase Auth ←→ Backend ←→ Database Models
```
