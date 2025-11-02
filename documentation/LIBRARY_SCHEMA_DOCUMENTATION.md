# Library Reference Books Schema Documentation

## Overview
The library reference books in the MongoDB `books` collection represent the books displayed in the **Library section** of the application. These are different from the GitHub reference books used in the RAG system.

---

## 📋 **Current MongoDB Schema (books collection)**

### **Core Book Information**
```javascript
{
  _id: ObjectId,                    // MongoDB unique identifier
  title: String,                    // Book title (required, max 300 chars)
  author: String,                   // Author name (required, max 200 chars)
  isbn: String,                     // ISBN number (optional, max 17 chars)
  publisher: String,                // Publisher name (optional, max 200 chars)
  edition: String,                  // Edition info (optional, max 50 chars)
}
```

### **Classification**
```javascript
{
  subject: String,                  // Academic subject (required, max 100 chars)
  category: String,                 // Book category (required, max 100 chars)
  tags: [String],                   // Array of tags/keywords (max 50 chars each)
  language: String,                 // Language (default: 'English', max 50 chars)
}
```

### **Physical Properties**
```javascript
{
  year: Number,                     // Publication year (1900 to current year)
  pages: Number,                    // Number of pages (min: 1)
  fileName: String,                 // PDF filename (required)
  fileSize: Number,                 // File size in bytes (min: 0)
}
```

### **Content & Description**
```javascript
{
  description: String,              // Book description (max 1000 chars)
  coverImage: String,               // Cover image URL (default: '/api/placeholder/300/400')
}
```

### **Enhanced AI-Generated Metadata** *(75.4% of books have complete metadata)*
```javascript
{
  summary: String,                  // AI-generated summary (max 2000 chars) - 81.4% populated
  key_concepts: [String],           // Core learning concepts (max 100 chars each) - 75.4% populated
  difficulty: String,               // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' - 82.2% populated
  target_audience: String,          // 'Students' | 'Professionals' | 'Researchers' | 'General' - 82.2% populated
  prerequisites: [String],          // Required prior knowledge (max 200 chars each) - 75.4% populated
}
```

### **File Information**
```javascript
{
  file_url: String,                 // File URL or download link (default: "N/A", max 500 chars)
}
```

### **Availability & Status**
```javascript
{
  availability: String,             // 'available' | 'borrowed' | 'reserved' (default: 'available')
}
```

### **Statistics & Engagement**
```javascript
{
  downloadCount: Number,            // Download count (default: 0, min: 0)
  rating: Number,                   // User rating (default: 0, min: 0, max: 5)
  reviewCount: Number,              // Number of reviews (default: 0, min: 0)
}
```

### **Timestamps**
```javascript
{
  addedDate: Date,                  // When book was added (default: Date.now)
  updatedAt: Date,                  // Last update timestamp (default: Date.now)
  createdAt: Date,                  // Creation timestamp (auto-generated)
  __v: Number                       // MongoDB version key
}
```

---

## 🔍 **Database Indexes** *(For Performance)*

### **Text Search Index**
```javascript
{
  title: 'text',
  author: 'text', 
  description: 'text',
  summary: 'text',
  key_concepts: 'text'
}
```

### **Category & Classification Indexes**
```javascript
{ subject: 1, category: 1 }
{ difficulty: 1, target_audience: 1 }
```

### **Sorting & Performance Indexes**
```javascript
{ addedDate: -1 }        // For recent books
{ downloadCount: -1 }    // For popular books
{ rating: -1 }           // For top-rated books
```

---

## 📊 **Current Data Statistics**

- **Total Books**: 118 documents
- **Enhanced Metadata Coverage**:
  - ✅ **Complete Enhancement** (all 5 fields): 89/118 (75.4%)
  - 🟡 **Partial Enhancement** (some fields): 8/118 (6.8%)
  - ❌ **No Enhancement** (no fields): 21/118 (17.8%)
- **Field-Specific Coverage**:
  - **summary**: 96/118 (81.4%)
  - **key_concepts**: 89/118 (75.4%)
  - **difficulty**: 97/118 (82.2%)
  - **target_audience**: 97/118 (82.2%)
  - **prerequisites**: 89/118 (75.4%)
- **GitHub URLs**: 0 books (these are local library books)
- **File Storage**: Local files served from `/docs/library/` directory

---

## 🎯 **Frontend Interface Schema** *(TypeScript)*

```typescript
interface LibraryBook {
  _id: string
  title: string
  author: string
  isbn?: string
  publisher?: string
  edition?: string
  subject: string
  category: string
  year?: number
  pages?: number
  language: string
  rating: number
  reviewCount: number
  description: string
  coverImage: string
  fileName: string
  fileSize?: number
  availability: 'available' | 'borrowed' | 'reserved'
  addedDate: string
  downloadCount: number
  tags: string[]
  
  // Enhanced metadata (when implemented)
  summary?: string
  key_concepts?: string[]
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  target_audience?: 'Students' | 'Professionals' | 'Researchers' | 'General'
  prerequisites?: string[]
}
```

---

## 🔧 **API Endpoints**

### **GET /api/books**
- **Purpose**: Fetch all library books with filtering and pagination
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20)
  - `search` (string): Search query for title/author/description/tags
  - `category` (string): Filter by category
  - `subject` (string): Filter by subject
  - `author` (string): Filter by author
  - `sortBy` (string): Sort field ('recent', 'title', 'author', 'rating', 'downloads', 'pages', 'year')
  - `order` (string): Sort order ('asc' | 'desc')

### **GET /api/books/:id**
- **Purpose**: Get specific book by MongoDB ID
- **Returns**: Single book document with all fields

### **GET /api/books/categories/list**
- **Purpose**: Get all unique categories
- **Returns**: Array of category strings

### **GET /api/books/subjects/list**
- **Purpose**: Get all unique subjects
- **Returns**: Array of subject strings

---

## 📁 **File Storage Structure**

```
docs/
├── library/           # PDF files for library books
│   ├── book1.pdf
│   ├── book2.pdf
│   └── ...
└── wireframes/        # Design files (not books)
```

**Access Pattern**: `http://localhost:5050/docs/library/{fileName}`

---

## 🆚 **Difference from RAG System Books**

| Feature | Library Books | RAG System Books |
|---------|---------------|------------------|
| **Source** | Local uploads/manually added | GitHub repository PDFs |
| **Enhanced Metadata** | 75.4% complete, 82% partial | Fully populated with AI enhancement |
| **File Storage** | `/docs/library/` directory | Local cache + GitHub URLs |
| **Usage** | Frontend Library display | RAG search and retrieval |
| **Collection** | `books` collection | ChromaDB + MongoDB reference |
| **Count** | 118 books (89 fully enhanced) | 97 GitHub books |

---

## 🚀 **Enhancement Opportunities**

### **Immediate Actions**
1. **Populate Enhanced Metadata**: Run AI enhancement on library books
2. **Add file_url Fields**: Link to actual PDF files
3. **Implement Rating System**: Allow user ratings and reviews
4. **Add Search Indexing**: Improve text search capabilities

### **Advanced Features**
1. **RAG Integration**: Include library books in RAG search
2. **Content Extraction**: Extract and index full-text content
3. **Cross-References**: Link related books and concepts
4. **User Analytics**: Track reading patterns and recommendations

---

## 📝 **Usage in Application**

### **Library Page** (`/library`)
- Displays all books in grid/list view
- Filtering by category, subject, author
- Search functionality across title, author, description, tags
- Sorting by recent, popular, rating, alphabetical
- Pagination support

### **Book Reader** (`/library/reader/:bookId`)
- PDF viewer for individual books
- Book metadata display
- Navigation back to library
- Download tracking

### **Integration Points**
- **Workspace**: Books can be opened in workspace
- **Study Materials**: Cross-linking with study content
- **User Profiles**: Reading history and preferences

---

**Last Updated**: November 2, 2025  
**Schema Version**: 1.0  
**Database**: MongoDB (`study-ai.books`)  
**Total Documents**: 118 books
