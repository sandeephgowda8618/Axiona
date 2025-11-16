# 🗄️ Axiona Database Schema Documentation

**Database Name**: `study-ai`  
**MongoDB URI**: `mongodb://localhost:27017/study-ai`  
**Last Updated**: November 13, 2025  
**Total Collections**: 25+ collections  
**Total Documents**: 1,200+ documents across all collections

---

## 📊 **OVERVIEW STATISTICS**

| Collection | Documents | Purpose | Storage Type |
|------------|-----------|---------|--------------|
| **videos** | 94 | YouTube educational videos | Document |
| **books** | 448 | Library management system | Document |
| **studymaterials** | 331 | Academic materials (PPT/PDF/DOC) | Document |
| **pdfs** | 12 | Course-specific PDFs | Document + GridFS |
| **notes** | 13 | User-generated notes | Document |
| **meetings** | 8 | Video conference sessions | Document |
| **users** | 2 | User accounts | Document |
| **pdfs.files** | 220 | GridFS file metadata | GridFS |
| **pdfs.chunks** | 879 | GridFS file chunks | GridFS |

---

## 🎬 **VIDEOS COLLECTION**

### **Schema Structure**
```javascript
const VideoSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  thumbnailUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      }
    }
  },
  videoUrl: String,
  youtubeId: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[a-zA-Z0-9_-]{11}$/.test(v);
      }
    }
  },
  durationSec: {
    type: Number,
    required: true,
    min: 0
  },
  channelName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  topicTags: [{
    type: String,
    trim: true
  }],
  views: { type: Number, default: 0, min: 0 },
  likes: { type: Number, default: 0, min: 0 },
  saves: { type: Number, default: 0, min: 0 },
  downloads: { type: Number, default: 0, min: 0 },
  uploadedAt: { type: Date, default: Date.now },
  playlistId: String,
  playlistTitle: String,
  episodeNumber: Number,
  createdAt: { type: Date, default: Date.now }
});

// Indexes
VideoSchema.index({ title: 'text', channelName: 'text' });
VideoSchema.index({ topicTags: 1 });
VideoSchema.index({ uploadedAt: -1 });
VideoSchema.index({ views: -1 });
```

### **Sample Documents**

#### **Sample 1: SQL Database Tutorial**
```json
{
  "_id": "68ff4faac1b10ddf9abfe20d",
  "title": "SQL Database Design - Normalization and Best Practices",
  "description": "Learn database design principles, normalization, relationships, and SQL best practices for efficient database management.",
  "thumbnailUrl": "https://i.ytimg.com/vi/UrYLYV7WSHM/maxresdefault.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=UrYLYV7WSHM",
  "youtubeId": "UrYLYV7WSHM",
  "durationSec": 14520,
  "channelName": "Database Masters",
  "topicTags": ["sql", "database", "design"],
  "views": 167000,
  "likes": 4500,
  "saves": 890,
  "downloads": 234,
  "uploadedAt": "2025-10-27T10:55:38.448Z",
  "createdAt": "2025-10-27T10:55:38.448Z",
  "__v": 0
}
```

#### **Sample 2: Git Version Control**
```json
{
  "_id": "68ff4faac1b10ddf9abfe20e",
  "title": "Git and GitHub - Version Control Mastery",
  "description": "Master Git version control and GitHub collaboration. Learn branching, merging, pull requests, and team workflows.",
  "thumbnailUrl": "https://i.ytimg.com/vi/RGOj5yH7evk/maxresdefault.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=RGOj5yH7evk",
  "youtubeId": "RGOj5yH7evk",
  "durationSec": 7200,
  "channelName": "DevOps Academy",
  "topicTags": ["git", "github", "version-control"],
  "views": 234000,
  "likes": 6700,
  "saves": 1200,
  "downloads": 445,
  "uploadedAt": "2025-10-27T10:55:38.448Z",
  "createdAt": "2025-10-27T10:55:38.448Z",
  "__v": 0
}
```

#### **Sample 3: IoT Tutorial**
```json
{
  "_id": "69071f14e03e16e0a55939a7",
  "title": "IoT - Quick Guide",
  "description": "Quick guide to IoT concepts and practical applications.",
  "thumbnailUrl": "https://img.youtube.com/vi/6ptZr9VRxPs/maxresdefault.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=6ptZr9VRxPs",
  "youtubeId": "6ptZr9VRxPs",
  "durationSec": 3600,
  "channelName": "ECE Tutorial Channel",
  "topicTags": ["iot_and_embedded_applications", "electronics_&_communication_engineering", "ece"],
  "uploadedAt": "2025-11-02T09:06:28.593Z",
  "views": 0,
  "likes": 0,
  "saves": 0,
  "downloads": 0,
  "createdAt": "2025-11-02T09:06:28.593Z",
  "__v": 0
}
```

### **Analytics**
- **Total Videos**: 94
- **Total Duration**: 222 hours (801,060 seconds)
- **Average Duration**: 142 minutes
- **Total Views**: 48.8M
- **Total Likes**: 1.1M
- **Top Channel**: ECE Tutorial Channel (54 videos)
- **Top Topics**: Engineering, Electronics, JavaScript, Python

---

## 📚 **BOOKS COLLECTION**

### **Schema Structure**
```javascript
const BookSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  author: { type: String, required: true, trim: true, maxlength: 200 },
  isbn: { type: String, trim: true, maxlength: 17 },
  publisher: { type: String, trim: true, maxlength: 200 },
  edition: { type: String, trim: true, maxlength: 50 },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: Number, min: 1900, max: new Date().getFullYear() },
  pages: { type: Number, min: 1 },
  language: { type: String, default: 'English', maxlength: 50 },
  description: { type: String, maxlength: 1000 },
  tags: [{ type: String, trim: true }],
  fileName: String,
  fileSize: { type: Number, min: 0 },
  availability: { type: String, enum: ['available', 'checked-out', 'reserved'], default: 'available' },
  downloadCount: { type: Number, default: 0, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  coverImage: String,
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  key_concepts: [String],
  prerequisites: [String],
  summary: String,
  target_audience: String,
  addedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
BookSchema.index({ title: 'text', author: 'text', subject: 'text' });
BookSchema.index({ subject: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({ rating: -1 });
```

### **Sample Documents**

#### **Sample 1: AI for Data Science**
```json
{
  "_id": "69047d7a07fd7f58406b77a1",
  "title": "AI for Data Science – Artificial-Intelligence Frameworks and Functionality for Deep Learning, Optimization and Beyond",
  "author": "Zacharias Yunus, Emrah Bul",
  "subject": "Artificial Intelligence",
  "category": "Machine Learning",
  "language": "English",
  "description": "Hands-on guide to AI frameworks for deep-learning, optimisation and data-science workflows.",
  "tags": ["AI", "deep-learning", "optimisation", "data-science", "frameworks"],
  "fileName": "AI for data science.pdf",
  "fileSize": 54536456,
  "availability": "available",
  "downloadCount": 0,
  "rating": 4.2,
  "reviewCount": 89,
  "coverImage": "/api/placeholder/300/400",
  "difficulty": "Intermediate",
  "key_concepts": [
    "Deep Learning",
    "Hyper-parameter tuning", 
    "AutoML",
    "GPU acceleration",
    "MLOps pipelines"
  ],
  "prerequisites": ["Python", "Basic ML", "Linear algebra", "NumPy / Pandas"],
  "summary": "A practical tour of modern AI libraries (TensorFlow, PyTorch, Keras, scikit-learn) showing how to build, tune and deploy deep-learning and optimisation models for real data-science tasks.",
  "target_audience": "Professionals",
  "addedDate": "2025-10-31T09:12:26.264Z",
  "updatedAt": "2025-10-31T09:12:26.267Z",
  "createdAt": "2025-10-31T09:12:26.267Z",
  "__v": 0
}
```

#### **Sample 2: Database Management Systems**
```json
{
  "_id": "69047d7b07fd7f58406b7801",
  "title": "Database System Concepts",
  "author": "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
  "subject": "Database Management Systems",
  "category": "Computer Science",
  "edition": "7th Edition",
  "year": 2019,
  "pages": 1376,
  "language": "English",
  "description": "Comprehensive textbook covering database concepts, design, and implementation.",
  "tags": ["database", "DBMS", "SQL", "relational", "normalization"],
  "fileSize": 45623789,
  "availability": "available", 
  "downloadCount": 156,
  "rating": 4.7,
  "reviewCount": 234,
  "difficulty": "Intermediate",
  "key_concepts": ["Relational Model", "SQL", "Normalization", "Transaction Management"],
  "prerequisites": ["Data Structures", "Basic Programming"],
  "target_audience": "Students",
  "addedDate": "2025-10-31T09:12:26.264Z",
  "createdAt": "2025-10-31T09:12:26.267Z"
}
```

#### **Sample 3: Machine Learning Textbook**
```json
{
  "_id": "69047d7b07fd7f58406b7823",
  "title": "Pattern Recognition and Machine Learning", 
  "author": "Christopher Bishop",
  "subject": "Machine Learning",
  "category": "Computer Science",
  "edition": "1st Edition",
  "year": 2006,
  "pages": 738,
  "language": "English",
  "description": "Advanced mathematical treatment of machine learning algorithms and statistical pattern recognition.",
  "tags": ["machine-learning", "pattern-recognition", "bayesian", "statistics"],
  "fileSize": 23456789,
  "availability": "available",
  "downloadCount": 89,
  "rating": 4.5,
  "reviewCount": 145,
  "difficulty": "Advanced", 
  "key_concepts": ["Bayesian Networks", "Neural Networks", "SVM", "Gaussian Processes"],
  "prerequisites": ["Linear Algebra", "Calculus", "Probability Theory", "Statistics"],
  "target_audience": "Graduate Students",
  "addedDate": "2025-10-31T09:12:26.264Z",
  "createdAt": "2025-10-31T09:12:26.267Z"
}
```

### **Analytics**
- **Total Books**: 448
- **Average File Size**: 10.38 MB
- **Total Downloads**: 12,699
- **Average Rating**: 0.80/5
- **Top Subjects**: Database Management (67), Computer Science (50), Machine Learning (45)

---

## 📖 **STUDY MATERIALS COLLECTION**

### **Schema Structure**
```javascript
const StudyMaterialSchema = new Schema({
  title: { type: String, required: true, maxlength: 500 },
  author: String,
  subject: { type: String, required: true },
  subject_key: String,
  semester: Number,
  unit: String,
  topic: String,
  category: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  fileName: { type: String, required: true },
  pages: Number,
  language: { type: String, default: 'English' },
  publisher: String,
  publication_year: Number,
  isbn: String,
  file_url: { type: String, required: true },
  downloadUrl: String,
  thumbnail: String,
  description: String,
  tags: [String],
  file_type: { type: String, enum: ['PDF', 'PPTX', 'DOCX', 'PPS'] },
  file_size: Number,
  uploadDate: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  uploadedBy: String,
  isActive: { type: Boolean, default: true },
  class: String,
  year: String,
  fileSize: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
StudyMaterialSchema.index({ title: 'text', subject: 'text', topic: 'text' });
StudyMaterialSchema.index({ subject: 1 });
StudyMaterialSchema.index({ file_type: 1 });
StudyMaterialSchema.index({ uploadDate: -1 });
```

### **Sample Documents**

#### **Sample 1: AFLL Unit 1**
```json
{
  "_id": "690794feec3bd406b946a6e1",
  "title": "Automata Formal Languages & Logic - Unit 1: Finite Automata to Regular Expression using State Elimination",
  "author": "StudyPES Materials",
  "subject": "Automata & Formal Language Theory",
  "subject_key": "GEN",
  "semester": 3,
  "unit": "1",
  "topic": "Finite Automata to Regular Expression",
  "category": "StudyPES",
  "level": "Intermediate",
  "fileName": "Sem3_AFLL_U1_L18.pptx",
  "pages": 98,
  "language": "English",
  "publisher": "StudyPES",
  "publication_year": 2024,
  "file_url": "/uploads/studypes/Sem3_AFLL_U1_L18.pptx",
  "downloadUrl": "/api/materials/download/Sem3_AFLL_U1_L18.pptx",
  "thumbnail": "/images/default-thumbnail.png",
  "description": "This document covers the conversion of Finite Automata (FA) to Regular Expressions (RE) using the State Elimination Algorithm. It provides a step-by-step method with multiple examples demonstrating the process of simplifying FA to derive its equivalent regular expression.",
  "tags": [
    "automata", "formal languages", "regular expression", "finite automata", 
    "state elimination algorithm", "regular grammar", "computer science"
  ],
  "file_type": "PPTX",
  "file_size": 2789376,
  "uploadDate": "2025-11-02T17:29:34.964Z",
  "downloadCount": 0,
  "approved": true,
  "uploadedBy": "studypes_system",
  "isActive": true,
  "class": "2nd Year",
  "year": "2024",
  "fileSize": "2.66 MB",
  "__v": 0,
  "createdAt": "2025-11-02T17:29:34.976Z",
  "updatedAt": "2025-11-02T17:29:34.976Z"
}
```

#### **Sample 2: Database Systems PPT**
```json
{
  "_id": "690794feec3bd406b946a6e2",
  "title": "Database Management Systems - Unit 2: Normalization and Functional Dependencies",
  "author": "StudyPES Materials",
  "subject": "Database Management Systems",
  "subject_key": "DBMS",
  "semester": 4,
  "unit": "2", 
  "topic": "Normalization",
  "category": "StudyPES",
  "level": "Intermediate",
  "fileName": "Sem4_DBMS_U2_L15.pptx",
  "pages": 45,
  "language": "English",
  "publisher": "StudyPES",
  "publication_year": 2024,
  "file_url": "/uploads/studypes/Sem4_DBMS_U2_L15.pptx",
  "downloadUrl": "/api/materials/download/Sem4_DBMS_U2_L15.pptx",
  "description": "Comprehensive coverage of database normalization forms (1NF, 2NF, 3NF, BCNF) with practical examples and functional dependency analysis.",
  "tags": ["database", "normalization", "functional dependencies", "BCNF", "relational model"],
  "file_type": "PPTX",
  "file_size": 1456789,
  "uploadDate": "2025-11-02T17:29:34.964Z",
  "downloadCount": 23,
  "approved": true,
  "uploadedBy": "studypes_system",
  "isActive": true,
  "class": "2nd Year", 
  "year": "2024",
  "fileSize": "1.39 MB",
  "createdAt": "2025-11-02T17:29:34.976Z",
  "updatedAt": "2025-11-02T17:29:34.976Z"
}
```

#### **Sample 3: Data Structures PDF**
```json
{
  "_id": "690794feec3bd406b946a6e3",
  "title": "Data Structures & Algorithms - Unit 3: Trees and Graph Algorithms",
  "author": "StudyPES Materials",
  "subject": "Data Structures & Algorithms",
  "subject_key": "DSA",
  "semester": 3,
  "unit": "3",
  "topic": "Trees and Graphs",
  "category": "StudyPES",
  "level": "Advanced",
  "fileName": "Sem3_DSA_U3_TreesGraphs.pdf",
  "pages": 67,
  "language": "English",
  "publisher": "StudyPES",
  "publication_year": 2024,
  "file_url": "/uploads/studypes/Sem3_DSA_U3_TreesGraphs.pdf",
  "downloadUrl": "/api/materials/download/Sem3_DSA_U3_TreesGraphs.pdf",
  "description": "Advanced tree data structures including AVL trees, B-trees, and graph algorithms like DFS, BFS, Dijkstra's algorithm with implementation details.",
  "tags": ["data structures", "algorithms", "trees", "graphs", "AVL", "dijkstra"],
  "file_type": "PDF", 
  "file_size": 3245678,
  "uploadDate": "2025-11-02T17:29:34.964Z",
  "downloadCount": 45,
  "approved": true,
  "uploadedBy": "studypes_system",
  "isActive": true,
  "class": "2nd Year",
  "year": "2024", 
  "fileSize": "3.09 MB",
  "createdAt": "2025-11-02T17:29:34.976Z",
  "updatedAt": "2025-11-02T17:29:34.976Z"
}
```

### **Analytics**
- **Total Materials**: 331
- **Average File Size**: 2.57 MB
- **File Types**: PDF (208), PPTX (107), DOCX (11), PPS (4)
- **Primary Source**: StudyPES academic materials

---

## 📄 **PDFS COLLECTION**

### **Schema Structure**
```javascript
const PDFSchema = new Schema({
  topic: { type: String, required: true, trim: true, maxlength: 200 },
  fileName: { type: String, required: true, trim: true },
  gridFSFileId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'fs.files' },
  fileUrl: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/.+\.pdf$|\/docs\/.+\.pdf$|\/api\/pdfs\/file\/.+)$/i.test(v);
      }
    }
  },
  fileSize: { type: Number, required: true, min: 0 },
  pages: { type: Number, required: true, min: 1 },
  author: { type: String, trim: true, maxlength: 100 },
  domain: { type: String, trim: true, maxlength: 100 },
  year: { type: Number, min: 1900, max: new Date().getFullYear() + 1 },
  class: { type: String, trim: true, maxlength: 50 },
  description: { type: String, maxlength: 500 },
  downloadCount: { type: Number, default: 0, min: 0 },
  approved: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
PDFSchema.index({ topic: 'text', fileName: 'text', author: 'text' });
PDFSchema.index({ domain: 1 });
PDFSchema.index({ year: 1 });
PDFSchema.index({ downloadCount: -1 });
```

### **Sample Documents**

#### **Sample 1: Sets Theory - AFLL**
```json
{
  "_id": "69006719b0f7257714c98019",
  "topic": "Sets - AFLL",
  "fileName": "1.Sets.pdf",
  "gridFSFileId": "69006719b0f7257714c9800c",
  "fileUrl": "/api/pdfs/file/69006719b0f7257714c9800c",
  "fileSize": 2893601,
  "pages": 58,
  "author": "AFLL Course Material",
  "domain": "AFLL",
  "year": 3,
  "class": "Third Year CSE",
  "description": "Introduction to Sets theory, set operations, and mathematical foundations for automata theory.",
  "downloadCount": 245,
  "approved": true,
  "uploadedBy": "68ffb16c997866b5ec3d2435",
  "publishedAt": "2025-10-28T06:47:53.752Z",
  "createdAt": "2025-10-28T06:47:53.752Z",
  "__v": 0
}
```

#### **Sample 2: Functions & Relations - AFLL**
```json
{
  "_id": "69006719b0f7257714c98029",
  "topic": "Functions & Relations - AFLL",
  "fileName": "2.Functions&Relations.pdf",
  "gridFSFileId": "69006719b0f7257714c9801b",
  "fileUrl": "/api/pdfs/file/69006719b0f7257714c9801b",
  "fileSize": 3385003,
  "pages": 68,
  "author": "AFLL Course Material",
  "domain": "AFLL",
  "year": 3,
  "class": "Third Year CSE",
  "description": "Mathematical functions, relations, and their properties in formal language theory.",
  "downloadCount": 198,
  "approved": true,
  "uploadedBy": "68ffb16c997866b5ec3d2435",
  "publishedAt": "2025-10-28T06:47:53.772Z",
  "createdAt": "2025-10-28T06:47:53.772Z",
  "__v": 0
}
```

#### **Sample 3: Deterministic Finite Automata**
```json
{
  "_id": "69006719b0f7257714c98033",
  "topic": "Deterministic Finite Automata - AFLL",
  "fileName": "3.DFA.pdf",
  "gridFSFileId": "69006719b0f7257714c9802b",
  "fileUrl": "/api/pdfs/file/69006719b0f7257714c9802b",
  "fileSize": 1693162,
  "pages": 34,
  "author": "AFLL Course Material",
  "domain": "AFLL",
  "year": 3,
  "class": "Third Year CSE",
  "description": "Complete guide to Deterministic Finite Automata, state diagrams, and transition functions.",
  "downloadCount": 567,
  "approved": true,
  "uploadedBy": "68ffb16c997866b5ec3d2435",
  "publishedAt": "2025-10-28T06:47:53.773Z",
  "createdAt": "2025-10-28T06:47:53.773Z",
  "__v": 0
}
```

### **Analytics**
- **Total PDFs**: 12
- **Total Pages**: 270
- **Average Pages**: 23 per PDF
- **Average File Size**: 1.05 MB
- **Total Downloads**: 6,273
- **Storage**: GridFS file system

---

## 📝 **NOTES COLLECTION**

### **Schema Structure**
```javascript
const NoteSchema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true },
  pdfId: { type: mongoose.Schema.Types.ObjectId, ref: 'PDF' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pdfTitle: String,
  pageNumber: Number,
  tags: [{ type: String, trim: true }],
  isPublic: { type: Boolean, default: false },
  lastViewedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes  
NoteSchema.index({ userId: 1 });
NoteSchema.index({ pdfId: 1 });
NoteSchema.index({ title: 'text', content: 'text' });
NoteSchema.index({ createdAt: -1 });
```

### **Sample Documents**

#### **Sample 1: Regular Expressions Notes**
```json
{
  "_id": "69006e93de69cbe946e49571",
  "title": "My Notes on Regular Expressions",
  "content": "Regular expressions are a powerful tool for pattern matching. Key concepts include:\n\n1. Basic symbols: a, b, c\n2. Operators: *, +, ?\n3. Concatenation and union\n4. Equivalence with finite automata\n\nThis is really helpful for understanding AFLL concepts.",
  "pdfId": "69006719b0f7257714c9803d",
  "userId": "676d9d6633a5e44ddef57dc3",
  "pdfTitle": "Regular Expressions - AFLL",
  "tags": ["regex", "AFLL", "theory", "study-notes"],
  "isPublic": false,
  "lastViewedAt": "2025-10-28T07:19:47.761Z",
  "createdAt": "2025-10-28T07:19:47.761Z",
  "updatedAt": "2025-10-28T07:19:47.762Z",
  "__v": 0
}
```

#### **Sample 2: DFA Minimization Notes**
```json
{
  "_id": "69006e9dde69cbe946e49577",
  "title": "DFA Minimization Concepts",
  "content": "DFA minimization is an important optimization technique:\n\n- Remove unreachable states\n- Merge equivalent states\n- Use partition refinement algorithm\n- Results in minimal DFA with same language\n\nThis helps reduce memory and computation requirements.",
  "pdfId": "69006719b0f7257714c9803d",
  "userId": "676d9d6633a5e44ddef57dc3",
  "pdfTitle": "Regular Expressions - AFLL",
  "tags": ["DFA", "minimization", "optimization"],
  "isPublic": true,
  "lastViewedAt": "2025-10-28T07:19:57.326Z",
  "createdAt": "2025-10-28T07:19:57.326Z",
  "updatedAt": "2025-10-28T07:19:57.326Z",
  "__v": 0
}
```

#### **Sample 3: Test Note with Page Reference**
```json
{
  "_id": "6900f83852e05311dc12b710",
  "title": "Test Note - Page 1",
  "content": "This is a test note for the Regular Expressions PDF",
  "pdfId": "69006719b0f7257714c9803d",
  "userId": "671f3b8c2a5f123456789def",
  "pdfTitle": "Regular Expressions - AFLL",
  "pageNumber": 1,
  "tags": ["test", "AFLL"],
  "isPublic": false,
  "lastViewedAt": "2025-10-28T17:07:04.637Z",
  "createdAt": "2025-10-28T17:07:04.637Z",
  "updatedAt": "2025-10-28T17:07:04.637Z",
  "__v": 0
}
```

### **Analytics**
- **Total Notes**: 13
- **Public Notes**: 1 (7.7%)
- **Private Notes**: 12 (92.3%)
- **Most Common Tags**: AFLL, test, regex, theory
- **Associated PDFs**: 1 (Regular Expressions - AFLL)

---

## 👥 **USERS COLLECTION**

### **Schema Structure**
```javascript
const UserSchema = new Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: Date,
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'English' }
  },
  stats: {
    coursesCompleted: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    totalNotes: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ fullName: 'text' });
UserSchema.index({ createdAt: -1 });
```

### **Sample Documents**

#### **Sample 1: Admin User**
```json
{
  "_id": "68ffb16c997866b5ec3d2435",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/8.4ql9V2FJQR0K.fO",
  "role": "admin",
  "isEmailVerified": true,
  "lastLoginAt": "2025-11-13T06:30:15.123Z",
  "preferences": {
    "theme": "light",
    "notifications": true,
    "language": "English"
  },
  "stats": {
    "coursesCompleted": 5,
    "streakDays": 12,
    "totalNotes": 8,
    "totalStudyTime": 14500
  },
  "createdAt": "2025-10-27T10:55:38.123Z",
  "updatedAt": "2025-11-13T06:30:15.123Z",
  "__v": 0
}
```

#### **Sample 2: Student User**
```json
{
  "_id": "676d9d6633a5e44ddef57dc3",
  "fullName": "Jane Smith",
  "email": "jane.smith@student.edu",
  "password": "$2b$12$8yLEWT/QJmA6b9ZHMVL5k.8hKzn5BRNjyJYJ2m8Q7L8kFqY8.6ZQK",
  "role": "student",
  "isEmailVerified": true,
  "lastLoginAt": "2025-11-12T14:22:10.456Z",
  "preferences": {
    "theme": "dark", 
    "notifications": true,
    "language": "English"
  },
  "stats": {
    "coursesCompleted": 2,
    "streakDays": 7,
    "totalNotes": 5,
    "totalStudyTime": 8750
  },
  "createdAt": "2025-10-28T07:15:22.456Z",
  "updatedAt": "2025-11-12T14:22:10.456Z",
  "__v": 0
}
```

### **Analytics**
- **Total Users**: 2
- **Roles**: 1 Admin, 1 Student
- **Email Verification**: 100% verified
- **Theme Preferences**: 50% light, 50% dark
- **Average Study Time**: 11,625 seconds (3.2 hours)

---

## 📹 **MEETINGS COLLECTION**

### **Schema Structure**
```javascript
const MeetingSchema = new Schema({
  meetingId: { type: String, required: true, unique: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  password: { type: String, minlength: 4, maxlength: 20 },
  participants: [{
    userId: String,
    userName: String,
    joinedAt: Date,
    leftAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
  maxParticipants: { type: Number, default: 6, min: 2, max: 20 },
  settings: {
    allowChat: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    muteOnJoin: { type: Boolean, default: false }
  },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
MeetingSchema.index({ meetingId: 1 }, { unique: true });
MeetingSchema.index({ hostId: 1 });
MeetingSchema.index({ status: 1 });
```

### **Sample Documents**

#### **Sample 1: Active Study Session**
```json
{
  "_id": "673456789012345678901234",
  "meetingId": "study-session-123",
  "title": "AFLL Study Group - Regular Expressions",
  "description": "Group study session for Automata and Formal Language Theory - Unit 2",
  "hostId": "68ffb16c997866b5ec3d2435",
  "hostName": "John Doe",
  "password": "afll2025",
  "participants": [
    {
      "userId": "68ffb16c997866b5ec3d2435",
      "userName": "John Doe",
      "joinedAt": "2025-11-13T10:00:00.000Z",
      "isActive": true
    },
    {
      "userId": "676d9d6633a5e44ddef57dc3",
      "userName": "Jane Smith", 
      "joinedAt": "2025-11-13T10:02:15.000Z",
      "isActive": true
    }
  ],
  "status": "active",
  "maxParticipants": 6,
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "muteOnJoin": false
  },
  "scheduledAt": "2025-11-13T10:00:00.000Z",
  "startedAt": "2025-11-13T10:00:00.000Z",
  "createdAt": "2025-11-13T09:45:00.000Z",
  "updatedAt": "2025-11-13T10:02:15.000Z",
  "__v": 0
}
```

#### **Sample 2: Scheduled Database Review**
```json
{
  "_id": "673456789012345678901235",
  "meetingId": "db-review-456",
  "title": "Database Design Review Session",
  "description": "Review session for database normalization and design principles",
  "hostId": "676d9d6633a5e44ddef57dc3",
  "hostName": "Jane Smith",
  "participants": [],
  "status": "scheduled",
  "maxParticipants": 4,
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "muteOnJoin": true
  },
  "scheduledAt": "2025-11-14T15:30:00.000Z",
  "createdAt": "2025-11-13T11:20:00.000Z",
  "updatedAt": "2025-11-13T11:20:00.000Z",
  "__v": 0
}
```

#### **Sample 3: Ended ML Discussion**
```json
{
  "_id": "673456789012345678901236",
  "meetingId": "ml-discuss-789",
  "title": "Machine Learning Algorithms Discussion",
  "description": "Deep dive into supervised learning algorithms and their applications",
  "hostId": "68ffb16c997866b5ec3d2435",
  "hostName": "John Doe",
  "participants": [
    {
      "userId": "68ffb16c997866b5ec3d2435",
      "userName": "John Doe",
      "joinedAt": "2025-11-12T16:00:00.000Z",
      "leftAt": "2025-11-12T17:30:00.000Z",
      "isActive": false
    },
    {
      "userId": "676d9d6633a5e44ddef57dc3", 
      "userName": "Jane Smith",
      "joinedAt": "2025-11-12T16:05:00.000Z",
      "leftAt": "2025-11-12T17:30:00.000Z",
      "isActive": false
    }
  ],
  "status": "ended",
  "maxParticipants": 6,
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "muteOnJoin": false
  },
  "scheduledAt": "2025-11-12T16:00:00.000Z",
  "startedAt": "2025-11-12T16:00:00.000Z",
  "endedAt": "2025-11-12T17:30:00.000Z",
  "createdAt": "2025-11-12T15:45:00.000Z",
  "updatedAt": "2025-11-12T17:30:00.000Z",
  "__v": 0
}
```

### **Analytics**
- **Total Meetings**: 8
- **Active Meetings**: 1 (12.5%)
- **Average Duration**: 90 minutes
- **Most Popular Settings**: Chat enabled (100%), Screen share enabled (100%)

---

## 🗂️ **GRIDFS STORAGE SYSTEM**

### **GridFS Files (220 documents)**
```javascript
// GridFS fs.files collection schema
{
  _id: ObjectId,
  filename: String,
  contentType: String,
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  metadata: {
    originalName: String,
    uploadedBy: ObjectId,
    description: String
  }
}
```

### **GridFS Chunks (879 documents)**
```javascript
// GridFS fs.chunks collection schema  
{
  _id: ObjectId,
  files_id: ObjectId,  // References fs.files._id
  n: Number,           // Chunk number
  data: BinData        // Binary chunk data
}
```

### **Storage Analytics**
- **Total Files**: 220 files stored in GridFS
- **Total Chunks**: 879 chunks (average 4 chunks per file)
- **Chunk Size**: 255KB default
- **Content Types**: PDF, PPTX, DOCX, images
- **Total Storage**: ~4.8 GB estimated

---

## 📊 **DATABASE PERFORMANCE INDEXES**

### **Text Search Indexes**
```javascript
// Videos collection
{ "title": "text", "channelName": "text" }

// Books collection  
{ "title": "text", "author": "text", "subject": "text" }

// Study Materials collection
{ "title": "text", "subject": "text", "topic": "text" }

// PDFs collection
{ "topic": "text", "fileName": "text", "author": "text" }

// Notes collection
{ "title": "text", "content": "text" }
```

### **Performance Indexes**
```javascript
// Frequently queried fields
{ "uploadedAt": -1 }    // Videos by recent
{ "views": -1 }         // Popular videos
{ "subject": 1 }        // Books by subject
{ "file_type": 1 }      // Materials by type
{ "downloadCount": -1 } // Popular downloads
{ "userId": 1 }         // User's content
{ "createdAt": -1 }     // Recent content
```

---

## 🔗 **COLLECTION RELATIONSHIPS**

### **Reference Relationships**
```javascript
// Notes -> PDFs relationship
notes.pdfId -> pdfs._id

// Notes -> Users relationship  
notes.userId -> users._id

// PDFs -> Users relationship (uploader)
pdfs.uploadedBy -> users._id

// PDFs -> GridFS relationship
pdfs.gridFSFileId -> fs.files._id

// Meetings -> Users relationship
meetings.hostId -> users.firebaseUid
meetings.participants.userId -> users.firebaseUid
```

---

## 🚀 **DEPLOYMENT & SCALING NOTES**

### **Current Status**
- **Environment**: Development (localhost MongoDB)
- **Database**: Single instance
- **Backup**: Manual/not configured
- **Monitoring**: Basic console logging

### **Production Recommendations**
1. **MongoDB Atlas**: Migrate to cloud cluster
2. **Replica Sets**: Enable high availability  
3. **Sharding**: Consider for large datasets
4. **Backup**: Automated daily backups
5. **Monitoring**: MongoDB Compass/Atlas monitoring
6. **Indexes**: Optimize based on query patterns
7. **Security**: Enable authentication, SSL, IP whitelist

### **Scaling Strategy**
- **Read Replicas**: For read-heavy workloads
- **Horizontal Partitioning**: Separate by academic year/subject
- **Caching**: Redis for frequently accessed content
- **CDN**: For static files and thumbnails
- **Archive Strategy**: Move old content to cold storage

---

## 📈 **FUTURE ENHANCEMENTS**

### **Planned Collections**
1. **Quizzes**: Assessment and testing system
2. **Analytics**: User behavior tracking
3. **Bookmarks**: Content bookmarking system  
4. **Comments**: Content discussion system
5. **Playlists**: Custom content collections
6. **Subscriptions**: Premium features
7. **Notifications**: User notification system

### **Advanced Features**
1. **Full-text Search**: Elasticsearch integration
2. **Recommendation Engine**: ML-powered content suggestions
3. **Real-time Collaboration**: Live document editing
4. **Version Control**: Content versioning system
5. **API Rate Limiting**: Usage tracking and limits
6. **Advanced Analytics**: Learning progress insights

---

## 💖 **LIKED VIDEOS COLLECTION**

### **Schema Structure**
```javascript
const LikedVideoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  likedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Indexes
LikedVideoSchema.index({ userId: 1 });
LikedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });
```

### **Sample Documents**

#### **Sample 1: User Liked React Tutorial**
```json
{
  "_id": "673456789012345678901301",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "68ff4faac1b10ddf9abfe20d",
  "likedAt": "2025-11-13T09:15:30.000Z"
}
```

#### **Sample 2: User Liked Python Course**
```json
{
  "_id": "673456789012345678901302",
  "userId": "676d9d6633a5e44ddef57dc3",
  "videoId": "68ff4faac1b10ddf9abfe20e",
  "likedAt": "2025-11-12T14:22:45.000Z"
}
```

#### **Sample 3: User Liked Database Design**
```json
{
  "_id": "673456789012345678901303",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "69071f14e03e16e0a55939a7",
  "likedAt": "2025-11-11T16:08:12.000Z"
}
```

### **Analytics**
- **Purpose**: Track user video preferences and engagement
- **Relationships**: User -> Videos many-to-many mapping
- **Indexes**: Optimized for user queries and duplicate prevention

---

## 💾 **SAVED VIDEOS COLLECTION**

### **Schema Structure**
```javascript
const SavedVideoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  savedAt: { type: Date, default: Date.now },
  folder: { type: String, default: 'default', trim: true },
  notes: { type: String, maxlength: 500 }
}, {
  timestamps: false
});

// Indexes
SavedVideoSchema.index({ userId: 1, savedAt: -1 });
SavedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });
```

### **Sample Documents**

#### **Sample 1: Saved for Later Viewing**
```json
{
  "_id": "673456789012345678901401",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "68ff4faac1b10ddf9abfe20d",
  "savedAt": "2025-11-13T09:20:15.000Z",
  "folder": "Database Learning",
  "notes": "Watch for final exam preparation"
}
```

#### **Sample 2: Saved Tutorial Collection**
```json
{
  "_id": "673456789012345678901402",
  "userId": "676d9d6633a5e44ddef57dc3",
  "videoId": "68ff4faac1b10ddf9abfe20e",
  "savedAt": "2025-11-12T15:30:22.000Z",
  "folder": "Git & Version Control",
  "notes": "Reference for team project"
}
```

#### **Sample 3: Quick Save**
```json
{
  "_id": "673456789012345678901403",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "69071f14e03e16e0a55939a7",
  "savedAt": "2025-11-11T17:45:33.000Z",
  "folder": "default",
  "notes": ""
}
```

### **Analytics**
- **Purpose**: Bookmark videos for later viewing and organization
- **Features**: Folder organization, personal notes, timestamp tracking

---

## 📈 **WATCH HISTORY COLLECTION**

### **Schema Structure**
```javascript
const WatchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: { type: Date, default: Date.now },
  progressSec: { type: Number, default: 0, min: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Indexes
WatchHistorySchema.index({ userId: 1, watchedAt: -1 });
WatchHistorySchema.index({ videoId: 1 });
WatchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true });
```

### **Sample Documents**

#### **Sample 1: Partially Watched Video**
```json
{
  "_id": "673456789012345678901501",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "68ff4faac1b10ddf9abfe20d",
  "watchedAt": "2025-11-13T10:30:00.000Z",
  "progressSec": 7260,
  "lastUpdated": "2025-11-13T11:15:30.000Z"
}
```

#### **Sample 2: Completed Video**
```json
{
  "_id": "673456789012345678901502",
  "userId": "676d9d6633a5e44ddef57dc3",
  "videoId": "68ff4faac1b10ddf9abfe20e",
  "watchedAt": "2025-11-12T16:00:00.000Z",
  "progressSec": 7200,
  "lastUpdated": "2025-11-12T18:00:00.000Z"
}
```

#### **Sample 3: Recently Started**
```json
{
  "_id": "673456789012345678901503",
  "userId": "68ffb16c997866b5ec3d2435",
  "videoId": "69071f14e03e16e0a55939a7",
  "watchedAt": "2025-11-11T20:00:00.000Z",
  "progressSec": 450,
  "lastUpdated": "2025-11-11T20:07:30.000Z"
}
```

### **Analytics**
- **Purpose**: Track viewing progress and resume functionality
- **Features**: Progress tracking, resume from last position, viewing patterns

---

## 📚 **STUDY SESSIONS COLLECTION**

### **Schema Structure**
```javascript
const StudySessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dailyPlanId: { type: Schema.Types.ObjectId, ref: 'DailyPlan' },
  startAt: { type: Date, required: true, default: Date.now },
  endAt: { type: Date },
  actualMinutes: { type: Number, min: 0 },
  pulseIntervals: [{ type: Number, min: 0 }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, {
  timestamps: true
});

// Indexes
StudySessionSchema.index({ userId: 1, startAt: -1 });
StudySessionSchema.index({ status: 1, endAt: 1 }, { expireAfterSeconds: 0 });
```

### **Sample Documents**

#### **Sample 1: Active Study Session**
```json
{
  "_id": "673456789012345678901601",
  "userId": "68ffb16c997866b5ec3d2435",
  "dailyPlanId": "673456789012345678901701",
  "startAt": "2025-11-13T09:00:00.000Z",
  "endAt": null,
  "actualMinutes": null,
  "pulseIntervals": [15, 30, 45],
  "status": "open",
  "createdAt": "2025-11-13T09:00:00.000Z",
  "updatedAt": "2025-11-13T09:45:00.000Z"
}
```

#### **Sample 2: Completed Study Session**
```json
{
  "_id": "673456789012345678901602",
  "userId": "676d9d6633a5e44ddef57dc3",
  "dailyPlanId": "673456789012345678901702",
  "startAt": "2025-11-12T14:00:00.000Z",
  "endAt": "2025-11-12T16:30:00.000Z",
  "actualMinutes": 150,
  "pulseIntervals": [20, 40, 60, 80, 100, 120, 140],
  "status": "closed",
  "createdAt": "2025-11-12T14:00:00.000Z",
  "updatedAt": "2025-11-12T16:30:00.000Z"
}
```

#### **Sample 3: Short Study Break**
```json
{
  "_id": "673456789012345678901603",
  "userId": "68ffb16c997866b5ec3d2435",
  "dailyPlanId": null,
  "startAt": "2025-11-11T18:00:00.000Z",
  "endAt": "2025-11-11T18:25:00.000Z",
  "actualMinutes": 25,
  "pulseIntervals": [10, 20],
  "status": "closed",
  "createdAt": "2025-11-11T18:00:00.000Z",
  "updatedAt": "2025-11-11T18:25:00.000Z"
}
```

### **Analytics**
- **Purpose**: Track study time and productivity patterns
- **Features**: Pomodoro-style intervals, daily plan integration, time tracking

---

## 📅 **DAILY PLANS COLLECTION**

### **Schema Structure**
```javascript
const DailyPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  goalMinutes: { type: Number, required: true, min: 1, max: 1440 },
  tasks: [{
    taskId: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    estMinutes: { type: Number, required: true, min: 1 },
    done: { type: Boolean, default: false },
    resourceRef: { type: Schema.Types.ObjectId, refPath: 'tasks.resourceModel' },
    resourceModel: { type: String, enum: ['Video', 'PDF', 'Quiz'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes
DailyPlanSchema.index({ userId: 1, date: -1 }, { unique: true });
DailyPlanSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
```

### **Sample Documents**

#### **Sample 1: Computer Science Study Plan**
```json
{
  "_id": "673456789012345678901701",
  "userId": "68ffb16c997866b5ec3d2435",
  "date": "2025-11-13T00:00:00.000Z",
  "goalMinutes": 180,
  "tasks": [
    {
      "taskId": "673456789012345678901711",
      "title": "Watch SQL Database Design Tutorial",
      "estMinutes": 60,
      "done": true,
      "resourceRef": "68ff4faac1b10ddf9abfe20d",
      "resourceModel": "Video"
    },
    {
      "taskId": "673456789012345678901712",
      "title": "Review AFLL Notes - Regular Expressions",
      "estMinutes": 45,
      "done": false,
      "resourceRef": "69006719b0f7257714c9803d",
      "resourceModel": "PDF"
    },
    {
      "taskId": "673456789012345678901713",
      "title": "Complete Database Quiz",
      "estMinutes": 75,
      "done": false,
      "resourceRef": null,
      "resourceModel": "Quiz"
    }
  ],
  "createdAt": "2025-11-13T06:00:00.000Z"
}
```

#### **Sample 2: Light Study Day**
```json
{
  "_id": "673456789012345678901702",
  "userId": "676d9d6633a5e44ddef57dc3",
  "date": "2025-11-12T00:00:00.000Z",
  "goalMinutes": 90,
  "tasks": [
    {
      "taskId": "673456789012345678901721",
      "title": "Git Version Control Overview",
      "estMinutes": 45,
      "done": true,
      "resourceRef": "68ff4faac1b10ddf9abfe20e",
      "resourceModel": "Video"
    },
    {
      "taskId": "673456789012345678901722",
      "title": "Practice Git Commands",
      "estMinutes": 45,
      "done": true,
      "resourceRef": null,
      "resourceModel": null
    }
  ],
  "createdAt": "2025-11-12T07:30:00.000Z"
}
```

#### **Sample 3: Intensive Study Plan**
```json
{
  "_id": "673456789012345678901703",
  "userId": "68ffb16c997866b5ec3d2435",
  "date": "2025-11-11T00:00:00.000Z",
  "goalMinutes": 240,
  "tasks": [
    {
      "taskId": "673456789012345678901731",
      "title": "IoT Fundamentals",
      "estMinutes": 60,
      "done": true,
      "resourceRef": "69071f14e03e16e0a55939a7",
      "resourceModel": "Video"
    },
    {
      "taskId": "673456789012345678901732",
      "title": "DFA Theory Study",
      "estMinutes": 90,
      "done": true,
      "resourceRef": "69006719b0f7257714c98033",
      "resourceModel": "PDF"
    },
    {
      "taskId": "673456789012345678901733",
      "title": "Algorithm Practice",
      "estMinutes": 90,
      "done": false,
      "resourceRef": null,
      "resourceModel": null
    }
  ],
  "createdAt": "2025-11-11T08:00:00.000Z"
}
```

### **Analytics**
- **Purpose**: Daily study planning and goal tracking
- **Features**: Task management, resource linking, progress tracking, goal setting

---

## 📊 **QUIZZES COLLECTION**

### **Schema Structure**
```javascript
const QuizSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  duration: { type: Number, required: true, min: 300, max: 7200 },
  questions: [{
    id: { type: String, required: true },
    question: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, enum: ['multiple-choice', 'single-choice', 'true-false', 'numerical', 'essay'], required: true },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String, required: true, trim: true, maxlength: 500 },
    marks: { type: Number, required: true, min: 1, max: 100 },
    timeLimit: { type: Number, required: true, min: 30, max: 1800 }
  }],
  totalMarks: { type: Number, required: true, min: 1 },
  passingMarks: { type: Number, required: true, min: 1 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
QuizSchema.index({ subject: 1, difficulty: 1 });
QuizSchema.index({ title: 'text', description: 'text' });
QuizSchema.index({ createdBy: 1 });
```

### **Sample Documents**

#### **Sample 1: Database Management Quiz**
```json
{
  "_id": "673456789012345678901801",
  "title": "Database Normalization and Design Principles",
  "description": "Comprehensive quiz covering 1NF, 2NF, 3NF, BCNF, and database design best practices",
  "subject": "Database Management Systems",
  "difficulty": "medium",
  "duration": 2700,
  "questions": [
    {
      "id": "q1",
      "question": "Which normal form eliminates partial functional dependencies?",
      "type": "single-choice",
      "options": ["1NF", "2NF", "3NF", "BCNF"],
      "correctAnswer": "2NF",
      "explanation": "Second Normal Form (2NF) eliminates partial functional dependencies by ensuring all non-key attributes are fully functionally dependent on the primary key.",
      "marks": 10,
      "timeLimit": 120,
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "question": "Define BCNF and explain when a relation is in BCNF.",
      "type": "essay",
      "options": [],
      "correctAnswer": "BCNF requires that for every functional dependency X → Y, X must be a superkey",
      "explanation": "Boyce-Codd Normal Form is stricter than 3NF and eliminates certain anomalies that 3NF cannot handle.",
      "marks": 20,
      "timeLimit": 600,
      "difficulty": "hard"
    }
  ],
  "totalMarks": 100,
  "passingMarks": 60,
  "createdBy": "68ffb16c997866b5ec3d2435",
  "isPublished": true,
  "tags": ["database", "normalization", "DBMS", "design"],
  "createdAt": "2025-11-10T14:00:00.000Z",
  "updatedAt": "2025-11-11T09:30:00.000Z"
}
```

#### **Sample 2: AFLL Theory Quiz**
```json
{
  "_id": "673456789012345678901802",
  "title": "Finite Automata and Regular Languages",
  "description": "Test your understanding of DFA, NFA, regular expressions, and state elimination algorithms",
  "subject": "Automata & Formal Language Theory",
  "difficulty": "hard",
  "duration": 3600,
  "questions": [
    {
      "id": "q1",
      "question": "A DFA that accepts strings ending with 'ab' over alphabet {a,b} requires minimum how many states?",
      "type": "numerical",
      "options": [],
      "correctAnswer": 3,
      "explanation": "Minimum 3 states needed: initial state, state after reading 'a', and accepting state after reading 'ab'.",
      "marks": 15,
      "timeLimit": 180,
      "difficulty": "medium"
    }
  ],
  "totalMarks": 150,
  "passingMarks": 90,
  "createdBy": "676d9d6633a5e44ddef57dc3",
  "isPublished": true,
  "tags": ["automata", "DFA", "NFA", "regular-expressions"],
  "createdAt": "2025-11-08T16:00:00.000Z",
  "updatedAt": "2025-11-09T11:15:00.000Z"
}
```

#### **Sample 3: Programming Fundamentals Quiz**
```json
{
  "_id": "673456789012345678901803",
  "title": "Data Structures and Algorithms Basics",
  "description": "Beginner-friendly quiz covering arrays, linked lists, stacks, and queues",
  "subject": "Data Structures & Algorithms",
  "difficulty": "easy",
  "duration": 1800,
  "questions": [
    {
      "id": "q1",
      "question": "Which data structure follows LIFO principle?",
      "type": "single-choice",
      "options": ["Queue", "Stack", "Array", "Linked List"],
      "correctAnswer": "Stack",
      "explanation": "Stack follows Last In First Out (LIFO) principle where the last element added is the first to be removed.",
      "marks": 5,
      "timeLimit": 60,
      "difficulty": "easy"
    },
    {
      "id": "q2",
      "question": "Linked lists allow dynamic memory allocation.",
      "type": "true-false",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "Linked lists allocate memory dynamically at runtime, unlike arrays which have fixed size.",
      "marks": 5,
      "timeLimit": 45,
      "difficulty": "easy"
    }
  ],
  "totalMarks": 50,
  "passingMarks": 30,
  "createdBy": "68ffb16c997866b5ec3d2435",
  "isPublished": false,
  "tags": ["data-structures", "algorithms", "basics"],
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:00:00.000Z"
}
```

### **Analytics**
- **Purpose**: Assessment and knowledge evaluation system
- **Features**: Multiple question types, timing controls, automatic grading, detailed explanations

---

## 🗂️ **ROADMAPS COLLECTION**

### **Schema Structure**
```javascript
const RoadmapSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  milestones: [{
    mileId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, maxlength: 500 },
    subLessons: { type: Number, required: true, min: 0 },
    finished: { type: Number, default: 0, min: 0 },
    resources: [{
      type: { type: String, required: true, enum: ['video', 'pdf', 'quiz', 'article', 'practice'] },
      id: { type: String, required: true },
      title: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }]
  }],
  aiGenerated: { type: Boolean, default: false },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  estimatedHours: { type: Number, min: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
RoadmapSchema.index({ userId: 1, createdAt: -1 });
RoadmapSchema.index({ title: 'text' });
```

### **Sample Documents**

#### **Sample 1: Full-Stack Development Roadmap**
```json
{
  "_id": "673456789012345678901901",
  "userId": "68ffb16c997866b5ec3d2435",
  "title": "Complete Full-Stack Web Development Journey",
  "milestones": [
    {
      "mileId": "frontend-basics",
      "name": "Frontend Foundations",
      "description": "Master HTML, CSS, and JavaScript fundamentals",
      "subLessons": 15,
      "finished": 8,
      "resources": [
        {
          "type": "video",
          "id": "68ff4faac1b10ddf9abfe20d",
          "title": "HTML5 Semantic Elements",
          "completed": true
        },
        {
          "type": "video", 
          "id": "68ff4faac1b10ddf9abfe20e",
          "title": "CSS Grid and Flexbox",
          "completed": true
        },
        {
          "type": "practice",
          "id": "frontend-project-1",
          "title": "Build a Personal Portfolio",
          "completed": false
        }
      ]
    },
    {
      "mileId": "backend-fundamentals",
      "name": "Backend Development",
      "description": "Learn Node.js, Express, and database integration",
      "subLessons": 20,
      "finished": 0,
      "resources": [
        {
          "type": "video",
          "id": "69071f14e03e16e0a55939a7",
          "title": "Node.js Fundamentals",
          "completed": false
        },
        {
          "type": "pdf",
          "id": "69006719b0f7257714c98019",
          "title": "REST API Design Patterns",
          "completed": false
        }
      ]
    }
  ],
  "aiGenerated": true,
  "difficulty": "intermediate",
  "estimatedHours": 120,
  "createdAt": "2025-11-10T09:00:00.000Z",
  "updatedAt": "2025-11-13T14:30:00.000Z"
}
```

#### **Sample 2: Data Science Learning Path**
```json
{
  "_id": "673456789012345678901902",
  "userId": "676d9d6633a5e44ddef57dc3",
  "title": "Data Science Mastery Roadmap",
  "milestones": [
    {
      "mileId": "python-fundamentals",
      "name": "Python Programming",
      "description": "Master Python syntax, data structures, and OOP concepts",
      "subLessons": 12,
      "finished": 12,
      "resources": [
        {
          "type": "video",
          "id": "python-basics-series",
          "title": "Python Fundamentals Course",
          "completed": true
        },
        {
          "type": "quiz",
          "id": "673456789012345678901803",
          "title": "Python Syntax Quiz",
          "completed": true
        }
      ]
    },
    {
      "mileId": "data-analysis",
      "name": "Data Analysis with Pandas",
      "description": "Learn data manipulation, cleaning, and analysis",
      "subLessons": 18,
      "finished": 5,
      "resources": [
        {
          "type": "video",
          "id": "pandas-tutorial-series",
          "title": "Pandas Complete Guide",
          "completed": false
        }
      ]
    }
  ],
  "aiGenerated": false,
  "difficulty": "beginner",
  "estimatedHours": 80,
  "createdAt": "2025-11-08T11:00:00.000Z",
  "updatedAt": "2025-11-12T16:45:00.000Z"
}
```

#### **Sample 3: Quick Algorithm Review**
```json
{
  "_id": "673456789012345678901903",
  "userId": "68ffb16c997866b5ec3d2435",
  "title": "Algorithm Interview Preparation",
  "milestones": [
    {
      "mileId": "sorting-algorithms",
      "name": "Sorting Algorithms",
      "description": "Master bubble, merge, quick, and heap sort",
      "subLessons": 8,
      "finished": 3,
      "resources": [
        {
          "type": "video",
          "id": "sorting-algorithms-video",
          "title": "Sorting Algorithms Explained",
          "completed": true
        },
        {
          "type": "practice",
          "id": "sorting-practice",
          "title": "Implement Quick Sort",
          "completed": false
        }
      ]
    },
    {
      "mileId": "graph-algorithms",
      "name": "Graph Algorithms",
      "description": "BFS, DFS, Dijkstra, and more",
      "subLessons": 10,
      "finished": 0,
      "resources": [
        {
          "type": "pdf",
          "id": "69006719b0f7257714c98033",
          "title": "Graph Theory Fundamentals",
          "completed": false
        }
      ]
    }
  ],
  "aiGenerated": true,
  "difficulty": "advanced",
  "estimatedHours": 25,
  "createdAt": "2025-11-12T20:00:00.000Z",
  "updatedAt": "2025-11-13T08:15:00.000Z"
}
```

### **Analytics**
- **Purpose**: Personalized learning path management and progress tracking
- **Features**: AI-generated paths, milestone tracking, resource integration, progress visualization

---

## 🏆 **STREAKS COLLECTION**

### **Schema Structure**
```javascript
const StreakSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0, min: 0 },
  longestStreak: { type: Number, default: 0, min: 0 },
  lastActivityDate: { type: Date },
  streakData: [{
    date: { type: Date, required: true },
    studyMinutes: { type: Number, required: true, min: 1 },
    activitiesCompleted: { type: Number, default: 1, min: 1 }
  }],
  weeklyGoal: { type: Number, default: 300, min: 30 }, // minutes per week
  streakGoal: { type: Number, default: 7, min: 1 }, // target streak days
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
StreakSchema.index({ userId: 1 }, { unique: true });
StreakSchema.index({ currentStreak: -1 });
```

### **Sample Documents**

#### **Sample 1: Active Streak User**
```json
{
  "_id": "673456789012345678902001",
  "userId": "68ffb16c997866b5ec3d2435",
  "currentStreak": 12,
  "longestStreak": 25,
  "lastActivityDate": "2025-11-13T00:00:00.000Z",
  "streakData": [
    {
      "date": "2025-11-13T00:00:00.000Z",
      "studyMinutes": 120,
      "activitiesCompleted": 3
    },
    {
      "date": "2025-11-12T00:00:00.000Z", 
      "studyMinutes": 90,
      "activitiesCompleted": 2
    },
    {
      "date": "2025-11-11T00:00:00.000Z",
      "studyMinutes": 180,
      "activitiesCompleted": 4
    }
  ],
  "weeklyGoal": 420,
  "streakGoal": 14,
  "createdAt": "2025-10-15T10:00:00.000Z",
  "updatedAt": "2025-11-13T23:59:59.000Z"
}
```

#### **Sample 2: Beginner Streak**
```json
{
  "_id": "673456789012345678902002",
  "userId": "676d9d6633a5e44ddef57dc3",
  "currentStreak": 3,
  "longestStreak": 5,
  "lastActivityDate": "2025-11-13T00:00:00.000Z",
  "streakData": [
    {
      "date": "2025-11-13T00:00:00.000Z",
      "studyMinutes": 45,
      "activitiesCompleted": 1
    },
    {
      "date": "2025-11-12T00:00:00.000Z",
      "studyMinutes": 60,
      "activitiesCompleted": 2
    },
    {
      "date": "2025-11-11T00:00:00.000Z",
      "studyMinutes": 30,
      "activitiesCompleted": 1
    }
  ],
  "weeklyGoal": 210,
  "streakGoal": 7,
  "createdAt": "2025-11-01T08:00:00.000Z",
  "updatedAt": "2025-11-13T20:30:00.000Z"
}
```

#### **Sample 3: Reset Streak**
```json
{
  "_id": "673456789012345678902003",
  "userId": "671f3b8c2a5f123456789def",
  "currentStreak": 1,
  "longestStreak": 15,
  "lastActivityDate": "2025-11-13T00:00:00.000Z",
  "streakData": [
    {
      "date": "2025-11-13T00:00:00.000Z",
      "studyMinutes": 75,
      "activitiesCompleted": 2
    }
  ],
  "weeklyGoal": 300,
  "streakGoal": 10,
  "createdAt": "2025-09-20T12:00:00.000Z",
  "updatedAt": "2025-11-13T19:45:00.000Z"
}
```

### **Analytics**
- **Purpose**: Gamification and motivation through streak tracking
- **Features**: Daily activity tracking, goal setting, progress visualization, achievement milestones

---

## 🎯 **HIGHLIGHTS COLLECTION**

### **Schema Structure**
```javascript
const HighlightSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  resourceType: { type: String, enum: ['PDF', 'Video', 'Note'], required: true },
  pageNumber: { type: Number }, // For PDFs
  timestamp: { type: Number }, // For Videos (seconds)
  highlightText: { type: String, required: true, maxlength: 1000 },
  color: { type: String, enum: ['yellow', 'green', 'blue', 'pink', 'orange'], default: 'yellow' },
  note: { type: String, maxlength: 500 },
  position: {
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
HighlightSchema.index({ userId: 1, resourceId: 1 });
HighlightSchema.index({ resourceType: 1 });
HighlightSchema.index({ createdAt: -1 });
```

### **Sample Documents**

#### **Sample 1: PDF Text Highlight**
```json
{
  "_id": "673456789012345678902101",
  "userId": "68ffb16c997866b5ec3d2435",
  "resourceId": "69006719b0f7257714c98019",
  "resourceType": "PDF",
  "pageNumber": 23,
  "timestamp": null,
  "highlightText": "A set is a collection of distinct objects, considered as an object in its own right",
  "color": "yellow",
  "note": "Fundamental definition of sets - important for exam",
  "position": {
    "x": 120,
    "y": 340,
    "width": 280,
    "height": 18
  },
  "createdAt": "2025-11-13T10:15:00.000Z",
  "updatedAt": "2025-11-13T10:15:00.000Z"
}
```

#### **Sample 2: Video Timestamp Highlight**
```json
{
  "_id": "673456789012345678902102",
  "userId": "676d9d6633a5e44ddef57dc3",
  "resourceId": "68ff4faac1b10ddf9abfe20d",
  "resourceType": "Video",
  "pageNumber": null,
  "timestamp": 1820,
  "highlightText": "Third Normal Form eliminates transitive functional dependencies",
  "color": "green",
  "note": "Key concept for database normalization - practice with examples",
  "position": null,
  "createdAt": "2025-11-12T16:30:20.000Z",
  "updatedAt": "2025-11-12T16:30:20.000Z"
}
```

#### **Sample 3: Note Highlight**
```json
{
  "_id": "673456789012345678902103",
  "userId": "68ffb16c997866b5ec3d2435",
  "resourceId": "69006e93de69cbe946e49571",
  "resourceType": "Note",
  "pageNumber": null,
  "timestamp": null,
  "highlightText": "Regular expressions are equivalent to finite automata",
  "color": "blue",
  "note": "This equivalence is crucial for AFLL theory questions",
  "position": null,
  "createdAt": "2025-11-11T14:45:30.000Z",
  "updatedAt": "2025-11-11T14:45:30.000Z"
}
```

### **Analytics**
- **Purpose**: Interactive content annotation and key concept tracking
- **Features**: Multi-format highlighting, color coding, position tracking, personal notes

---

## 🚪 **ROOMS COLLECTION**

### **Schema Structure**
```javascript
const RoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['host', 'moderator', 'participant'], default: 'participant' },
    isActive: { type: Boolean, default: true }
  }],
  roomType: { type: String, enum: ['study', 'meeting', 'tutoring'], default: 'study' },
  isPrivate: { type: Boolean, default: false },
  password: { type: String, minlength: 4, maxlength: 20 },
  maxParticipants: { type: Number, default: 10, min: 2, max: 50 },
  status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting' },
  settings: {
    allowChat: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: false },
    allowFileShare: { type: Boolean, default: true },
    autoRecord: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
RoomSchema.index({ roomId: 1 }, { unique: true });
RoomSchema.index({ hostId: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ roomType: 1 });
```

### **Sample Documents**

#### **Sample 1: Active Study Room**
```json
{
  "_id": "673456789012345678902201",
  "roomId": "study-room-db-2025",
  "name": "Database Concepts Study Group",
  "description": "Weekly study group for database management and SQL practice",
  "hostId": "68ffb16c997866b5ec3d2435",
  "participants": [
    {
      "userId": "68ffb16c997866b5ec3d2435",
      "joinedAt": "2025-11-13T15:00:00.000Z",
      "role": "host",
      "isActive": true
    },
    {
      "userId": "676d9d6633a5e44ddef57dc3",
      "joinedAt": "2025-11-13T15:05:00.000Z", 
      "role": "participant",
      "isActive": true
    },
    {
      "userId": "671f3b8c2a5f123456789def",
      "joinedAt": "2025-11-13T15:08:00.000Z",
      "role": "participant",
      "isActive": true
    }
  ],
  "roomType": "study",
  "isPrivate": true,
  "password": "dbstudy123",
  "maxParticipants": 8,
  "status": "active",
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "allowFileShare": true,
    "autoRecord": false
  },
  "createdAt": "2025-11-13T14:45:00.000Z",
  "updatedAt": "2025-11-13T15:08:00.000Z"
}
```

#### **Sample 2: Tutoring Session**
```json
{
  "_id": "673456789012345678902202",
  "roomId": "tutor-afll-advanced",
  "name": "AFLL Advanced Concepts Tutoring",
  "description": "One-on-one tutoring for automata theory and formal languages",
  "hostId": "676d9d6633a5e44ddef57dc3",
  "participants": [
    {
      "userId": "676d9d6633a5e44ddef57dc3",
      "joinedAt": "2025-11-12T18:00:00.000Z",
      "role": "host",
      "isActive": false
    },
    {
      "userId": "671f3b8c2a5f123456789def",
      "joinedAt": "2025-11-12T18:02:00.000Z",
      "role": "participant", 
      "isActive": false
    }
  ],
  "roomType": "tutoring",
  "isPrivate": true,
  "password": "afll2025",
  "maxParticipants": 2,
  "status": "closed",
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "allowFileShare": true,
    "autoRecord": true
  },
  "createdAt": "2025-11-12T17:55:00.000Z",
  "updatedAt": "2025-11-12T19:30:00.000Z"
}
```

#### **Sample 3: Public Meeting Room**
```json
{
  "_id": "673456789012345678902203",
  "roomId": "open-tech-meetup",
  "name": "Weekly Tech Discussion",
  "description": "Open discussion about latest technology trends and programming topics",
  "hostId": "68ffb16c997866b5ec3d2435",
  "participants": [],
  "roomType": "meeting",
  "isPrivate": false,
  "password": null,
  "maxParticipants": 25,
  "status": "waiting",
  "settings": {
    "allowChat": true,
    "allowScreenShare": false,
    "allowFileShare": false,
    "autoRecord": false
  },
  "createdAt": "2025-11-14T10:00:00.000Z",
  "updatedAt": "2025-11-14T10:00:00.000Z"
}
```

### **Analytics**
- **Purpose**: Virtual study rooms and collaboration spaces
- **Features**: Room management, participant control, privacy settings, multi-format support

---

## 💬 **COMMENTS COLLECTION**

### **Schema Structure**
```javascript
const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  resourceType: { type: String, enum: ['Video', 'PDF', 'Quiz', 'Note'], required: true },
  content: { type: String, required: true, maxlength: 1000 },
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' }, // For replies
  timestamp: { type: Number }, // For video comments (seconds)
  pageNumber: { type: Number }, // For PDF comments
  likes: { type: Number, default: 0, min: 0 },
  dislikes: { type: Number, default: 0, min: 0 },
  isEdited: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
CommentSchema.index({ resourceId: 1, resourceType: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ createdAt: -1 });
```

### **Sample Documents**

#### **Sample 1: Video Comment with Timestamp**
```json
{
  "_id": "673456789012345678902301",
  "userId": "68ffb16c997866b5ec3d2435",
  "resourceId": "68ff4faac1b10ddf9abfe20d",
  "resourceType": "Video",
  "content": "Great explanation of 3NF! The example with the employee table really helped clarify the concept. Could you do a similar example for BCNF?",
  "parentCommentId": null,
  "timestamp": 1245,
  "pageNumber": null,
  "likes": 5,
  "dislikes": 0,
  "isEdited": false,
  "isPublic": true,
  "createdAt": "2025-11-13T11:20:15.000Z",
  "updatedAt": "2025-11-13T11:20:15.000Z"
}
```

#### **Sample 2: Reply Comment**
```json
{
  "_id": "673456789012345678902302",
  "userId": "676d9d6633a5e44ddef57dc3",
  "resourceId": "68ff4faac1b10ddf9abfe20d",
  "resourceType": "Video",
  "content": "I agree! BCNF examples would be really helpful. Also, what's the difference between 3NF and BCNF in practical scenarios?",
  "parentCommentId": "673456789012345678902301",
  "timestamp": 1245,
  "pageNumber": null,
  "likes": 2,
  "dislikes": 0,
  "isEdited": false,
  "isPublic": true,
  "createdAt": "2025-11-13T12:45:30.000Z",
  "updatedAt": "2025-11-13T12:45:30.000Z"
}
```

#### **Sample 3: PDF Page Comment**
```json
{
  "_id": "673456789012345678902303",
  "userId": "671f3b8c2a5f123456789def",
  "resourceId": "69006719b0f7257714c98019",
  "resourceType": "PDF",
  "content": "The notation on this page is confusing. Could someone explain what the ∪ symbol represents in this context?",
  "parentCommentId": null,
  "timestamp": null,
  "pageNumber": 15,
  "likes": 1,
  "dislikes": 0,
  "isEdited": true,
  "isPublic": true,
  "createdAt": "2025-11-12T09:30:45.000Z",
  "updatedAt": "2025-11-12T09:35:22.000Z"
}
```

### **Analytics**
- **Purpose**: Community engagement and collaborative learning through discussions
- **Features**: Threaded comments, timestamp/page references, voting system, moderation

---

```

#### **Sample 3: PDF Page Comment**
```json
{
  "_id": "673456789012345678902303",
  "userId": "671f3b8c2a5f123456789def",
  "resourceId": "69006719b0f7257714c98019",
  "resourceType": "PDF",
  "content": "The notation on this page is confusing. Could someone explain what the ∪ symbol represents in this context?",
  "parentCommentId": null,
  "timestamp": null,
  "pageNumber": 15,
  "likes": 1,
  "dislikes": 0,
  "isEdited": true,
  "isPublic": true,
  "createdAt": "2025-11-12T09:30:45.000Z",
  "updatedAt": "2025-11-12T09:35:22.000Z"
}
```

### **Analytics**
- **Purpose**: Community engagement and collaborative learning through discussions
- **Features**: Threaded comments, timestamp/page references, voting system, moderation

---

## Additional Collections Documentation

### 22. Performance Insights Collection (`performanceinsights`)

**Purpose**: Stores AI-generated insights about user study performance and recommendations.

**Schema**:
```javascript
{
  userId: ObjectId (ref: User),
  roadmapId: ObjectId (ref: Roadmap),
  sessionId: ObjectId (ref: StudySession),
  insight: {
    headline: String (max: 100),
    summary: String (max: 300),
    tip: String (max: 200),
    emoji: String (default: '📊'),
    color: String (enum: ['blue', 'green', 'yellow', 'red', 'purple', 'orange'])
  },
  expiresAt: Date (default: 7 days),
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Study Performance Insight
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c2d"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "roadmapId": ObjectId("65a1b2c3d4e5f6789a0b1c1b"),
  "insight": {
    "headline": "Great Progress This Week! 🎉",
    "summary": "You've completed 85% of your weekly study goals and maintained a 7-day streak. Your focus on Data Structures is paying off with improved quiz scores.",
    "tip": "Try tackling more advanced problems to challenge yourself further.",
    "emoji": "🎉",
    "color": "green"
  },
  "expiresAt": ISODate("2024-01-13T10:00:00Z"),
  "createdAt": ISODate("2024-01-06T10:00:00Z"),
  "updatedAt": ISODate("2024-01-06T10:00:00Z")
}

// Example 2: Improvement Suggestion
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c2e"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "sessionId": ObjectId("65a1b2c3d4e5f6789a0b1c1c"),
  "insight": {
    "headline": "Focus Area Detected",
    "summary": "Your recent quiz results suggest you might benefit from reviewing binary tree traversal concepts before moving to advanced algorithms.",
    "tip": "Spend 15-20 minutes reviewing the fundamentals before your next session.",
    "emoji": "💡",
    "color": "yellow"
  },
  "expiresAt": ISODate("2024-01-13T15:30:00Z"),
  "createdAt": ISODate("2024-01-06T15:30:00Z"),
  "updatedAt": ISODate("2024-01-06T15:30:00Z")
}

// Example 3: Streak Motivation
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c2f"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1b"),
  "insight": {
    "headline": "Streak Alert!",
    "summary": "You're one day away from achieving your longest study streak ever! Keep the momentum going with a quick 30-minute session.",
    "tip": "Even a short review session will help maintain your streak.",
    "emoji": "🔥",
    "color": "orange"
  },
  "expiresAt": ISODate("2024-01-13T20:00:00Z"),
  "createdAt": ISODate("2024-01-06T20:00:00Z"),
  "updatedAt": ISODate("2024-01-06T20:00:00Z")
}
```

**Indexes**: userId, expiresAt (TTL), roadmapId, sessionId  
**Analytics**: 0 documents  

---

### 23. Top Tutorials Collection (`toptutorials`)

**Purpose**: Manages featured tutorials displayed on the platform's homepage slider.

**Schema**:
```javascript
{
  videoId: ObjectId (ref: Video, unique),
  sliderOrder: Number (min: 1),
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Featured Algorithm Tutorial
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c30"),
  "videoId": ObjectId("65a1b2c3d4e5f6789a0b1c15"),
  "sliderOrder": 1,
  "createdAt": ISODate("2024-01-06T08:00:00Z"),
  "updatedAt": ISODate("2024-01-06T08:00:00Z")
}

// Example 2: Popular Data Structure Video
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c31"),
  "videoId": ObjectId("65a1b2c3d4e5f6789a0b1c16"),
  "sliderOrder": 2,
  "createdAt": ISODate("2024-01-06T08:00:00Z"),
  "updatedAt": ISODate("2024-01-06T08:00:00Z")
}

// Example 3: Trending Programming Concept
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c32"),
  "videoId": ObjectId("65a1b2c3d4e5f6789a0b1c17"),
  "sliderOrder": 3,
  "createdAt": ISODate("2024-01-06T08:00:00Z"),
  "updatedAt": ISODate("2024-01-06T08:00:00Z")
}
```

**Indexes**: sliderOrder, videoId (unique)  
**Analytics**: 0 documents  

---

### 24. Topics Collection (`topics`)

**Purpose**: Manages subject categories and topics for organizing educational content.

**Schema**:
```javascript
{
  name: String (unique, required),
  iconUrl: String (required),
  displayOrder: Number (min: 0),
  isTopFive: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Data Structures Topic
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c33"),
  "name": "Data Structures",
  "iconUrl": "https://axiona-storage.s3.amazonaws.com/icons/data-structures.svg",
  "displayOrder": 1,
  "isTopFive": true,
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00Z")
}

// Example 2: Algorithms Topic
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c34"),
  "name": "Algorithms",
  "iconUrl": "https://axiona-storage.s3.amazonaws.com/icons/algorithms.svg",
  "displayOrder": 2,
  "isTopFive": true,
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00Z")
}

// Example 3: System Design Topic
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c35"),
  "name": "System Design",
  "iconUrl": "https://axiona-storage.s3.amazonaws.com/icons/system-design.svg",
  "displayOrder": 3,
  "isTopFive": true,
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00Z")
}
```

**Indexes**: name (unique), isTopFive + displayOrder, displayOrder  
**Analytics**: 0 documents  

---

### 25. Room Events Collection (`roomevents`)

**Purpose**: Tracks events in study rooms (user joins/leaves, screen sharing, etc.).

**Schema**:
```javascript
{
  room: ObjectId (ref: Room),
  user: ObjectId (ref: User),
  type: String (enum: ['user_joined', 'user_left', 'screenshare_start', 'screenshare_stop', 'mute', 'unmute', 'room_created', 'room_ended']),
  createdAt: Date,
  details: Mixed
}
```

**Example Documents**:
```javascript
// Example 1: User Joined Event
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c36"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "user": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "type": "user_joined",
  "createdAt": ISODate("2024-01-06T14:30:00Z"),
  "details": {
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "joinMethod": "invite_link"
  }
}

// Example 2: Screen Share Event
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c37"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "user": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "type": "screenshare_start",
  "createdAt": ISODate("2024-01-06T14:35:00Z"),
  "details": {
    "resolution": "1920x1080",
    "frameRate": 30
  }
}

// Example 3: Room Creation Event
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c38"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "user": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "type": "room_created",
  "createdAt": ISODate("2024-01-06T14:25:00Z"),
  "details": {
    "roomType": "study_session",
    "maxParticipants": 8
  }
}
```

**Indexes**: room + createdAt, user + createdAt, createdAt (TTL: 30 days)  
**Analytics**: 0 documents  

---

### 26. Room Messages Collection (`roommessages`)

**Purpose**: Stores chat messages in study rooms.

**Schema**:
```javascript
{
  room: ObjectId (ref: Room),
  sender: ObjectId (ref: User),
  content: String (max: 500),
  type: String (enum: ['text', 'image', 'file'], default: 'text'),
  createdAt: Date,
  edited: Boolean (default: false),
  editedAt: Date,
  replyTo: ObjectId (ref: RoomMessage)
}
```

**Example Documents**:
```javascript
// Example 1: Text Message
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c39"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "sender": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "content": "Hey everyone! Ready to tackle some algorithm problems together?",
  "type": "text",
  "createdAt": ISODate("2024-01-06T14:30:30Z"),
  "edited": false
}

// Example 2: Reply Message
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3a"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "sender": ObjectId("65a1b2c3d4e5f6789a0b1c1b"),
  "content": "Absolutely! I'm working on binary tree problems right now.",
  "type": "text",
  "createdAt": ISODate("2024-01-06T14:31:00Z"),
  "edited": false,
  "replyTo": ObjectId("65a1b2c3d4e5f6789a0b1c39")
}

// Example 3: File Share Message
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3b"),
  "room": ObjectId("65a1b2c3d4e5f6789a0b1c20"),
  "sender": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "content": "Here's my solution to the tree traversal problem",
  "type": "file",
  "createdAt": ISODate("2024-01-06T14:35:00Z"),
  "edited": false
}
```

**Indexes**: room + createdAt, createdAt (TTL: 30 days)  
**Analytics**: 0 documents  

---

### 27. Exports Collection (`exports`)

**Purpose**: Manages user data export requests and file downloads.

**Schema**:
```javascript
{
  userId: ObjectId (ref: User),
  fileName: String,
  status: String (enum: ['building', 'ready', 'failed']),
  fileSize: Number,
  downloadCount: Number (default: 0),
  expiresAt: Date (default: 1 day),
  errorMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Ready Export
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3c"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "fileName": "study_data_2024-01-06.zip",
  "status": "ready",
  "fileSize": 2048576,
  "downloadCount": 1,
  "expiresAt": ISODate("2024-01-07T10:00:00Z"),
  "createdAt": ISODate("2024-01-06T10:00:00Z"),
  "updatedAt": ISODate("2024-01-06T10:15:00Z")
}

// Example 2: Building Export
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3d"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1b"),
  "fileName": "notes_backup_2024-01-06.zip",
  "status": "building",
  "downloadCount": 0,
  "expiresAt": ISODate("2024-01-07T14:30:00Z"),
  "createdAt": ISODate("2024-01-06T14:30:00Z"),
  "updatedAt": ISODate("2024-01-06T14:30:00Z")
}

// Example 3: Failed Export
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3e"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "fileName": "large_data_export_2024-01-05.zip",
  "status": "failed",
  "downloadCount": 0,
  "expiresAt": ISODate("2024-01-06T08:00:00Z"),
  "errorMessage": "File size exceeded maximum limit",
  "createdAt": ISODate("2024-01-05T08:00:00Z"),
  "updatedAt": ISODate("2024-01-05T08:30:00Z")
}
```

**Indexes**: userId + createdAt, expiresAt (TTL)  
**Analytics**: 0 documents  

---

### 28. Messages Collection (`messages`)

**Purpose**: Stores chat messages for meeting rooms and general communication.

**Schema**:
```javascript
{
  messageId: String (unique),
  meetingId: String (ref: Meeting),
  roomId: String,
  userId: String, // Firebase UID
  userName: String,
  userEmail: String,
  content: {
    text: String (max: 2000),
    type: String (enum: ['text', 'emoji', 'file', 'system']),
    fileUrl: String,
    fileName: String,
    fileSize: Number
  },
  reactions: Array,
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  replyTo: Object,
  mentions: Array,
  isPrivate: Boolean,
  privateRecipients: Array,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Text Message
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c3f"),
  "messageId": "msg_65a1b2c3d4e5f6789a0b1c3f",
  "meetingId": "meeting_123",
  "roomId": "room_456",
  "userId": "firebase_uid_123",
  "userName": "Alex Smith",
  "userEmail": "alex.smith@example.com",
  "content": {
    "text": "Great explanation on the algorithm complexity! 👍",
    "type": "text"
  },
  "reactions": [
    {
      "userId": "firebase_uid_456",
      "userName": "Sarah Johnson",
      "emoji": "👍",
      "timestamp": ISODate("2024-01-06T15:31:00Z")
    }
  ],
  "isEdited": false,
  "isDeleted": false,
  "isPrivate": false,
  "timestamp": ISODate("2024-01-06T15:30:00Z"),
  "createdAt": ISODate("2024-01-06T15:30:00Z"),
  "updatedAt": ISODate("2024-01-06T15:31:00Z")
}

// Example 2: File Share Message
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c40"),
  "messageId": "msg_65a1b2c3d4e5f6789a0b1c40",
  "meetingId": "meeting_123",
  "roomId": "room_456",
  "userId": "firebase_uid_456",
  "userName": "Sarah Johnson",
  "userEmail": "sarah.johnson@example.com",
  "content": {
    "text": "Here's the code solution we discussed",
    "type": "file",
    "fileUrl": "https://storage.example.com/files/solution.py",
    "fileName": "binary_search_solution.py",
    "fileSize": 1024
  },
  "reactions": [],
  "isEdited": false,
  "isDeleted": false,
  "isPrivate": false,
  "timestamp": ISODate("2024-01-06T15:35:00Z"),
  "createdAt": ISODate("2024-01-06T15:35:00Z"),
  "updatedAt": ISODate("2024-01-06T15:35:00Z")
}

// Example 3: Private Message with Mentions
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c41"),
  "messageId": "msg_65a1b2c3d4e5f6789a0b1c41",
  "meetingId": "meeting_123",
  "roomId": "room_456",
  "userId": "firebase_uid_789",
  "userName": "Mike Chen",
  "userEmail": "mike.chen@example.com",
  "content": {
    "text": "@Alex Smith @Sarah Johnson Want to continue this discussion after the meeting?",
    "type": "text"
  },
  "reactions": [],
  "isEdited": false,
  "isDeleted": false,
  "isPrivate": true,
  "privateRecipients": ["firebase_uid_123", "firebase_uid_456"],
  "mentions": [
    {
      "userId": "firebase_uid_123",
      "userName": "Alex Smith"
    },
    {
      "userId": "firebase_uid_456",
      "userName": "Sarah Johnson"
    }
  ],
  "timestamp": ISODate("2024-01-06T16:00:00Z"),
  "createdAt": ISODate("2024-01-06T16:00:00Z"),
  "updatedAt": ISODate("2024-01-06T16:00:00Z")
}
```

**Indexes**: meetingId + timestamp, roomId + timestamp, userId + timestamp, mentions.userId  
**Analytics**: 0 documents  

---

### 29. AI Threads Collection (`aithreads`)

**Purpose**: Stores AI conversation threads for workspace sessions.

**Schema**:
```javascript
{
  sessionId: ObjectId (ref: WorkspaceSession, unique),
  messages: [{
    role: String (enum: ['user', 'assistant', 'system']),
    text: String (max: 4000),
    ts: Date,
    resourceRef: ObjectId
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Study Help Thread
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c42"),
  "sessionId": ObjectId("65a1b2c3d4e5f6789a0b1c25"),
  "messages": [
    {
      "role": "user",
      "text": "Can you explain how binary search works?",
      "ts": ISODate("2024-01-06T16:00:00Z")
    },
    {
      "role": "assistant",
      "text": "Binary search is an efficient algorithm for finding a specific element in a sorted array. It works by repeatedly dividing the search space in half...",
      "ts": ISODate("2024-01-06T16:00:15Z")
    },
    {
      "role": "user",
      "text": "What's the time complexity?",
      "ts": ISODate("2024-01-06T16:01:00Z")
    },
    {
      "role": "assistant",
      "text": "The time complexity of binary search is O(log n), where n is the number of elements in the array.",
      "ts": ISODate("2024-01-06T16:01:10Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T16:00:00Z"),
  "updatedAt": ISODate("2024-01-06T16:01:10Z")
}

// Example 2: PDF Analysis Thread
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c43"),
  "sessionId": ObjectId("65a1b2c3d4e5f6789a0b1c26"),
  "messages": [
    {
      "role": "user",
      "text": "Summarize the key points from page 15 of this algorithms textbook",
      "ts": ISODate("2024-01-06T16:30:00Z"),
      "resourceRef": ObjectId("65a1b2c3d4e5f6789a0b1c10")
    },
    {
      "role": "assistant",
      "text": "Based on page 15, the key points about sorting algorithms are: 1) Bubble sort has O(n²) complexity... 2) Quick sort averages O(n log n)...",
      "ts": ISODate("2024-01-06T16:30:30Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T16:30:00Z"),
  "updatedAt": ISODate("2024-01-06T16:30:30Z")
}

// Example 3: Quiz Help Thread
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c44"),
  "sessionId": ObjectId("65a1b2c3d4e5f6789a0b1c27"),
  "messages": [
    {
      "role": "user",
      "text": "I'm stuck on question 3 about graph traversal",
      "ts": ISODate("2024-01-06T17:00:00Z")
    },
    {
      "role": "assistant",
      "text": "Let me help you with graph traversal. There are two main approaches: DFS (Depth-First Search) and BFS (Breadth-First Search)...",
      "ts": ISODate("2024-01-06T17:00:20Z")
    },
    {
      "role": "user",
      "text": "When should I use DFS vs BFS?",
      "ts": ISODate("2024-01-06T17:01:00Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T17:00:00Z"),
  "updatedAt": ISODate("2024-01-06T17:01:00Z")
}
```

**Indexes**: sessionId (unique), messages.ts (TTL: 60 days)  
**Analytics**: 0 documents  

---

### 30. Workspace Sessions Collection (`workspacesessions`)

**Purpose**: Manages user workspace sessions for AI-assisted learning with various resources.

**Schema**:
```javascript
{
  userId: ObjectId (ref: User),
  resourceType: String (enum: ['video', 'pdf', 'quiz']),
  resourceId: ObjectId,
  resourceTitle: String,
  resourceUrl: String,
  pageNum: Number (default: 1, min: 1),
  videoTime: Number (default: 0, min: 0),
  status: String (enum: ['open', 'closed'], default: 'open'),
  openedAt: Date,
  closedAt: Date,
  aiThread: Array, // Embedded AI messages
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents**:
```javascript
// Example 1: Video Learning Session
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c45"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "resourceType": "video",
  "resourceId": ObjectId("65a1b2c3d4e5f6789a0b1c15"),
  "resourceTitle": "Binary Search Algorithm Explained",
  "resourceUrl": "https://axiona-videos.s3.amazonaws.com/binary-search.mp4",
  "videoTime": 420.5,
  "status": "open",
  "openedAt": ISODate("2024-01-06T16:00:00Z"),
  "aiThread": [
    {
      "role": "user",
      "text": "Can you explain the part at 6:30 about the midpoint calculation?",
      "ts": ISODate("2024-01-06T16:05:00Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T16:00:00Z"),
  "updatedAt": ISODate("2024-01-06T16:05:00Z")
}

// Example 2: PDF Study Session
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c46"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1b"),
  "resourceType": "pdf",
  "resourceId": ObjectId("65a1b2c3d4e5f6789a0b1c10"),
  "resourceTitle": "Data Structures and Algorithms Textbook",
  "resourceUrl": "https://axiona-pdfs.s3.amazonaws.com/dsa-textbook.pdf",
  "pageNum": 15,
  "status": "closed",
  "openedAt": ISODate("2024-01-06T14:00:00Z"),
  "closedAt": ISODate("2024-01-06T15:30:00Z"),
  "aiThread": [
    {
      "role": "user",
      "text": "Summarize the sorting algorithms on this page",
      "ts": ISODate("2024-01-06T14:15:00Z")
    },
    {
      "role": "assistant",
      "text": "The page covers three main sorting algorithms: Bubble Sort (O(n²)), Quick Sort (O(n log n) average), and Merge Sort (O(n log n) guaranteed).",
      "ts": ISODate("2024-01-06T14:15:30Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T14:00:00Z"),
  "updatedAt": ISODate("2024-01-06T15:30:00Z")
}

// Example 3: Quiz Practice Session
{
  "_id": ObjectId("65a1b2c3d4e5f6789a0b1c47"),
  "userId": ObjectId("65a1b2c3d4e5f6789a0b1c1a"),
  "resourceType": "quiz",
  "resourceId": ObjectId("65a1b2c3d4e5f6789a0b1c22"),
  "resourceTitle": "Graph Algorithms Quiz",
  "resourceUrl": "/quiz/graph-algorithms",
  "status": "open",
  "openedAt": ISODate("2024-01-06T17:00:00Z"),
  "aiThread": [
    {
      "role": "user",
      "text": "I need help with question 3 about DFS vs BFS",
      "ts": ISODate("2024-01-06T17:05:00Z")
    },
    {
      "role": "assistant",
      "text": "DFS explores as far as possible along each branch before backtracking, while BFS explores all neighbors at the current depth before moving to the next level.",
      "ts": ISODate("2024-01-06T17:05:30Z")
    }
  ],
  "createdAt": ISODate("2024-01-06T17:00:00Z"),
  "updatedAt": ISODate("2024-01-06T17:05:30Z")
}
```

**Indexes**: userId + status, resourceType + resourceId, openedAt, status  
**Analytics**: 0 documents  

---

## Database Statistics Summary

### Collection Count Analysis:
- **Video Content**: 94 videos, 12 PDFs, 331 study materials, 448 books
- **User Data**: 2 users, 13 notes, 8 meetings
- **File Storage**: 220 PDF files, 879 PDF chunks (GridFS)
- **Activity Tracking**: All activity collections currently empty (new platform)
- **AI Features**: All AI-related collections empty (ready for implementation)

### Storage Distribution:
- **Primary Content**: ~885 educational resources
- **User-Generated**: ~23 user-created items  
- **File Storage**: 220 files with 879 chunks
- **System Collections**: 30 total collections defined

## Future Enhancements

1. **Automated Backup Strategy**: Implement automated backups for critical collections
2. **Data Archival**: Archive old session data and export files to reduce database size
3. **Performance Monitoring**: Set up MongoDB performance monitoring and alerting
4. **Data Analytics Pipeline**: Create aggregation pipelines for advanced analytics
5. **Real-time Sync**: Implement real-time data synchronization for collaborative features
6. **AI Integration**: Full implementation of AI threads and workspace sessions
7. **Content Recommendation Engine**: Use watch history and user preferences for recommendations
8. **Advanced Search**: Implement full-text search across all content collections

---

*Documentation updated on: December 29, 2024*  
*Total Collections: 30*  
*Database: study-ai*  
*MongoDB Version: 7.x*  
*Platform Status: Production-ready with comprehensive schema coverage*

*This documentation represents the complete database schema as of December 29, 2024. The database contains comprehensive educational content with robust metadata structure supporting a full-featured learning management system with AI-assisted learning capabilities.*
