# API Endpoints and Database Schema Mapping

## Overview
This document provides detailed mapping of all API endpoints, database schemas, and their relationships in the Axiona study platform.

---

## 🗄️ Database Models and Schemas

### 👤 User Model (`/server/src/models/User.js`)
```javascript
// User authentication and profile data
{
  firebaseUid: String (unique),
  email: String (required),
  fullName: String (required),
  avatar: String (optional),
  role: String (default: 'student'),
  createdAt: Date,
  lastLoginAt: Date,
  preferences: {
    theme: String,
    language: String,
    notifications: Boolean
  }
}
```

### 📚 PDFMaterial Model (`/server/src/models/PDFMaterial.js`)
```javascript
// StudyPES study materials
{
  topic: String (required),
  subject: String (required),
  description: String,
  pages: Number,
  fileSize: Number,
  uploadDate: Date,
  gridFSFileId: ObjectId, // File stored in GridFS
  downloadCount: Number (default: 0),
  tags: [String],
  difficulty: String,
  isPublic: Boolean (default: true)
}
```

### 📖 Book Model (`/server/src/models/Book.js`)
```javascript
// Digital library reference books
{
  title: String (required),
  author: String (required),
  isbn: String (optional),
  publisher: String (optional),
  edition: String (optional),
  subject: String (required),
  category: String (required),
  year: Number (optional),
  pages: Number (optional),
  language: String (default: 'English'),
  rating: Number (default: 0),
  reviewCount: Number (default: 0),
  description: String,
  coverImage: String,
  fileName: String (required), // Maps to file in /docs/library/
  fileSize: Number (optional),
  availability: String (enum: ['available', 'borrowed', 'reserved']),
  addedDate: Date (default: Date.now),
  downloadCount: Number (default: 0),
  tags: [String]
}
```

### 📝 Note Model (`/server/src/models/Note.js`)
```javascript
// User notes and annotations
{
  title: String (required),
  content: String (required),
  userId: String (required), // Firebase UID
  pdfId: String (required), // PDFMaterial or Book ID
  pageNumber: Number (optional),
  tags: [String],
  isPublic: Boolean (default: false),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now),
  highlights: [Object], // Associated highlights
  position: {
    x: Number,
    y: Number
  }
}
```

### 🎨 Highlight Model (`/server/src/models/Highlight.js`)
```javascript
// PDF highlights and annotations
{
  userId: String (required),
  pdfId: String (required),
  pageNumber: Number (required),
  content: String, // Selected text
  color: String (required),
  position: {
    rects: [Object], // Highlight rectangles
    boundingRect: Object
  },
  note: String (optional),
  createdAt: Date (default: Date.now)
}
```

---

## 🛣️ API Endpoints Mapping

### 🔐 Authentication Routes (`/server/src/routes/auth.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| POST | `/api/auth/register` | User registration | Create new user account |
| POST | `/api/auth/login` | User login | Authenticate user |
| POST | `/api/auth/logout` | User logout | End user session |
| GET | `/api/auth/profile` | Get user profile | Get current user data |
| PUT | `/api/auth/profile` | Update profile | Update user information |
| POST | `/api/auth/verify-token` | Token verification | Verify JWT token |

**Used by:**
- `client/src/contexts/AuthContext.tsx`
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/ProfilePage.tsx`

---

### 📚 StudyPES PDF Routes (`/server/src/routes/pdfs.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/api/pdfs` | List all PDFs | Get all study materials |
| GET | `/api/pdfs/subject/:subject` | PDFs by subject | Get materials by subject |
| GET | `/api/pdfs/:id` | Get PDF details | Get specific PDF metadata |
| GET | `/api/pdfs/file/:gridFSFileId` | Stream PDF file | Download/stream PDF content |
| POST | `/api/pdfs/upload` | Upload PDF | Add new study material |
| PUT | `/api/pdfs/:id` | Update PDF | Update PDF metadata |
| DELETE | `/api/pdfs/:id` | Delete PDF | Remove PDF material |
| POST | `/api/pdfs/:id/download` | Track download | Increment download count |

**Used by:**
- `client/src/pages/StudyPES.tsx`
- `client/src/pages/SubjectViewer.tsx`
- `client/src/services/api.ts`

---

### 📖 Library Books Routes (`/server/src/routes/books.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/api/books` | List all books | Get all library books |
| GET | `/api/books/search` | Search books | Search by title, author, subject |
| GET | `/api/books/category/:category` | Books by category | Filter by category |
| GET | `/api/books/:id` | Get book details | Get specific book metadata |
| GET | `/api/books/file/:fileName` | Stream book file | Download/stream book PDF |
| POST | `/api/books` | Add new book | Create new library book |
| PUT | `/api/books/:id` | Update book | Update book metadata |
| DELETE | `/api/books/:id` | Delete book | Remove book from library |
| POST | `/api/books/:id/download` | Track download | Increment download count |

**Used by:**
- `client/src/pages/Library.tsx`
- `client/src/pages/BookReader.tsx`
- `client/src/services/api.ts`

---

### 📝 Notes Routes (`/server/src/routes/notes.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/api/notes` | List user notes | Get all notes for user |
| GET | `/api/notes/pdf/:pdfId` | Notes by PDF | Get notes for specific PDF |
| GET | `/api/notes/:id` | Get note details | Get specific note |
| POST | `/api/notes` | Create note | Add new note |
| PUT | `/api/notes/:id` | Update note | Edit existing note |
| DELETE | `/api/notes/:id` | Delete note | Remove note |
| GET | `/api/notes/search` | Search notes | Search user's notes |
| POST | `/api/notes/:id/share` | Share note | Make note public |

**Used by:**
- `client/src/contexts/NotesContext.tsx`
- `client/src/pages/MyRack.tsx`
- `client/src/pages/SubjectViewer.tsx`
- `client/src/pages/BookReader.tsx`

---

### 🎨 Highlights Routes (`/server/src/routes/highlights.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/api/highlights/pdf/:pdfId` | PDF highlights | Get highlights for PDF |
| POST | `/api/highlights` | Create highlight | Add new highlight |
| PUT | `/api/highlights/:id` | Update highlight | Edit highlight |
| DELETE | `/api/highlights/:id` | Delete highlight | Remove highlight |
| GET | `/api/highlights/user/:userId` | User highlights | Get all user highlights |

**Used by:**
- `client/src/pages/SubjectViewer.tsx`
- `client/src/pages/BookReader.tsx`
- `client/src/services/api.ts`

---

### 👤 User Management Routes (`/server/src/routes/users.js`)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/api/users/profile` | Get user profile | Get current user data |
| PUT | `/api/users/profile` | Update profile | Update user profile |
| GET | `/api/users/stats` | User statistics | Get user activity stats |
| POST | `/api/users/preferences` | Update preferences | Save user preferences |
| GET | `/api/users/progress` | Learning progress | Get study progress |

**Used by:**
- `client/src/pages/ProfilePage.tsx`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/SettingsPage.tsx`

---

## 🔄 Data Flow Mapping

### 📚 Library System Data Flow
```
1. User visits Library page (/library)
   ↓
2. Library.tsx calls apiService.getBooks()
   ↓
3. API: GET /api/books
   ↓
4. books.js queries Book model
   ↓
5. Returns books array to frontend
   ↓
6. Library.tsx renders book grid
   ↓
7. User clicks "Read" → Navigate to BookReader
   ↓
8. BookReader.tsx loads PDF from /docs/library/
   ↓
9. User creates note → POST /api/notes
   ↓
10. Note saved to database with book reference
```

### 📖 StudyPES System Data Flow
```
1. User visits StudyPES page (/studypes)
   ↓
2. StudyPES.tsx calls apiService.getPDFsBySubject()
   ↓
3. API: GET /api/pdfs/subject/:subject
   ↓
4. pdfs.js queries PDFMaterial model
   ↓
5. Returns filtered PDFs
   ↓
6. User selects PDF → Navigate to SubjectViewer
   ↓
7. SubjectViewer.tsx streams PDF via GridFS
   ↓
8. API: GET /api/pdfs/file/:gridFSFileId
   ↓
9. User highlights text → POST /api/highlights
   ↓
10. Highlight saved with PDF reference
```

### 📝 Notes System Data Flow
```
1. User creates note in PDF viewer
   ↓
2. Component calls handleSaveNote()
   ↓
3. apiService.createNote() → POST /api/notes
   ↓
4. notes.js saves to Note model
   ↓
5. Success response → Update UI
   ↓
6. NotesContext.triggerRefresh()
   ↓
7. MyRack.tsx re-fetches notes
   ↓
8. Updated notes displayed
```

---

## 🗃️ File Storage Mapping

### 📁 StudyPES Materials
- **Storage**: MongoDB GridFS
- **Access**: `/api/pdfs/file/:gridFSFileId`
- **Upload**: Via admin interface (GridFS)
- **Files**: Binary PDF data in database

### 📁 Library Books
- **Storage**: File system (`/docs/library/`)
- **Access**: Direct file serving via Express static
- **Upload**: Manual file placement
- **Files**: Physical PDF files on server

### 📁 User Uploads
- **Storage**: GridFS (for user-uploaded content)
- **Access**: Via authenticated endpoints
- **Upload**: Multer middleware → GridFS

---

## 🔧 Middleware Chain

### 🔐 Authentication Middleware (`/server/src/middleware/auth.js`)
```
Request → JWT Token Check → Firebase UID Validation → User Context → Route Handler
```

**Applied to:**
- All `/api/notes/*` routes
- All `/api/highlights/*` routes
- Protected user routes
- File upload endpoints

### 📁 Upload Middleware (`/server/src/middleware/upload.js`)
```
Request → File Validation → Size Check → GridFS Storage → Metadata Creation
```

**Applied to:**
- PDF upload endpoints
- User content uploads
- Profile image uploads

---

## 🗝️ Environment Variables

### Server Configuration
```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/study-ai
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project
NODE_ENV=development
```

### Client Configuration
```env
VITE_API_BASE_URL=http://localhost:5050
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 📊 Performance Considerations

### Database Indexing
- **User.firebaseUid**: Unique index for authentication
- **Note.userId**: Index for user note queries
- **Book.subject**: Index for category filtering
- **PDFMaterial.subject**: Index for subject filtering

### Caching Strategy
- PDF file streaming with proper headers
- Static file serving for library books
- In-memory caching for frequently accessed data

### File Handling
- GridFS for large files (>16MB)
- Direct file serving for library books
- Lazy loading for PDF viewers

---

*Last Updated: October 31, 2025*
*This document maps all API endpoints and database schemas in the project*
