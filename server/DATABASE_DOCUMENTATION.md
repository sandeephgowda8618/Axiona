# StudyPES Platform - Database Documentation

**Database**: `study-ai`  
**MongoDB Instance**: `localhost:27017`  
**Generated**: November 2, 2025  
**Total Collections**: 11  
**Total Documents**: 600

---

## 📊 Database Overview

The StudyPES platform uses MongoDB with multiple collections to support a comprehensive learning management system with AI-powered features.

### 🗄️ Collections Summary

| Collection | Documents | Purpose | Status |
|-----------|-----------|---------|--------|
| **studymaterials** | 330 | Core study materials (PDFs, presentations) | ✅ Active |
| **videos** | 94 | Educational video library | ✅ Active |
| **books** | 118 | Reference book library | ✅ Active |
| **pdfs.chunks** | 58 | PDF content chunks for search | ✅ Active |
| **workspacesessions** | 0 | User workspace sessions | 🔄 Empty |
| **aithreads** | 0 | AI conversation threads | 🔄 Empty |
| **roomevents** | 0 | Virtual room events | 🔄 Empty |
| **exports** | 0 | Data export records | 🔄 Empty |
| **quizzes** | 0 | Quiz and assessment data | 🔄 Empty |

---

## 📚 Core Content Collections

### 1. StudyMaterials Collection (330 documents)

**Purpose**: Primary repository for StudyPES educational materials  
**Schema**: Enhanced StudyMaterial model with StudyPES-specific fields

#### Key Fields:
- `title`: Material title
- `fileName`: Unique file identifier
- `subject`: Subject category
- `subject_key`: Short subject code (DSA, DBMS, etc.)
- `semester`: Academic semester (1-8)
- `unit`: Course unit number
- `topic`: Specific topic covered
- `level`: Difficulty level (Beginner/Intermediate/Advanced)
- `file_url`: File download path
- `pages`: Number of pages
- `file_type`: File format (PDF, PPTX, DOCX, etc.)
- `tags`: Searchable tags array

#### Content Distribution:
```
📈 By Semester:
  Sem1: 14 materials (Chemistry, EPD, Math, Constitution)
  Sem2: 19 materials (Electrical, Math, EVS, Physics, C Programming)
  Sem3: 155 materials (AFLL, DSA, DDCO, Web Tech, CIE)
  Sem4: 21 materials (Networks, Algorithms, Linear Algebra, OS)
  Sem5: 121 materials (DBMS, Machine Learning, Software Engineering)

📊 Top Subjects:
  1. Database Management Systems: 67 materials
  2. Machine Learning: 37 materials
  3. Data Structures & Algorithms: 36 materials
  4. Web Technology: 34 materials
  5. Digital Design & Computer Organization: 23 materials

📁 File Types:
  - PDF: ~70% (lecture notes, textbooks)
  - PPTX: ~25% (presentations, slides)
  - DOCX: ~4% (assignments, exercises)
  - PPS: ~1% (legacy presentations)
```

#### File Storage:
- **Physical Path**: `Axiona/StudyPES_material_retrival/materials/`
- **Web Path**: `/uploads/studypes/{fileName}`
- **Download API**: `/api/materials/download/{fileName}`

### 2. Videos Collection (94 documents)

**Purpose**: Curated educational video library for enhanced learning

#### Sample Content:
- SQL Database Design - Normalization and Best Practices
- Git and GitHub - Version Control Mastery
- Docker for Beginners - Containerization Made Easy
- API Design Best Practices - RESTful APIs
- CSS Grid Layout - Complete Guide

#### Features:
- Video metadata and descriptions
- Duration tracking
- Skill level categorization
- Subject-wise organization
- Progress tracking capabilities

### 3. Books Collection (118 documents)

**Purpose**: Reference book library for comprehensive study resources

#### Sample Content:
- AI for Data Science – Artificial Intelligence Frameworks
- Convex Optimization
- Designing Machine Learning Systems
- Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow
- Introducing MLOps

#### Features:
- Academic level classification
- Subject categorization
- Author and publication details
- PDF availability tracking
- Recommendation system integration

### 4. PDF Chunks Collection (58 documents)

**Purpose**: Processed PDF content for enhanced search and AI features

#### Features:
- Text extraction from PDFs
- Semantic search capabilities
- AI-powered content analysis
- Context-aware recommendations
- Citation and reference tracking

---

## 🔧 System Collections

### 5. AI Threads (Empty - Ready for Use)
- **Purpose**: Store AI conversation histories
- **Features**: Context preservation, learning analytics
- **Integration**: ChatGPT, study assistant interactions

### 6. Workspace Sessions (Empty - Ready for Use)
- **Purpose**: Track user study sessions
- **Features**: Session duration, materials accessed, progress tracking
- **Analytics**: Study patterns, engagement metrics

### 7. Quizzes (Empty - Ready for Use)
- **Purpose**: Assessment and evaluation system
- **Features**: Question banks, automated grading, performance analytics
- **Integration**: Subject-wise quizzes, progress evaluation

### 8. Room Events (Empty - Ready for Use)
- **Purpose**: Virtual classroom and study group management
- **Features**: Live sessions, collaborative study, event scheduling

### 9. Exports (Empty - Ready for Use)
- **Purpose**: Data export and backup management
- **Features**: User data exports, academic reports, progress summaries

---

## 🔍 Search and Discovery Features

### Indexes and Performance:
- **Text Search**: Full-text search on titles, descriptions, topics
- **Subject Filtering**: Fast subject-based queries
- **Semester Organization**: Academic year and semester indexing
- **File Type Filtering**: Filter by document type
- **Difficulty Levels**: Beginner to Advanced categorization

### AI Integration:
- **Semantic Search**: AI-powered content discovery
- **Recommendations**: Personalized learning paths
- **Content Analysis**: Automated tagging and categorization
- **Progress Tracking**: Learning analytics and insights

---

## 📈 Usage Statistics

### Content Metrics:
- **Total Materials**: 330 study documents
- **Video Library**: 94 educational videos
- **Reference Books**: 118 comprehensive resources
- **Searchable Content**: 58 processed PDF chunks
- **Subject Coverage**: 40+ academic subjects
- **Academic Scope**: 5 semesters (1st-3rd year)

### Technical Specifications:
- **Database Size**: ~600 documents
- **Storage Format**: MongoDB BSON
- **File Storage**: Local file system with web API access
- **Search Engine**: MongoDB text search + AI semantic search
- **Backup Strategy**: Regular MongoDB dumps
- **Scaling**: Horizontal scaling ready

---

## 🚀 Future Enhancements

### Planned Features:
1. **Quiz System**: Interactive assessments and evaluations
2. **AI Tutoring**: Personalized learning assistance
3. **Study Groups**: Collaborative learning spaces
4. **Progress Analytics**: Detailed learning insights
5. **Mobile App**: Native mobile access
6. **Offline Sync**: Download for offline study

### Technical Roadmap:
1. **Performance Optimization**: Advanced indexing strategies
2. **Real-time Features**: Live study sessions and chat
3. **Advanced AI**: GPT integration for content generation
4. **Analytics Dashboard**: Comprehensive learning analytics
5. **API Expansion**: Third-party integrations

---

## 🔐 Security and Access

### Data Protection:
- **User Authentication**: Firebase-based authentication
- **Access Controls**: Role-based permissions
- **File Security**: Secure download tokens
- **Data Encryption**: Transport and storage encryption
- **Backup Security**: Encrypted backup storage

### Privacy Compliance:
- **Data Minimization**: Only necessary data collection
- **User Consent**: Explicit permission for data usage
- **Export Rights**: User data portability
- **Deletion Rights**: Complete data removal options

---

**Last Updated**: November 2, 2025  
**Documentation Version**: 1.0  
**Database Version**: MongoDB 7.x  
**Platform**: StudyPES Learning Management System
