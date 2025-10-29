# Study Materials Database System - Complete Guide

## Overview

This document provides a comprehensive guide to the database structure and connections for the Study Materials system in the Axiona Study Platform. The system successfully handles PDFs, study materials, notes, highlights, and user data with real-time synchronization.

## Database Configuration

### Connection Details
- **Database**: MongoDB
- **Connection String**: `mongodb://localhost:27017/study-ai`
- **Port**: 27017 (default MongoDB port)
- **Database Name**: `study-ai`

### Configuration File
**Location**: `/server/src/config/database.js`

```javascript
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
```

## Database Collections Structure

### 1. PDF Collection

**Collection Name**: `pdfs`
**Model Location**: `/server/src/models/PDF.js`

#### Schema Structure
```javascript
{
  topic: String (required, max 200 chars),
  fileName: String (required),
  gridFSFileId: ObjectId (required, references GridFS),
  fileUrl: String (required, validated URL format),
  fileSize: Number (required, min 0),
  pages: Number (required, min 1),
  author: String (max 100 chars),
  domain: String (enum: ['CS', 'ML', 'DBMS', 'OS', 'DSA', 'Networks', 'Security', 'AI', 'Web Dev', 'Mobile Dev', 'AFLL', 'Math', 'Other']),
  year: Number (1-4 or 2020-current year),
  class: String,
  description: String (max 1000 chars),
  publishedAt: Date (default: now),
  downloadCount: Number (default: 0),
  approved: Boolean (default: false),
  uploadedBy: String (Firebase UID, references User),
  createdAt: Date (default: now)
}
```

#### Indexes
- `{ domain: 1, year: 1, class: 1 }` - For filtering by domain, year, and class
- `{ topic: 'text', author: 'text' }` - Text search index
- `{ publishedAt: -1 }` - For sorting by publication date

#### Current Data Example
```javascript
{
  _id: ObjectId("6718c40e18a4f3e123456789"),
  topic: "Regular Expressions - AFLL Course Material",
  fileName: "RE.pdf",
  gridFSFileId: ObjectId("6718c40e18a4f3e987654321"),
  fileUrl: "/api/pdfs/file/6718c40e18a4f3e987654321",
  fileSize: 2547892,
  pages: 45,
  author: "Dr. Computer Science",
  domain: "AFLL",
  year: 3,
  class: "BTech CSE",
  description: "Comprehensive guide to Regular Expressions in AFLL",
  downloadCount: 15,
  approved: true,
  uploadedBy: ObjectId("6718c40e18a4f3e111222333")
}
```

### 2. StudyMaterial Collection

**Collection Name**: `studymaterials`
**Model Location**: `/server/src/models/StudyMaterial.js`

#### Schema Structure
```javascript
{
  title: String (required, max 200 chars),
  subject: String (required, enum: ['IT', 'CS', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General']),
  class: String (required, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD']),
  year: String (required),
  pages: Number (required, 1-1000),
  downloadUrl: String (required),
  thumbnail: String (required),
  author: String (required, max 100 chars),
  description: String (required, max 500 chars),
  uploadDate: Date (default: now),
  downloadCount: Number (default: 0, min 0),
  fileSize: String (required),
  category: String (enum: ['lecture-notes', 'reference', 'assignments', 'textbooks', 'question-papers']),
  tags: [String],
  approved: Boolean (default: false),
  uploadedBy: String (Firebase UID, references User),
  fileType: String (enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']),
  isActive: Boolean (default: true)
}
```

#### Indexes
- `{ subject: 1, class: 1 }` - For filtering by subject and class
- `{ category: 1 }` - For category-based filtering
- `{ uploadedBy: 1 }` - For user-specific materials
- `{ tags: 1 }` - For tag-based search
- `{ approved: 1, isActive: 1 }` - For active approved materials
- `{ title: 'text', description: 'text' }` - Text search

### 3. Note Collection

**Collection Name**: `notes`
**Model Location**: `/server/src/models/Note.js`

#### Schema Structure
```javascript
{
  title: String (required, max 200 chars),
  content: String (required, max 10000 chars),
  pdfId: ObjectId (required, references PDF),
  userId: ObjectId (required, references User),
  pdfTitle: String (required, stores PDF title for reference),
  pageNumber: Number (min 1, page number in PDF),
  tags: [String],
  // Removed isPublic field - all notes are private to user
  lastViewedAt: Date (default: now),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

#### Indexes
- `{ userId: 1, pdfId: 1 }` - For user-specific PDF notes
- `{ userId: 1, createdAt: -1 }` - For user notes sorted by creation
- `{ pdfId: 1 }` - For PDF-specific notes

#### Current Data Example
```javascript
{
  _id: ObjectId("672014a83c40123456789abc"),
  title: "Notes - Regular Expressions - AFLL Course Material (Page 1)",
  content: "This PDF covers fundamental concepts of regular expressions...",
  pdfId: ObjectId("6718c40e18a4f3e123456789"),
  userId: ObjectId("672014a73c40987654321def"),
  pdfTitle: "Regular Expressions - AFLL Course Material",
  pageNumber: 1,
  tags: ["AFLL"],
  // isPublic field removed - notes are private
  createdAt: ISODate("2024-10-29T12:34:56.789Z"),
  updatedAt: ISODate("2024-10-29T12:34:56.789Z")
}
```

### 4. User Collection

**Collection Name**: `users`
**Model Location**: `/server/src/models/User.js`

#### Schema Structure
```javascript
{
  fullName: String (required, max 100 chars),
  email: String (required, unique, validated email format),
  passwordHash: String (required, min 6 chars),
  avatarUrl: String (default: null),
  preferences: {
    theme: String (enum: ['light', 'dark'], default: 'light'),
    language: String (default: 'en'),
    emailNotif: Boolean (default: true),
    pushNotif: Boolean (default: true),
    reminder: {
      enabled: Boolean (default: false),
      time: String (default: '09:00'),
      frequency: String (enum: ['daily', 'weekdays', 'custom'], default: 'daily')
    }
  },
  privacy: {
    exportExp: Date,
    deleteReqAt: Date
  },
  security: {
    tfaSecret: String,
    tfaEnabled: Boolean (default: false),
    sessions: [{
      id: String (required),
      ua: String,
      ip: String,
      lastSeen: Date (default: now),
      current: Boolean (default: false)
    }]
  },
  currentRoadmapId: ObjectId (references Roadmap),
  createdAt: Date (default: now)
}
```

#### Current Mock User
```javascript
{
  _id: ObjectId("672014a73c40987654321def"),
  fullName: "Test User",
  email: "test@example.com",
  passwordHash: "$2b$10$hashedPassword...",
  preferences: {
    theme: "light",
    language: "en",
    emailNotif: true,
    pushNotif: true
  },
  createdAt: ISODate("2024-10-29T12:34:55.123Z")
}
```

### 5. Highlight Collection

**Collection Name**: `highlights`
**Model Location**: `/server/src/models/Highlight.js`

#### Schema Structure
```javascript
{
  pdfId: ObjectId (required, references PDF),
  userId: ObjectId (required, references User),
  content: {
    text: String (required, highlighted text)
  },
  position: {
    pageNumber: Number (required),
    boundingRect: {
      x1: Number, y1: Number, x2: Number, y2: Number,
      width: Number, height: Number
    },
    rects: [{
      x1: Number, y1: Number, x2: Number, y2: Number,
      width: Number, height: Number
    }],
    viewportDimensions: {
      width: Number, height: Number
    }
  },
  style: {
    color: String (default: '#FFEB3B'),
    opacity: Number (default: 0.4)
  },
  note: String (optional note attached to highlight),
  tags: [String],
  // Removed isPublic field - highlights are private to user
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

## API Endpoints

### PDF Endpoints
**Base Route**: `/api/pdfs`

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | Get all PDFs with filtering | Paginated PDF list |
| GET | `/:id` | Get PDF by ID | Single PDF object |
| GET | `/subject/:domain` | Get PDFs by subject/domain | Filtered PDF list |
| GET | `/domain/:domain` | Get PDFs by domain | Domain-specific PDFs |
| POST | `/` | Upload new PDF | Created PDF object |
| PUT | `/:id` | Update PDF | Updated PDF object |
| DELETE | `/:id` | Delete PDF | Success message |
| POST | `/:id/download` | Track PDF download | Updated download count |

### Notes Endpoints
**Base Route**: `/api/notes`

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/user/:userId` | Get user's notes | Paginated notes list |
| GET | `/pdf/:pdfId` | Get notes for specific PDF | PDF notes list |
| GET | `/:noteId` | Get specific note | Single note object |
| POST | `/` | Create new note | Created note object |
| PUT | `/:noteId` | Update note | Updated note object |
| DELETE | `/:noteId` | Delete note | Success message |

### Study Materials Endpoints
**Base Route**: `/api/study-materials`

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | Get all study materials | Paginated materials list |
| GET | `/:id` | Get study material by ID | Single material object |
| POST | `/:id/download` | Track download | Updated download count |

## Real-Time Notes System

### Frontend Components

#### 1. NotesContext (`/client/src/contexts/NotesContext.tsx`)
Provides global state management for notes across components.

```typescript
interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refreshNotes: (userId: string) => Promise<void>;
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updatedNote: Note) => void;
  removeNote: (noteId: string) => void;
  clearNotes: () => void;
  triggerRefresh: () => void;
  lastRefreshTrigger: number;
}
```

#### 2. SubjectViewer Component
- Location: `/client/src/pages/SubjectViewer.tsx`
- Features:
  - Floating, draggable notes modal
  - Real-time page tracking
  - Automatic note saving with success notifications
  - Triggers global refresh when notes are saved

#### 3. MyRack Component
- Location: `/client/src/pages/MyRack.tsx`
- Features:
  - Real-time notes display
  - Pagination and search functionality
  - Automatic refresh when notes tab is activated
  - Listens for external refresh triggers

### Data Flow

```
1. User opens PDF in SubjectViewer
   ↓
2. PDF data loaded from /api/pdfs/subject/{domain}
   ↓
3. User clicks "Notes" button
   ↓
4. Floating modal opens with current page number
   ↓
5. User types note and clicks "Save Note"
   ↓
6. POST request to /api/notes with:
   - title, content, pdfId, userId, pageNumber, tags
   ↓
7. Backend validates PDF exists and creates note
   ↓
8. Success response triggers:
   - Success notification
   - Modal closes
   - Global refresh trigger sent
   ↓
9. MyRack component receives refresh trigger
   ↓
10. MyRack refreshes notes from /api/notes/user/{userId}
    ↓
11. Updated notes displayed in real-time
```

## Testing the System

### Backend Testing

#### Test Note Creation
```bash
curl -X POST http://localhost:5050/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test note content",
    "pdfId": "6718c40e18a4f3e123456789",
    "userId": "672014a73c40987654321def",
    "pageNumber": 1,
    "tags": ["test", "AFLL"]
    // "isPublic": false - field removed, notes are private
  }'
```

#### Test Note Retrieval
```bash
curl http://localhost:5050/api/notes/user/672014a73c40987654321def
```

#### Test PDF Retrieval
```bash
curl http://localhost:5050/api/pdfs/subject/AFLL
```

### Database Verification

#### Connect to MongoDB
```bash
mongosh mongodb://localhost:27017/study-ai
```

#### Check Collections
```javascript
// List all collections
show collections

// Count documents in each collection
db.pdfs.countDocuments()
db.notes.countDocuments()
db.users.countDocuments()
db.studymaterials.countDocuments()

// Find specific documents
db.pdfs.find({ domain: "AFLL" }).pretty()
db.notes.find({ userId: ObjectId("672014a73c40987654321def") }).pretty()
```

## System Status

### ✅ Working Features
1. **Database Connection**: MongoDB connected successfully at `localhost:27017`
2. **PDF Management**: PDFs stored and retrieved from GridFS
3. **Notes System**: 
   - Notes creation and storage ✅
   - Real-time synchronization ✅
   - Page number tracking ✅
   - User-specific notes ✅
4. **Frontend Integration**:
   - Floating notes modal ✅
   - Drag and resize functionality ✅
   - Success notifications ✅
   - Global state management ✅
5. **API Endpoints**: All CRUD operations working
6. **Data Validation**: Schema validation in place
7. **Indexing**: Optimized for performance

### 🔧 System Architecture
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Frontend**: React + TypeScript + Tailwind CSS
- **State Management**: React Context API
- **Database**: MongoDB with GridFS for file storage
- **File Handling**: PDF.js for PDF rendering and interaction

### 📊 Performance Optimizations
- Database indexes for efficient querying
- Pagination for large datasets
- Lazy loading of components
- Optimized re-renders with useCallback and useMemo

## Troubleshooting

### Common Issues

1. **Note Not Saving**
   - Check if PDF ID exists in database
   - Verify user ID is valid
   - Check network requests in browser dev tools

2. **Real-time Updates Not Working**
   - Ensure NotesProvider wraps the app
   - Check console for refresh trigger logs
   - Verify useNotesContext is properly imported

3. **Database Connection Issues**
   - Ensure MongoDB is running: `brew services start mongodb-community`
   - Check connection string in environment variables
   - Verify database permissions

### Debug Tools

1. **NotesDebugPanel**: Real-time component showing:
   - Current user information
   - Notes count
   - Loading state
   - Refresh triggers
   - Manual refresh and fetch buttons

2. **Console Logging**: Comprehensive logging throughout the system:
   - `🔧` Database operations
   - `📋` API calls
   - `🔄` Refresh triggers
   - `✅` Success operations
   - `❌` Error conditions

## Conclusion

The Study Materials database system is fully functional with robust real-time synchronization between components. The system successfully handles PDF viewing, note-taking, and data persistence with proper error handling and user feedback. All database collections are properly indexed and optimized for performance.
