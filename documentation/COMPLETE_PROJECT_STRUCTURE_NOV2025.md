# Complete Project Structure - November 2025

**Last Updated:** November 2, 2025  
**Status:** Current Clean State After Major Cleanup

## 📁 **Root Directory Structure**

```
/Users/sandeeph/Documents/s2/Axiona/
├── .git/                           # Git repository
├── .github/                        # GitHub workflows and templates
├── .gitignore                      # Git ignore rules
├── README.md                       # Main project README
├── docker-compose.yml              # Docker configuration
├── package-lock.json               # Root package lock
├── test-meeting-functionality.js   # Meeting system tests
│
├── client/                         # Frontend React Application
│   ├── firebase.json               # Firebase configuration
│   ├── firestore.indexes.json      # Firestore indexes
│   ├── firestore.rules            # Firestore security rules
│   ├── index.html                  # Main HTML template
│   ├── package.json                # Client dependencies
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tsconfig.node.json         # Node TypeScript config
│   ├── vite.config.ts             # Vite build configuration
│   │
│   ├── dataconnect/               # Firebase Data Connect
│   │   ├── dataconnect.yaml       # Data Connect configuration
│   │   ├── seed_data.gql          # GraphQL seed data
│   │   ├── example/               # Example queries
│   │   └── schema/                # GraphQL schemas
│   │
│   ├── public/                    # Static assets
│   │   └── favicon.ico            # Site favicon
│   │
│   └── src/                       # React source code
│       ├── App.tsx                # Main App component
│       ├── main.tsx               # Application entry point
│       │
│       ├── components/            # Reusable UI components
│       │   ├── Layout.tsx         # Main layout wrapper
│       │   ├── Navigation.tsx     # Navigation component
│       │   ├── ProtectedRoute.tsx # Route protection
│       │   └── ...                # Other components
│       │
│       ├── contexts/              # React contexts
│       │   ├── AuthContext.tsx    # Authentication context
│       │   └── ...                # Other contexts
│       │
│       ├── pages/                 # Page components
│       │   ├── Dashboard.tsx      # Main dashboard
│       │   ├── Library.tsx        # Book library
│       │   ├── StudyMaterialsPES.tsx # Study materials
│       │   ├── TutorialHub.tsx    # Video tutorials
│       │   ├── QuizSelection.tsx  # Quiz system
│       │   ├── ConferenceLobby.tsx # Meeting lobby
│       │   ├── ConferenceMeeting.tsx # Meeting room
│       │   └── ...                # Other pages
│       │
│       └── routes/                # Routing configuration
│           └── AppRoutes.tsx      # Main routing setup
│
├── server/                        # Backend Node.js Application
│   ├── package.json              # Server dependencies
│   ├── check_pdf_materials.js    # StudyPES analysis script
│   ├── show_studypes_details.js  # StudyPES details display
│   │
│   ├── logs/                      # Server logs directory
│   ├── scripts/                   # Utility scripts
│   │
│   └── src/                       # Server source code
│       ├── app.js                 # Express application setup
│       ├── server.js              # Server entry point
│       │
│       ├── models/                # MongoDB models
│       │   ├── Book.js            # Book schema
│       │   ├── User.js            # User schema
│       │   ├── PDF.js             # PDF schema
│       │   ├── Video.js           # Video schema
│       │   ├── Note.js            # Notes schema
│       │   ├── Meeting.js         # Meeting schema
│       │   ├── Quiz.js            # Quiz schema
│       │   └── ...                # Other models
│       │
│       ├── routes/                # API routes
│       │   ├── main.js            # Main API router
│       │   ├── books.js           # Book management routes
│       │   ├── notes.js           # Notes API
│       │   ├── meetings.js        # Meeting API
│       │   ├── videos.js          # Video API
│       │   ├── auth.js            # Authentication routes
│       │   └── ...                # Other route files
│       │
│       ├── services/              # Business logic services
│       │   ├── dataService.js     # Data operations
│       │   ├── aiService.js       # AI integration
│       │   ├── authService.js     # Authentication logic
│       │   └── ...                # Other services
│       │
│       ├── middleware/            # Express middleware
│       │   ├── auth.js            # Authentication middleware
│       │   ├── cors.js            # CORS configuration
│       │   └── ...                # Other middleware
│       │
│       └── utils/                 # Utility functions
│           ├── database.js        # Database helpers
│           ├── fileUtils.js       # File operations
│           └── ...                # Other utilities
│
├── docs/                          # Additional documentation
│   ├── api-spec.yaml             # API specification
│   ├── mind-map.png              # Project mind map
│   │
│   ├── AFLL/                     # AFLL study materials
│   ├── DSA/                      # DSA study materials
│   ├── library/                  # Library documentation
│   ├── Math/                     # Mathematics materials
│   └── wireframes/               # UI wireframes
│
├── documentation/                 # **MAIN DOCUMENTATION HUB**
│   ├── INDEX.md                  # Documentation index
│   ├── README.md                 # Documentation README
│   ├── PROJECT_UPDATE_SUMMARY_NOV2024.md # Latest updates
│   ├── STUDYPES_MATERIAL_RETRIEVAL.md # StudyPES system
│   │
│   ├── ENHANCED_METADATA_TEMPLATE.md # Metadata structure
│   ├── IMPLEMENTATION_STATUS.md   # Implementation status
│   ├── INTEGRATION_SUMMARY.md     # Integration docs
│   ├── LIBRARY_SCHEMA_DOCUMENTATION.md # Library schema
│   ├── MONGODB_SCHEMA_TEMPLATE.md # MongoDB schemas
│   │
│   ├── API_AND_DATABASE_MAPPING.md # API mapping
│   ├── CLEANUP_AND_OPTIMIZATION_GUIDE.md # Cleanup guide
│   ├── FRONTEND_COMPONENTS_MAPPING.md # Frontend mapping
│   ├── PROJECT_STRUCTURE_AND_FUNCTIONALITY_MAPPING.md # Project mapping
│   │
│   ├── architecture/             # Architecture documentation
│   │   ├── TECH_STACK.md         # Technology stack
│   │   └── VIDEO_CONFERENCE_ARCHITECTURE.md # Video conf architecture
│   │
│   ├── backend/                  # Backend documentation
│   │   ├── AXIONA_BACKEND_IMPLEMENTATION.md # Backend guide
│   │   ├── BACKEND_RECOVERY_GUIDE.md # Recovery procedures
│   │   ├── AUTH_SYSTEM_GUIDE.md  # Authentication guide
│   │   ├── DATABASE_ERD.md       # Database schema
│   │   ├── DATABASE_STUDY_MATERIALS_GUIDE.md # Study materials DB
│   │   ├── BACKEND_CLEANUP_SUMMARY.md # Cleanup summary
│   │   ├── DYNAMIC_DATA_AUDIT.md # Data audit
│   │   └── SCRIPTS_README.md     # Scripts documentation
│   │
│   ├── features/                 # Feature documentation
│   │   ├── PDF_HIGHLIGHT_SYSTEM.md # PDF system
│   │   └── VIDEO_CONFERENCE_IMPLEMENTATION_STATUS.md # Video conf status
│   │
│   └── frontend/                 # Frontend documentation
│       ├── COMPONENT_LIBRARY.md  # Component library
│       ├── CSS_MIGRATION_GUIDE.md # CSS guide
│       ├── LANDING_PAGE_CHECKLIST.md # Landing page
│       └── pages/                # Page documentation
│
├── mcp-rag-system/               # RAG System Implementation
│   ├── README.md                 # RAG system documentation
│   ├── requirements.txt          # Python dependencies
│   ├── main.py                   # Main RAG application
│   ├── core_rag.py              # Core RAG functionality
│   ├── simple_rag.py            # Simplified RAG
│   ├── test_rag_pipeline.py     # RAG testing
│   ├── standard_library_ingest.py # Library ingestion
│   │
│   ├── chromadb/                # Vector database
│   ├── config/                  # Configuration files
│   ├── core/                    # Core modules
│   ├── models/                  # AI models
│   ├── services/                # RAG services
│   ├── scripts/                 # Utility scripts
│   ├── test/                    # Test files
│   └── utils/                   # Utility functions
│
└── META_dataretreval_libreary_refrences/ # Data Processing Pipeline
    ├── batch_processor.py        # **MAIN WORKING PIPELINE**
    ├── extract_metadata.py       # Metadata extraction
    ├── generate_ai_metadata.py   # AI metadata generation
    ├── source_data_processor.py  # Source processing
    ├── requirements.txt          # Python dependencies
    ├── books_data.json          # Reference books data
    │
    ├── batch_output/            # Pipeline output
    │   ├── final_metadata_20251101_223839.json # **MAIN OUTPUT**
    │   └── final_report_20251101_223839.md # Processing report
    │
    └── Scource_data.md          # Source data documentation
```

## 🗂️ **Key Directory Purposes**

### **Client (`/client/`)**
- **Purpose:** React frontend application with TypeScript
- **Key Features:** Study dashboard, library, video tutorials, quiz system, meeting rooms
- **Build System:** Vite with Tailwind CSS
- **State Management:** React Context API
- **Authentication:** Firebase integration

### **Server (`/server/`)**
- **Purpose:** Node.js backend API with Express
- **Database:** MongoDB with Mongoose ODM
- **Key Features:** REST API, authentication, file upload, real-time features
- **Special Scripts:** StudyPES analysis and metadata display

### **Documentation (`/documentation/`)**
- **Purpose:** Comprehensive project documentation hub
- **Organization:** Architecture, backend, frontend, features, project management
- **Status:** Up-to-date with all recent changes and cleanup

### **Data Pipeline (`/META_dataretreval_libreary_refrences/`)**
- **Purpose:** Automated metadata extraction and processing
- **Main Script:** `batch_processor.py` - processes PDFs and generates metadata
- **Output:** JSON files ready for MongoDB import
- **Integration:** Server consumes pipeline output for library system

### **RAG System (`/mcp-rag-system/`)**
- **Purpose:** Retrieval-Augmented Generation for intelligent document search
- **Technology:** ChromaDB vector database, AI embeddings
- **Features:** Semantic search, document ingestion, intelligent Q&A
- **Status:** Integrated with main system

## 🧹 **Recently Cleaned/Removed**

### **Removed Files:**
- ❌ `UnprocessedBooks_Implementation.md` - Temporary documentation
- ❌ `server/src/routes/unprocessedBooks.js` - Temporary API route
- ❌ `client/src/pages/UnprocessedBooks.tsx` - Temporary UI page
- ❌ `StudyPES_material_retrival/` - Moved to documentation
- ❌ Various old pipeline files (complete_pipeline.py, main_pipeline.py, etc.)

### **Cleaned Code:**
- ✅ Removed unprocessed books navigation item
- ✅ Removed temporary routes and imports
- ✅ Consolidated documentation structure
- ✅ Optimized data pipeline (retained only working components)

## 📊 **Current State Metrics**

### **Database:**
- **Collections:** 26 active MongoDB collections
- **Books:** 118 total books
- **StudyPES Materials:** 3 identified (1 DSA, 2 Mathematics, 0 AFLL)
- **File Access:** 23/26 materials accessible

### **Codebase:**
- **Frontend:** React + TypeScript, clean routing
- **Backend:** Node.js + Express, optimized APIs
- **Documentation:** Comprehensive and organized
- **Pipeline:** Single working pipeline retained

### **System Health:**
- ✅ No syntax errors
- ✅ All temporary systems removed
- ✅ Core functionality intact
- ✅ Documentation up-to-date

---

**🎯 This structure represents a clean, optimized codebase with comprehensive documentation and working data processing pipelines.**
