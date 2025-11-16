# Project Structure and Functionality Mapping

## Overview
This document provides a comprehensive mapping of all functionalities to their corresponding files in the Axiona study platform project. Use this as a reference for understanding what each file does and for cleanup/refactoring purposes.

---

## 🎯 Core Application Structure

### Root Level Files
- **`docker-compose.yml`** - Docker containerization setup for the entire application
- **`README.md`** - Main project documentation and setup instructions
- **`IMPLEMENTATION_STATUS.md`** - Current implementation status and progress tracking
- **`package-lock.json`** - Root level dependencies lock file
- **`test-meeting-functionality.js`** - Test script for meeting/conference functionality

---

## 📁 Client-Side (Frontend) - `/client/`

### 🚀 Main Application Files
| File | Functionality | Status |
|------|---------------|---------|
| `client/package.json` | Frontend dependencies and scripts | ✅ Active |
| `client/vite.config.ts` | Vite build configuration | ✅ Active |
| `client/tsconfig.json` | TypeScript configuration | ✅ Active |
| `client/tsconfig.node.json` | TypeScript Node.js configuration | ✅ Active |
| `client/tailwind.config.js` | Tailwind CSS configuration | ✅ Active |
| `client/postcss.config.js` | PostCSS configuration | ✅ Active |
| `client/index.html` | Main HTML entry point | ✅ Active |

### 🔥 Firebase Configuration
| File | Functionality | Status |
|------|---------------|---------|
| `client/firebase.json` | Firebase project configuration | ✅ Active |
| `client/firestore.rules` | Firestore security rules | ✅ Active |
| `client/firestore.indexes.json` | Firestore database indexes | ✅ Active |

### 📊 Data Connect
| File/Folder | Functionality | Status |
|-------------|---------------|---------|
| `client/dataconnect/` | Firebase Data Connect configuration | ✅ Active |
| `client/dataconnect/dataconnect.yaml` | Data Connect service configuration | ✅ Active |
| `client/dataconnect/seed_data.gql` | GraphQL seed data | ✅ Active |
| `client/dataconnect/schema/` | Data Connect schema definitions | ✅ Active |
| `client/dataconnect/example/` | Example Data Connect queries | ✅ Active |

### 🎨 Static Assets
| File/Folder | Functionality | Status |
|-------------|---------------|---------|
| `client/public/favicon.ico` | Website favicon | ✅ Active |

---

## 🔧 Source Code - `/client/src/`

### 🏗️ Core Application
| File | Functionality | Status |
|------|---------------|---------|
| `src/main.tsx` | React application entry point and providers setup | ✅ Active |
| `src/App.tsx` | Main App component with routing and authentication | ✅ Active |
| `src/vite-env.d.ts` | Vite environment type definitions | ✅ Active |

---

## 🧭 Routing System - `/client/src/routes/`

| File | Functionality | Status |
|------|---------------|---------|
| `routes/AppRoutes.tsx` | Main application routing configuration with protected routes | ✅ Active |

**Routes Mapped:**
- `/` - Landing page
- `/login` - Authentication page
- `/dashboard` - Main dashboard
- `/studypes` - StudyPES materials viewer
- `/library` - Digital library with reference books
- `/library/book/:bookId` - Individual book reader
- `/tutorial-hub` - Tutorial content
- `/conference` - Meeting/conference functionality
- `/my-rack` - User's saved content and notes
- `/profile` - User profile management
- `/settings` - Application settings

---

## 📱 Pages - `/client/src/pages/`

### 🏠 Landing & Authentication
| File | Functionality | Status |
|------|---------------|---------|
| `pages/LandingPage.tsx` | Main landing page with hero section and features | ✅ Active |
| `pages/LoginPage.tsx` | User authentication (login/register) | ✅ Active |

### 📊 Dashboard & Main Areas
| File | Functionality | Status |
|------|---------------|---------|
| `pages/Dashboard.tsx` | Main user dashboard with stats and quick access | ✅ Active |
| `pages/StudyPES.tsx` | StudyPES subject listing and navigation | ✅ Active |
| `pages/SubjectViewer.tsx` | **PDF viewer for StudyPES materials with full annotation features** | ✅ Active |
| `pages/Library.tsx` | **Digital library with search, filter, and book listing** | ✅ Active |
| `pages/BookReader.tsx` | **Full-featured PDF reader for library books with notes** | ✅ Active |
| `pages/TutorialHub.tsx` | Tutorial content management and viewing | ✅ Active |

### 👤 User Management
| File | Functionality | Status |
|------|---------------|---------|
| `pages/ProfilePage.tsx` | User profile viewing and editing | ✅ Active |
| `pages/SettingsPage.tsx` | Application settings and preferences | ✅ Active |
| `pages/MyRack.tsx` | User's saved notes, bookmarks, and progress | ✅ Active |

### 🎥 Conference & Communication
| File | Functionality | Status |
|------|---------------|---------|
| `pages/ConferencePage.tsx` | Video conferencing and meeting functionality | ✅ Active |

---

## 🧩 Components - `/client/src/components/`

### 🧭 Navigation & Layout
| File | Functionality | Status |
|------|---------------|---------|
| `components/Layout.tsx` | Main layout wrapper with navigation | ✅ Active |
| `components/LandingNavigation.tsx` | Navigation bar for authenticated users | ✅ Active |
| `components/FloatingWorkspaceButton.tsx` | Floating action button for workspace features | ✅ Active |

### 🔐 Authentication
| File | Functionality | Status |
|------|---------------|---------|
| `components/AuthGuard.tsx` | Route protection and authentication checking | ✅ Active |

### 📚 StudyPES Components
| File | Functionality | Status |
|------|---------------|---------|
| `components/SubjectCard.tsx` | Individual subject display card for StudyPES | ✅ Active |

---

## 🔄 Context Providers - `/client/src/contexts/`

| File | Functionality | Status |
|------|---------------|---------|
| `contexts/AuthContext.tsx` | **Authentication state management and Firebase integration** | ✅ Active |
| `contexts/NotesContext.tsx` | **Notes state management and synchronization** | ✅ Active |

**AuthContext Features:**
- Firebase authentication integration
- User state management
- Login/logout functionality
- Protected route handling

**NotesContext Features:**
- Note creation and editing
- Real-time note synchronization
- Note sharing between components
- Progress tracking

---

## 🔌 Services & API - `/client/src/services/`

| File | Functionality | Status |
|------|---------------|---------|
| `services/api.ts` | **Main API service with all backend communication** | ✅ Active |

**API Service Functions:**
- User authentication
- PDF material management
- Notes CRUD operations
- Book library management
- Highlight and annotation management
- Progress tracking
- File upload/download

---

## ⚙️ Configuration - `/client/src/config/`

| File | Functionality | Status |
|------|---------------|---------|
| `config/firebase.ts` | Firebase SDK configuration and initialization | ✅ Active |

---

## 🎯 Custom Hooks - `/client/src/hooks/`

| File | Functionality | Status |
|------|---------------|---------|
| `hooks/useAuth.ts` | Authentication hook for components | ✅ Active |
| `hooks/useNotes.ts` | Notes management hook | ✅ Active |

---

## 🎨 Styles - `/client/src/styles/`

| File | Functionality | Status |
|------|---------------|---------|
| `styles/globals.css` | Global CSS styles and Tailwind imports | ✅ Active |
| `styles/pdf-viewer.css` | **Custom PDF viewer styling and overrides** | ✅ Active |
| `styles/settings.css` | Settings page specific styles | ✅ Active |

**PDF Viewer Styles Include:**
- Custom toolbar hiding
- Annotation styling
- Resizable modal styles
- PDF container customization

---

## 📊 TypeScript Types - `/client/src/types/`

| File | Functionality | Status |
|------|---------------|---------|
| `types/index.ts` | Shared TypeScript type definitions | ✅ Active |

---

## 🔧 Utilities - `/client/src/utils/`

| File | Functionality | Status |
|------|---------------|---------|
| `utils/index.ts` | Shared utility functions | ✅ Active |

---

## 🗄️ Data - `/client/src/data/`

| File | Functionality | Status |
|------|---------------|---------|
| `data/index.ts` | Mock data and constants | ⚠️ Review for cleanup |

---

## 🖥️ Server-Side (Backend) - `/server/`

### 🚀 Main Server Files
| File | Functionality | Status |
|------|---------------|---------|
| `server/package.json` | Backend dependencies and scripts | ✅ Active |
| `server/test-db.js` | Database connection test script | ✅ Active |

### 📁 Source Code - `/server/src/`

#### 🏗️ Core Server
| File | Functionality | Status |
|------|---------------|---------|
| `src/app.js` | Express app configuration and middleware setup | ✅ Active |
| `src/server.js` | Server startup and port configuration | ✅ Active |

#### 🗃️ Database Models - `/server/src/models/`
| File | Functionality | Status |
|------|---------------|---------|
| `models/User.js` | User data model and schema | ✅ Active |
| `models/PDFMaterial.js` | StudyPES PDF materials model | ✅ Active |
| `models/Book.js` | **Library books model (separate from PDFMaterial)** | ✅ Active |
| `models/Note.js` | User notes and annotations model | ✅ Active |
| `models/Highlight.js` | PDF highlights and annotations model | ✅ Active |

#### 🛣️ API Routes - `/server/src/routes/`
| File | Functionality | Status |
|------|---------------|---------|
| `routes/main.js` | **Main API router combining all routes** | ✅ Active |
| `routes/auth.js` | Authentication endpoints | ✅ Active |
| `routes/pdfs.js` | **StudyPES PDF material endpoints** | ✅ Active |
| `routes/books.js` | **Library books API endpoints** | ✅ Active |
| `routes/notes.js` | Notes CRUD endpoints | ✅ Active |
| `routes/highlights.js` | Highlights and annotations endpoints | ✅ Active |
| `routes/users.js` | User management endpoints | ✅ Active |

#### 🔧 Middleware - `/server/src/middleware/`
| File | Functionality | Status |
|------|---------------|---------|
| `middleware/auth.js` | JWT authentication middleware | ✅ Active |
| `middleware/upload.js` | File upload handling middleware | ✅ Active |

#### 📊 Database Configuration - `/server/src/config/`
| File | Functionality | Status |
|------|---------------|---------|
| `config/database.js` | MongoDB connection configuration | ✅ Active |

#### 🔧 Utilities - `/server/src/utils/`
| File | Functionality | Status |
|------|---------------|---------|
| `utils/fileUtils.js` | File handling utilities | ✅ Active |
| `utils/pdfUtils.js` | PDF processing utilities | ✅ Active |

#### 📜 Scripts - `/server/scripts/`
| File | Functionality | Status |
|------|---------------|---------|
| `scripts/updateLibraryBooks.js` | **Script to seed library books from /docs/library** | ✅ Active |

#### 📝 Logs - `/server/logs/`
| File/Folder | Functionality | Status |
|-------------|---------------|---------|
| `logs/` | Server logs and error tracking | ✅ Active |

---

## 📚 Documentation & Assets - `/docs/`

### 📖 API Documentation
| File | Functionality | Status |
|------|---------------|---------|
| `docs/api-spec.yaml` | OpenAPI specification for backend APIs | ✅ Active |
| `docs/mind-map.png` | Project architecture mind map | ✅ Active |

### 📚 Library Materials - `/docs/library/`
**Contains all reference books for the digital library:**
| File Category | Functionality | Status |
|---------------|---------------|---------|
| Machine Learning PDFs | ML reference materials | ✅ Active |
| Data Science PDFs | Data Science reference books | ✅ Active |
| Programming PDFs | Programming language references | ✅ Active |
| Mathematics PDFs | Mathematical reference materials | ✅ Active |

### 📖 Study Materials - `/docs/AFLL/`, `/docs/DSA/`, `/docs/Math/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `docs/AFLL/` | Automata and Formal Language materials | ✅ Active |
| `docs/DSA/` | Data Structures and Algorithms materials | ✅ Active |
| `docs/Math/` | Mathematics study materials | ✅ Active |

### 🎨 Design Assets - `/docs/wireframes/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `docs/wireframes/` | UI/UX design wireframes and mockups | ✅ Active |

---

## 📋 Documentation System - `/documentation/`

### 📖 Main Documentation
| File | Functionality | Status |
|------|---------------|---------|
| `documentation/README.md` | Main documentation entry point | ✅ Active |
| `documentation/INDEX.md` | Documentation index and navigation | ✅ Active |
| `documentation/IMPLEMENTATION_SUMMARY.md` | Implementation progress summary | ✅ Active |

### 🏗️ Architecture Documentation - `/documentation/architecture/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `documentation/architecture/` | System architecture documentation | ✅ Active |

### 🖥️ Frontend Documentation - `/documentation/frontend/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `documentation/frontend/` | Frontend-specific documentation | ✅ Active |

### 🔧 Backend Documentation - `/documentation/backend/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `documentation/backend/` | Backend-specific documentation | ✅ Active |

### ✨ Features Documentation - `/documentation/features/`
| Folder | Functionality | Status |
|---------|---------------|---------|
| `documentation/features/` | Feature-specific documentation | ✅ Active |

---

## 🖼️ UI Screenshots - `/Images/`

| File Category | Functionality | Status |
|---------------|---------------|---------|
| Landing Page Screenshots | UI reference images | ✅ Active |
| Dashboard Screenshots | Dashboard UI examples | ✅ Active |
| PDF Viewer Screenshots | PDF reader interface examples | ✅ Active |
| Admin Panel Screenshots | Admin interface examples | ✅ Active |

---

## 🔍 Key Functionality Mapping

### 📚 **Digital Library System**
**Primary Files:**
- `client/src/pages/Library.tsx` - Main library interface
- `client/src/pages/BookReader.tsx` - Full-featured PDF reader
- `server/src/routes/books.js` - Books API
- `server/src/models/Book.js` - Book data model
- `server/scripts/updateLibraryBooks.js` - Library seeding script
- `/docs/library/` - Actual PDF files

### 📖 **StudyPES System**
**Primary Files:**
- `client/src/pages/StudyPES.tsx` - Subject selection
- `client/src/pages/SubjectViewer.tsx` - PDF viewer with annotations
- `server/src/routes/pdfs.js` - PDF materials API
- `server/src/models/PDFMaterial.js` - PDF material model
- `/docs/AFLL/`, `/docs/DSA/`, `/docs/Math/` - Study materials

### 📝 **Notes & Annotations System**
**Primary Files:**
- `client/src/contexts/NotesContext.tsx` - Notes state management
- `server/src/routes/notes.js` - Notes API
- `server/src/models/Note.js` - Note data model
- `client/src/pages/MyRack.tsx` - Notes management interface

### 🔐 **Authentication System**
**Primary Files:**
- `client/src/contexts/AuthContext.tsx` - Auth state management
- `client/src/config/firebase.ts` - Firebase auth configuration
- `server/src/routes/auth.js` - Auth API endpoints
- `server/src/middleware/auth.js` - Auth middleware

### 🎥 **Conference System**
**Primary Files:**
- `client/src/pages/ConferencePage.tsx` - Meeting interface
- `test-meeting-functionality.js` - Meeting feature tests

---

## 🧹 Cleanup Recommendations

### ❌ Files to Review for Deletion
1. **Mock Data Files**: Check `client/src/data/` for unused mock data
2. **Old Configurations**: Review old config files
3. **Unused Images**: Clean up `/Images/` folder
4. **Development Scripts**: Remove temporary test files
5. **Redundant Documentation**: Consolidate duplicate docs

### ⚠️ Files to Keep (Critical)
1. All files marked with ✅ Active status
2. PDF materials in `/docs/` folders
3. Database models and API routes
4. Core React components and pages
5. Firebase configuration files

---

## 📊 Project Health Status

| Category | Status | Notes |
|----------|--------|-------|
| **Authentication** | ✅ Complete | Firebase integration working |
| **PDF Viewing** | ✅ Complete | Full annotation support |
| **Library System** | ✅ Complete | Search, filter, notes working |
| **Notes System** | ✅ Complete | CRUD operations, sync working |
| **Routing** | ✅ Complete | Protected routes implemented |
| **Database** | ✅ Complete | MongoDB with proper schemas |
| **API** | ✅ Complete | RESTful endpoints working |
| **UI/UX** | ✅ Complete | Responsive design implemented |

---

*Last Updated: October 31, 2025*
*Total Files Documented: 100+*
*Status: Ready for cleanup and optimization*
