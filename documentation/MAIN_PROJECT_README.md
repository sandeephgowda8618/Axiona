# 🎓 Axiona - AI-Powered Learning Platform

A comprehensive, production-ready educational platform combining traditional study materials with advanced AI capabilities, real-time collaboration, and intelligent content recommendations. Built with modern MERN stack + Python AI services.

*Last Updated: November 2, 2025 | Status: ✅ Production Ready*

## 📋 **Table of Contents**
- [🎯 Current Status](#current-status)
- [🏗️ System Architecture](#system-architecture)
- [📊 Database & Content](#database--content)
- [🚀 Key Features](#key-features)
- [🛠️ Tech Stack](#tech-stack)
- [📁 Project Structure](#project-structure)
- [⚡ Quick Start](#quick-start)
- [📚 Documentation](#documentation)
- [🎨 UI/UX Components](#uiux-components)

## 🎯 **Current Status**

### ✅ **Production Ready Features**
- **Complete MERN Stack**: Full-stack implementation with 118 educational books and 100+ videos
- **AI-Powered RAG System**: ChromaDB vector search with Gemini/OpenAI integration
- **Real-time Collaboration**: Socket.IO + WebRTC video conferencing
- **Firebase Authentication**: Complete user management with role-based access
- **Floating Workspace**: Seamless content transfer between study materials and workspace
- **Enhanced PDF System**: PDF viewing with annotations, highlights, and bookmarks
- **Metadata Processing**: AI-enhanced book metadata with 97 GitHub reference PDFs

### 📊 **System Statistics**
- **Database**: 118 books + 100+ videos in MongoDB
- **Vector Search**: 97 reference textbooks with full-text embeddings
- **Frontend Components**: 50+ React components with TypeScript
- **Backend APIs**: 20+ RESTful endpoints with comprehensive validation
- **AI Integration**: Multiple LLM providers (OpenAI, Gemini, Perplexity)

## 🏗️ **System Architecture**

```
📱 Frontend (React + TypeScript + Vite)
    ↓ API calls
🖥️ Backend (Node.js + Express + MongoDB)
    ↓ Real-time
🔄 Socket.IO + WebRTC (Video Conferencing)
    ↓ AI Processing
🤖 Python FastAPI (RAG System)
    ↓ Vector Search
📊 ChromaDB (Semantic Search)
    ↓ Content Processing
📚 Metadata Pipeline (AI Enhancement)
```

### **Core Components:**
1. **Client Application** - React 18 + Vite + Tailwind CSS
2. **Server API** - Node.js + Express + MongoDB + Firebase Auth
3. **RAG System** - Python + FastAPI + ChromaDB + Vector Search
4. **Metadata Pipeline** - AI-enhanced PDF processing and classification
5. **Real-time Services** - Socket.IO + WebRTC for collaboration
6. **Content Management** - GitHub integration + automated metadata extraction

## 📊 **Database & Content**

### **MongoDB Collections:**
- **`books`**: 118 educational textbooks with AI-enhanced metadata
  - 21 original library books
  - 97 GitHub reference PDFs with direct download URLs
  - Enhanced fields: key_concepts, difficulty, target_audience, prerequisites
- **`videos`**: 100+ curated tutorial videos with metadata
- **`users`**: Firebase-integrated user management
- **`notes`**: Private user notes with PDF/video context
- **`highlights`**: PDF annotations and bookmarks

### **ChromaDB Vector Database:**
- **Collection**: `reference_textbooks` (97 documents)
- **Content**: Full-text embeddings from first 15 pages
- **Metadata**: Complete enhanced metadata for semantic search
- **Search Types**: Semantic similarity, filtered queries, hybrid search

### **Content Statistics:**
- **PDF Processing**: 92% enhanced metadata coverage
- **Video Catalog**: Multiple subjects (Web Dev, Python, ML, DSA)
- **Search Capability**: Vector-based semantic search across all content
- **AI Enhancement**: Gemini-powered metadata generation

## � **Key Features**

### **1. AI-Powered Learning System**
- **RAG-Based Assistant**: Context-aware study buddy with access to 118 books
- **Personalized Roadmaps**: AI-generated learning paths based on user goals
- **Smart Content Recommendations**: Vector search for relevant materials
- **Intelligent PDF Search**: Semantic search across educational content
- **Context-Aware Notes**: AI understands current study context (page/timestamp)

### **2. Floating Workspace System** ✅ **NEW**
- **Seamless Content Transfer**: One-click transfer from study materials to workspace
- **Real PDF Display**: Identical PDF viewer with all plugins and features
- **Video Integration**: YouTube and regular video support with timestamp tracking
- **AI Integration**: Context-aware AI responses based on transferred content
- **Note Management**: Smart note-taking with content context

### **3. Advanced Study Materials**
- **118 Educational Books**: Complete textbook collection with metadata
- **100+ Tutorial Videos**: Curated video library with progress tracking
- **PDF Viewer Pro**: Annotations, highlights, bookmarks, search, zoom
- **GitHub Integration**: Direct access to 97 reference PDFs
- **Smart Filtering**: AI-powered content discovery and recommendations

### **4. Real-time Collaboration**
- **Video Conferencing**: WebRTC-based study sessions (up to 200 participants)
- **Study Rooms**: Password-protected collaborative spaces
- **Real-time Chat**: Instant messaging during video sessions
- **Screen Sharing**: Share presentations and documents
- **Session Management**: Auto-save progress and room persistence

### **5. Intelligent Content Processing**
- **Metadata Enhancement**: AI-powered book classification and tagging
- **PDF Text Extraction**: OCR support for image-based PDFs
- **Content Analysis**: Key concepts, difficulty assessment, prerequisites
- **Batch Processing**: Automated processing of large content libraries
- **Quality Assurance**: Comprehensive validation and error handling

### **6. User Experience & Analytics**
- **Firebase Authentication**: Social login (Google, GitHub) + email/password
- **Progress Tracking**: Learning streaks, completion rates, time analytics
- **Personalized Dashboard**: Custom learning paths and recommendations
- **Theme Support**: Dark/light mode with modern UI
- **Responsive Design**: Mobile-optimized interface

### **1. Landing Page (StudySpace)**
**Layout & Components:**
- **Header Navigation**: Logo + (Tutorial Hub, StudyPES, Conference, My Rack, Profile) + Sign Up button
- **Hero Section**: 
  - Dark gradient background with centered content
  - Main headline: "Master Your Studies"
  - Subtitle: "Unlock your potential with our comprehensive learning platform"
  - Primary CTA: "Start Learning" button
  - Carousel dots indicator at bottom
- **Features Section**: "Why Choose StudySpace?"
  - **Progress Tracking Card**: 
    - Left: Text content with "Open Workspace" + "See Features" buttons
    - Right: Dashboard mockup with analytics charts
  - **Tutorial Hub Card**:
    - Colorful illustration with YouTube + PDF icons
    - "Watch curated YouTube playlists & reference PDFs tailored to your learning needs"
    - "Learn More →" link
  - **StudyPES Card**:
    - Green background with study materials illustration
    - "College notes by class/year/subject – zero spam, maximum quality content"
    - "Learn More →" link
  - **Conference Card**:
    - Purple gradient with collaboration illustration
    - "Password-protected study rooms – no install required, just join and collaborate"
    - "Learn More →" link
  - **Workspace Card**:
    - Robot + notepad illustration
    - "AI tutor + notes pad that auto-saves while you learn, keeping everything organized"
    - "Learn More →" link
  - **AI Assistant Card**:
    - Gradient background with AI robot reading
    - "Ask, quiz, summarise – context-aware to your page and learning progress"
    - "Learn More →" link
  - **Profile Card**:
    - Analytics chart illustration
    - "Track courses, streaks, roadmap – export any time and own your learning data"
    - "Learn More →" link
- **Footer**: 
  - Copyright: "© 2025 Study-AI Mini – Built with MERN + Python + WebRTC"
  - Floating "Open Workspace" button (bottom right)

### **2. Authentication Page**
**Layout & Components:**
- **Centered Card Design** with tab navigation
- **Tab Headers**: "Login" (active) | "Register"
- **Login Form**:
  - Title: "Welcome back"
  - Subtitle: "Sign in to your Study-AI account"
  - **Form Fields**:
    - Email input with placeholder
    - Password input with show/hide toggle
    - "Forgot your password?" link
  - **Primary Button**: "Sign In" (full width, dark)
  - **Divider**: "Or continue with"
  - **Social Auth Buttons**:
    - "Continue with Google" (with Google icon)
    - "Continue with GitHub" (with GitHub icon)
  - **Footer Link**: "Don't have an account? Sign up"

### **3. Profile Dashboard**
**Layout & Components:**
- **Header**: Standard navigation with tabs (Overview | Settings)
- **User Profile Section**:
  - Avatar + "John Smith" + "Computer Science Student"
- **Stats Cards Row**:
  - **Courses Finished**: 12
  - **Streak Days**: 45  
  - **Total Notes**: 234
  - **Weekly Activity**: 8.5h
- **Learning Progress Section**:
  - "Chart.js Line Graph" placeholder
  - "Weekly activity visualization"
- **AI Learning Roadmap**:
  - **Python Fundamentals**: "Master basic Python programming concepts" (Completed ✓)
  - **Data Structures & Algorithms**: "Learn essential programming concepts" (In Progress)
  - **Machine Learning Basics**: "Introduction to ML concepts and algorithms" (Locked 🔒)
  - **Deep Learning**: "Advanced neural networks and AI" (Locked 🔒)
- **Floating Action Button**: Bottom right corner

### **4. Conference System**

#### **Conference Lobby**
- **Header**: Standard navigation
- **Centered Layout**:
  - Title: "Conference Lobby"
  - Subtitle: "Choose how you want to join your study session. Create a new room or join an existing one."
- **Two-Column Layout**:
  - **Create Room** (Left):
    - Plus icon in circle
    - "Start a new study session and invite others to join"
    - Room ID field (auto-generated: STUDY-AI-7834) with copy button
    - "Room ID generated automatically" note
    - Password field (optional) with security note
    - "Create & Enter Room" button
  - **Join Room** (Right):
    - Arrow icon in circle  
    - "Enter an existing study session with Room ID"
    - Room ID input with placeholder
    - "Get Room ID from the room creator" note
    - Password field with protection note
    - "Join Room" button
- **Quick Tips Section**:
  - "Share your Room ID with study partners"
  - "Up to 200 participants supported"
  - "Use passwords for private sessions"  
  - "Sessions auto-save your progress"
- **Floating**: "Open Workspace" button

#### **Conference Main (Active Meeting)**
- **Header Bar**: 
  - Study-AI logo + Room ID + Lock icon + "Connected" + "1 participant" + "Leave Call"
- **Video Grid**: 2x2 layout
  - **Top Left**: "John Smith (You)" with mute indicator
  - **Top Right**: "Sarah Wilson" (active speaker)
  - **Bottom Left**: "Mike Chen" 
  - **Bottom Right**: "Waiting for participant" placeholder
- **Bottom Controls**:
  - Mute | Camera | Share | Reactions | More
- **Right Sidebar - Chat Panel**:
  - Chat messages with timestamps
  - **Sarah Wilson**: "Hey everyone! Ready to start the study session?"
  - **Mike Chen**: "Yes! I have my notes ready. Should we share screens?"
  - **John Smith**: "Perfect! Let me start sharing my screen with this presentation."
  - Message input with send button

### **5. Quiz System**

#### **Quiz Selection Page**
- **Header**: Standard navigation
- **Page Title**: "Quiz Selection"
- **Subtitle**: "Choose from our collection of practice quizzes"
- **Filter Controls**:
  - Topic dropdown: "All Topics"
  - Difficulty dropdown: "All Levels" 
  - Status dropdown: "All Quizzes"
- **Quiz Cards Grid** (2x3 layout):
  - **Algebra Fundamentals** (Beginner - Mathematics):
    - Questions: 25, Max Marks: 100, Duration: 45 min
    - "Start Now" button
  - **Organic Chemistry** (Advanced - Chemistry):
    - Questions: 30, Max Marks: 120, Duration: 60 min
    - Previous Score: 85/120
    - "Retake Quiz" button
  - **Mechanics & Motion** (Intermediate - Physics):
    - Questions: 20, Max Marks: 80, Duration: 40 min
    - "Start Now" button
  - **Cell Biology** (Beginner - Biology):
    - Questions: 35, Max Marks: 140, Duration: 50 min
  - **Calculus Practice** (Advanced - Mathematics):
    - Questions: 40, Max Marks: 160, Duration: 75 min
  - **Thermodynamics** (Intermediate - Physics):
    - Questions: 28, Max Marks: 112, Duration: 55 min

#### **Quiz Exam Interface**
- **Header**: 
  - "JEE Main Mock Test - Physics" + "Question 15 of 30" + Timer: "02:45:30" + "Palette" button
- **Main Content**:
  - **Question 15**: Physics problem about particle motion with diagram placeholder
  - **Multiple Choice Options**:
    - A. 2 m/s
    - B. 4 m/s (selected)
    - C. 6 m/s  
    - D. 8 m/s
- **Navigation Controls**:
  - "Previous" | "Mark for Review" | "Next" buttons
- **Right Sidebar - Question Palette**:
  - Grid of question numbers (1-30)
  - Color coding:
    - Dark: Answered (1, 4, 15)
    - Medium: Marked for Review (13)
    - Light: Not Answered
    - Lightest: Not Visited
  - Legend with status indicators
- **Bottom Actions**:
  - "Rough Sheet" button | "Submit Quiz" button

### **6. Study Materials & Content**

#### **My Rack (Notes Collection)**
- **Header**: "My Rack – Study-AI Mini" + Export TXT + Delete Selected buttons
- **Page Info**: 
  - Title: "Study Notes Collection"
  - Subtitle: "Manage and organize your saved study materials"
  - Stats: "12 notes saved • Last updated 2 hours ago"
- **Notes Grid** (3x2 layout):
  - **Quantum Mechanics Fundamentals** (Physics - Dec 8, 2024):
    - "Wave-particle duality explains how matter and energy exhibit both wave-like and particle-like..."
  - **Machine Learning Algorithms Overview** (Computer Science - Dec 7, 2024):
    - "Supervised learning uses labeled data to train models that can make predictions on new, unseen..."
  - **Organic Chemistry Reactions** (Chemistry - Dec 6, 2024):
    - "Nucleophilic substitution reactions involve the replacement of a leaving group by a nucleophile..."
  - **World War II Timeline** (History - Dec 5, 2024):
    - "The Second World War began in 1939 with Germany's invasion of Poland. Key events includ..."
  - **Calculus Integration Techniques** (Mathematics - Dec 4, 2024):
    - "Integration by parts follows the formula ∫u dv = uv - ∫v du. This method is particularly useful for..."
  - **Cell Biology Structures** (Biology - Dec 3, 2024):
    - "Mitochondria are the powerhouse of the cell, responsible for ATP production through cellular..."
- **Pagination**: "Showing 1-6 of 12 notes" with page controls

#### **StudyPES Materials Page**
- **Header**: StudyPES + Study-AI Mini branding + navigation tabs
- **Page Title**: "Study Materials"
- **Subtitle**: "Access comprehensive study materials and resources for your courses"
- **Filter Controls**:
  - Class: "All Classes" | Year: "All Years" | Subject: "All Subjects" + "Apply Filters"
  - Sort by: "Recent"
- **Materials Grid** (3x2 layout):
  - **Operating Systems Fundamentals** (IT - 3rd Year - OS):
    - PDF thumbnail, 42 pages
    - Download + bookmark buttons
  - **Database Design Principles** (IT - 2nd Year - DBMS):
    - PDF thumbnail, 38 pages  
    - Download + bookmark buttons
  - **Computer Architecture Basics** (CS - 2nd Year - COA):
    - PDF thumbnail, 54 pages
    - Download + bookmark buttons
  - **Advanced Database Concepts** (CS - 3rd Year - DBMS):
    - PDF thumbnail, 64 pages
    - Download + bookmark buttons
  - **Process Management in OS** (IT - 3rd Year - OS):
    - PDF thumbnail, 28 pages
    - Download + bookmark buttons
  - **Memory Management Systems** (CS - 3rd Year - COA):
    - PDF thumbnail, 47 pages
    - Download + bookmark buttons
- **Footer**: 
  - StudyPES branding + "Empowering students with AI-powered study materials and resources for academic excellence"
  - Quick Links: Dashboard, Tutorials, Study Materials, Practice Tests
  - Support: Help Center, Contact Us, Privacy Policy, Terms of Service
  - Copyright: "© 2025 StudyPES. All rights reserved."

#### **Tutorial Hub**
- **Header**: Study-AI navigation + breadcrumb (Home > Tutorial Hub)
- **Sidebar Filter**:
  - "Filter by Topic"
  - Checkboxes: Operating Systems, Database Management ✓, Object-Oriented Programming, Computer Networks, Data Structures, Algorithms
- **Search Bar**: "Search tutorials..."
- **Content Grid** (3x3 layout):
  - **Introduction to SQL Databases**:
    - Thumbnail, "Learn the basics of relational databases and SQL queries with practical examples"
    - Watch + Download buttons
  - **TCP/IP Protocol Suite**:
    - "Comprehensive guide to understanding TCP/IP networking protocols and their applications"
    - Watch + Download + bookmark buttons
  - **Object-Oriented Programming in Java**:
    - "Master the principles of OOP including inheritance, polymorphism, and encapsulation"
    - Watch + Download + bookmark buttons
  - **Linux System Administration**:
    - "Essential Linux commands and system administration techniques for beginners"
    - Watch + Download buttons
  - **Arrays and Linked Lists**:
    - "Fundamental data structures with implementation examples and use cases"
    - Watch + Download buttons
  - **Sorting and Searching Algorithms**:
    - "Explore efficient sorting and searching techniques with time complexity analysis" 
    - Watch + Download buttons
  - **Database Normalization** + **RESTful API Design** + **Cybersecurity Fundamentals**
- **Footer**: Study-AI branding + resources/support links + "Open Workspace" button

### **7. AI Study Assistant**

#### **Study-Buddy Interface**
- **Left Panel - Chat Interface**:
  - **Header**: "Study-Buddy" + "Live - knows your plan" + settings icon
  - **Chat Messages**:
    - Study-Buddy: "Ready to tackle your Operating Systems study plan! 📚 You have 2 hours scheduled for today."
    - Progress: 65% with chat button
    - User: "I'm struggling with memory management concepts"
    - Study-Buddy: "Let's break it down! 💡 I suggest a 15-minute focused session on virtual memory."
    - Action buttons: "15-min timer" + "Resource"
  - **Input Area**: 
    - Quick actions: "Why am I stuck?" | "Next 30 min plan" | "Quiz me on OS"
    - Text input: "Ask Study-Buddy anything..."
- **Right Panel - Study Context**:
  - **Current Study Plan**:
    - "Operating Systems - Memory Management" (Active)
    - "Database Systems - Indexing" (Next: 3:00 PM)
  - **Completed Courses**:
    - Data Structures ✓ | Algorithms ✓ | OS Basics ✓
  - **Last Quiz Performance**:
    - Overall Score: 78%
    - Weak Topics: Virtual Memory, Paging
  - **Study Streak**: 12 days strong!
  - **Quick Notes**: Expandable section
    - "Remember: Virtual memory allows programs to use more memory than physically available"

### **8. Settings Page**
**Comprehensive Settings Layout:**
- **Page Title**: "Settings"
- **Subtitle**: "Manage your account preferences and security settings"

#### **Account Section**:
- User avatar + "John Doe" + "john.doe@example.com"
- **Change Password**:
  - Current Password field
  - New Password field
  - Confirm New Password field
  - "Update Password" button
- **Delete Account**:
  - Warning: "This action cannot be undone. All your data will be permanently deleted."
  - "Delete Account" button

#### **General Section**:
- **Theme**: "Choose your preferred theme"
  - Light/Dark toggle switch (Light selected)
- **Language**: "Select your preferred language"
  - English dropdown

#### **Notifications Section**:
- **Email Notifications**: "Receive notifications via email" (enabled)
- **Push Notifications**: "Receive push notifications" (disabled)
- **Study Reminder Schedule**:
  - Time: "09:00 AM" with clock icon
  - Frequency: "Daily" dropdown

#### **Privacy Section**:
- **Export Data**: "Download all your data in JSON format" + "Export JSON" button
- **Delete All Data**: "Permanently delete all your study data and progress"
  - "Delete All Data" button

#### **Security Section**:
- **Two-Factor Authentication**: "Add an extra layer of security to your account" (disabled toggle)
- **Active Sessions**:
  - Desktop - Chrome (Current session - Last active now) + "Current" badge
  - iPhone - Safari (Last active 2 hours ago) + "Revoke" button  
  - MacBook - Firefox (Last active yesterday) + "Revoke" button
- **Save Changes** button (bottom)

### **9. Admin Panel**

#### **Admin Users Management**
- **Header**: "Users" + "Add User" button
- **Tab Navigation**: All Users | Active | Banned | Recent
- **Filter Controls**:
  - Search: "Search users..."
  - Role: "All Roles" | Status: "All Status" 
  - Date range: dd/mm/yyyy to dd/mm/yyyy + "Clear Filters"
- **Bulk Actions**: 
  - "Select all" checkbox | "Ban Selected" | "Delete Selected" | "Export CSV"
  - "1,247 users total"
- **User Table**:
  - Columns: USER | ROLE | STATUS | REGISTERED | LAST SEEN | NOTES | ACTIONS
  - **John Doe** (john.doe@email.com):
    - Role: Admin, Status: Active toggle, Registered: Jan 15, 2025
    - Last Seen: 2 hours ago, Notes: 3, Actions: ⋮ menu
  - **Jane Smith** (jane.smith@email.com):
    - Role: User, Status: Active toggle, Registered: Jan 12, 2025
    - Last Seen: 1 day ago, Notes: 7, Actions: ⋮ menu
- **Pagination**: "Showing 1 to 20 of 1,247 results" + page navigation

## 🎨 **UI/UX Design System**

### **Color Palette**:
- **Primary**: Dark blue/navy (#2D3748, #1A202C)
- **Secondary**: Light gray (#F7FAFC, #EDF2F7)
- **Accent**: Blue (#3182CE), Purple gradients
- **Success**: Green (#38A169)
- **Warning**: Orange (#DD6B20)
- **Danger**: Red (#E53E3E)

### **Typography**:
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold (600-700)
- **Body**: Regular (400), Medium (500)
- **Sizes**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### **Component Patterns**:
- **Cards**: Rounded corners, subtle shadows, white background
- **Buttons**: Rounded (6px), full-width for primary actions
- **Forms**: Clean inputs with proper spacing and validation
- **Navigation**: Consistent header with logo + nav links + user menu
- **Modals**: Centered overlays with backdrop
- **Tables**: Zebra striping, hover effects, sorting indicators

### **Layout System**:
- **Grid**: CSS Grid and Flexbox
- **Spacing**: 4px, 8px, 16px, 24px, 32px, 48px system
- **Breakpoints**: Mobile-first responsive design
- **Max Width**: 1200px container with centered content

## 🛠️ **Tech Stack**

### **Frontend Stack:**
```typescript
// Core Framework
React 18 + TypeScript + Vite

// Styling & UI
Tailwind CSS + Lucide Icons + Chart.js

// PDF & Media
@react-pdf-viewer/core + react-youtube + react-chartjs-2

// Real-time & Communication
socket.io-client + simple-peer (WebRTC)

// State & Routing
React Context + React Router v6 + axios
```

### **Backend Stack:**
```javascript
// Runtime & Framework
Node.js 20+ + Express.js + Socket.IO

// Database & ODM
MongoDB + Mongoose + GridFS

// Authentication & Security
Firebase Admin + JWT + bcrypt + helmet

// File & Storage
Multer + Google Cloud Storage + compression

// Development & Monitoring
Winston (logging) + express-rate-limit + CORS
```

### **AI & ML Services:**
```python
# AI Framework
Python 3.11 + FastAPI + uvicorn

# LLM Integration
OpenAI GPT API + Google Gemini + Perplexity API

# Vector Database
ChromaDB + sentence-transformers

# PDF Processing
PyPDF2 + pdfminer.six + pytesseract (OCR)

# Dependencies
pandas + numpy + requests + python-dotenv
```

### **Development & DevOps:**
```yaml
# Development
Docker + Docker Compose + nodemon + Vite HMR

# Version Control
Git + GitHub + conventional commits

# Code Quality
ESLint + TypeScript + Prettier

# Documentation
Markdown + comprehensive guides
```

## 📁 **Project Structure**

```
Axiona/                        ← Root directory
├── 📱 client/                 ← React Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/        ← 50+ reusable UI components
│   │   ├── pages/             ← Route-level page components
│   │   ├── contexts/          ← React Context providers
│   │   ├── services/          ← API integrations & external services
│   │   ├── hooks/             ← Custom React hooks
│   │   ├── utils/             ← Helper functions & utilities
│   │   └── styles/            ← Tailwind CSS configurations
│   └── package.json           ← Frontend dependencies
│
├── 🖥️ server/                 ← Node.js Backend (Express + MongoDB)
│   ├── src/
│   │   ├── controllers/       ← API route handlers
│   │   ├── models/            ← MongoDB schemas & models
│   │   ├── routes/            ← Express route definitions
│   │   ├── services/          ← Business logic & external services
│   │   ├── middleware/        ← Auth, validation, rate limiting
│   │   ├── config/            ← Database, Firebase, storage configs
│   │   └── scripts/           ← Database seeding & utility scripts
│   └── package.json           ← Backend dependencies
│
├── 🤖 mcp-rag-system/         ← AI RAG Pipeline (Python + FastAPI)
│   ├── core/                  ← MongoDB & ChromaDB managers
│   │   ├── mongodb_manager.py ← Database operations
│   │   └── chroma_manager.py  ← Vector search management
│   ├── scripts/               ← Data ingestion & processing
│   │   ├── main_reference_textbook_ingest.py  ← Primary ingestion
│   │   └── simple_ingest.py   ← Basic utilities
│   ├── test/                  ← Comprehensive testing suite
│   ├── chromadb/              ← Vector database storage
│   ├── main.py                ← FastAPI application entry
│   └── requirements.txt       ← Python dependencies
│
├── 📊 META_dataretreval/      ← Metadata Processing Pipeline
│   ├── extract_metadata.py   ← PDF download & parsing
│   ├── generate_ai_metadata.py ← AI enhancement with Gemini
│   ├── batch_processor.py    ← Batch processing (100 PDFs)
│   ├── pipeline.py            ← Single processing pipeline
│   ├── books_data.json        ← Source data (100 books)
│   ├── batch_output/          ← Processing results
│   ├── github_refrences/      ← Downloaded PDFs
│   └── requirements.txt       ← Python dependencies
│
├── 📚 documentation/          ← Comprehensive Documentation
│   ├── INDEX.md               ← Documentation index
│   ├── IMPLEMENTATION_SUMMARY.md ← Current project status
│   ├── architecture/          ← System design docs
│   ├── backend/               ← Server implementation guides
│   ├── frontend/              ← Client development docs
│   └── features/              ← Feature-specific guides
│
├── 📄 docs/                   ← Additional Documentation
│   ├── api-spec.yaml          ← OpenAPI specification
│   ├── wireframes/            ← UI/UX design mockups
│   └── mind-map.png           ← Project overview diagram
│
├── 🐳 docker-compose.yml      ← Container orchestration
├── 📋 IMPLEMENTATION_STATUS.md ← Current implementation status
├── 🔧 INTEGRATION_SUMMARY.md  ← System integration overview
└── 📖 README.md               ← This file
```

### **Key Directories Explained:**

#### **Frontend (`/client`)**
- **Modern React 18** application with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, utility-first styling
- **50+ components** including PDF viewer, video player, chat interface
- **Real-time features** with Socket.IO and WebRTC

#### **Backend (`/server`)**
- **Express.js API** with comprehensive route handling
- **MongoDB integration** with Mongoose ODM
- **Firebase Authentication** with role-based access
- **Socket.IO server** for real-time communication
- **File upload/storage** with GridFS and cloud storage

#### **AI RAG System (`/mcp-rag-system`)**
- **Production-ready RAG pipeline** with ChromaDB
- **118 books** indexed with semantic search
- **Multiple LLM support** (OpenAI, Gemini, Perplexity)
- **Comprehensive testing** with real-world queries
- **Standardized ingestion** from MongoDB sources

#### **Metadata Processing (`/META_dataretreval`)**
- **AI-enhanced metadata** extraction from PDFs
- **Batch processing** of 100+ educational books
- **GitHub integration** for reference materials
- **OCR support** for image-based PDFs
- **Quality validation** and error handling

## ⚡ **Quick Start**

### **🎯 Prerequisites**
```bash
# Required Software
Node.js 20+          # Backend runtime
Python 3.11+         # AI services
MongoDB 6.0+         # Database (local or Atlas)
Git                  # Version control
```

### **🚀 Installation & Setup**

#### **1. Clone & Navigate**
```bash
git clone <repository-url>
cd Axiona
```

#### **2. Backend Setup**
```bash
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and API keys

# Start backend server
npm run dev          # Development with nodemon
# Backend runs on: http://localhost:5050
```

#### **3. Frontend Setup**
```bash
cd client
npm install

# Start development server
npm run dev          # Vite dev server with HMR
# Frontend runs on: http://localhost:5173
```

#### **4. AI RAG System Setup**
```bash
cd mcp-rag-system
pip install -r requirements.txt

# Configure AI services
cp .env.example .env
# Add your OpenAI, Gemini API keys

# Initialize vector database
python scripts/main_reference_textbook_ingest.py

# Start AI services
python main.py       # FastAPI server
# AI services run on: http://localhost:8000
```

#### **5. Metadata Processing (Optional)**
```bash
cd META_dataretreval
pip install -r requirements.txt

# Process book metadata
python pipeline.py   # Process individual books
python batch_processor.py  # Batch process 100+ books
```

### **🐳 Docker Setup (Alternative)**
```bash
# Run all services with Docker
docker-compose up -d

# Services will be available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:5050
# AI Services: http://localhost:8000
# MongoDB: localhost:27017
```

### **📊 Database Initialization**
```bash
# Navigate to server directory
cd server

# Seed the database with sample data
npm run seed

# This will populate:
# - 118 educational books
# - 100+ tutorial videos
# - Sample users and content
```

### **✅ Verification**
1. **Frontend**: Visit http://localhost:5173 - should see landing page
2. **Backend**: Visit http://localhost:5050/api/health - should return OK
3. **Database**: Check MongoDB has `study-ai` database with collections
4. **AI Services**: Visit http://localhost:8000/docs - should see FastAPI docs

## � **Documentation**

### **📖 Comprehensive Guides**
All detailed documentation is organized in the [`/documentation`](./documentation/) folder:

- **[📋 Documentation Index](./documentation/INDEX.md)** - Complete guide to all documentation
- **[🎯 Implementation Summary](./documentation/IMPLEMENTATION_SUMMARY.md)** - Current project status
- **[🏗️ Architecture Docs](./documentation/architecture/)** - System design and tech decisions
- **[⚙️ Backend Guides](./documentation/backend/)** - Server implementation and API docs
- **[🎨 Frontend Docs](./documentation/frontend/)** - Component library and UI guides
- **[✨ Feature Guides](./documentation/features/)** - Specific feature implementations

### **🚀 Quick Reference Links**
- **[Backend Recovery Guide](./documentation/backend/BACKEND_RECOVERY_GUIDE.md)** - Rebuild backend from scratch
- **[Component Library](./documentation/frontend/COMPONENT_LIBRARY.md)** - React component documentation
- **[Firebase Auth Setup](./documentation/backend/AUTH_SYSTEM_GUIDE.md)** - Authentication system guide
- **[Video Conference Architecture](./documentation/architecture/VIDEO_CONFERENCE_ARCHITECTURE.md)** - WebRTC implementation
- **[PDF Highlight System](./documentation/features/PDF_HIGHLIGHT_SYSTEM.md)** - PDF viewing and annotations
- **[RAG System README](./mcp-rag-system/README.md)** - AI RAG pipeline documentation

### **📊 Implementation Status**
- **[Current Status](./IMPLEMENTATION_STATUS.md)** - Latest implementation progress
- **[Integration Summary](./INTEGRATION_SUMMARY.md)** - System integration overview
- **[RAG Implementation](./mcp-rag-system/IMPLEMENTATION_SUMMARY.md)** - AI system status

## 🎨 **UI/UX Components**

### **🎨 Design System**
```css
/* Color Palette */
Primary: #2D3748, #1A202C (Dark Blue/Navy)
Secondary: #F7FAFC, #EDF2F7 (Light Gray)
Accent: #3182CE (Blue), Purple Gradients
Success: #38A169 (Green)
Warning: #DD6B20 (Orange)
Danger: #E53E3E (Red)

/* Typography */
Font: Inter (Google Fonts)
Headings: 600-700 weight
Body: 400 regular, 500 medium
Sizes: 12px, 14px, 16px, 18px, 24px, 32px, 48px
```

### **🧩 Component Library**
- **📄 PDF Viewer**: Full-featured PDF display with annotations
- **📹 Video Player**: YouTube integration with progress tracking
- **💬 Chat Interface**: Real-time messaging with Socket.IO
- **📊 Analytics Dashboard**: Chart.js visualizations
- **🔍 Search Components**: Smart filtering with AI recommendations
- **📝 Note Editor**: Rich text editing with auto-save
- **🎮 Quiz System**: Interactive assessment components
- **👥 User Management**: Authentication and profile components

### **📱 Page Components**
1. **Landing Page**: Hero section, feature cards, responsive layout
2. **Authentication**: Login/register with social OAuth
3. **Dashboard**: Progress tracking, analytics, personalized content
4. **Study Materials**: PDF library with smart search and filtering
5. **Tutorial Hub**: Video collection with curated playlists
6. **Conference Lobby**: Meeting room creation and management
7. **Active Meeting**: Video grid, chat panel, screen sharing
8. **Workspace**: AI-powered study environment with floating transfer
9. **Profile Settings**: Account management and preferences
10. **Admin Panel**: User management, content moderation, analytics

## 🌟 **Business Value & Impact**

### **For Students**
- **📚 Comprehensive Library**: Access to 118 textbooks + 100+ videos
- **🤖 AI Study Buddy**: Context-aware assistance with RAG-powered responses
- **🎯 Personalized Learning**: AI-generated roadmaps based on goals and progress
- **👥 Collaborative Study**: Real-time video sessions with up to 200 participants
- **📊 Progress Tracking**: Detailed analytics and learning streak monitoring

### **For Educators & Institutions**
- **📈 Learning Analytics**: Comprehensive student progress monitoring
- **💼 Content Management**: Easy upload and organization of study materials
- **🔍 Smart Search**: Vector-based semantic search across all content
- **⚡ Scalable Platform**: Production-ready architecture with modern tech stack
- **🔐 Secure Access**: Firebase authentication with role-based permissions

### **Technical Excellence**
- **🚀 Performance**: Optimized React app with lazy loading and code splitting
- **📱 Responsive**: Mobile-first design with excellent user experience
- **🔒 Security**: JWT authentication, rate limiting, and data protection
- **🌐 Scalability**: Microservices architecture with independent scaling
- **📊 Monitoring**: Comprehensive logging and error tracking

## 🗺️ **Development Roadmap**

### **✅ Phase 1: Foundation (Completed)**
- Core MERN stack implementation
- Firebase authentication system
- PDF viewing with advanced features
- Basic AI integration
- Real-time video conferencing

### **✅ Phase 2: AI Enhancement (Completed)**
- RAG system with ChromaDB
- AI-powered metadata enhancement
- Semantic search capabilities
- Context-aware study assistant
- Floating workspace system

### **🚧 Phase 3: Optimization (In Progress)**
- Performance optimization
- Mobile app development
- Advanced analytics dashboard
- Enhanced collaboration features
- Production deployment automation

### **📋 Phase 4: Advanced Features (Planned)**
- Multi-language support
- Advanced AI tutoring
- Gamification elements
- Third-party integrations
- Enterprise features

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Standards**
- **Frontend**: TypeScript + ESLint + Prettier
- **Backend**: Node.js + ESLint + conventional commits
- **AI Services**: Python + Black + type hints
- **Documentation**: Markdown with clear structure

## 📞 **Support & Contact**

- **📧 Email**: support@axiona.edu
- **📱 Discord**: [Join our community](https://discord.gg/axiona)
- **🐛 Issues**: [GitHub Issues](https://github.com/username/axiona/issues)
- **📖 Docs**: [Documentation Portal](./documentation/INDEX.md)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 **Acknowledgments**

- **React Team** for the amazing framework
- **OpenAI & Google** for AI API services
- **MongoDB** for the robust database platform
- **Firebase** for authentication services
- **Open Source Community** for incredible libraries and tools

---

<div align="center">

**🎓 Axiona - Empowering Education Through AI**

*Built with ❤️ using MERN Stack + Python + AI*

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)

**Status**: ✅ Production Ready | **Last Updated**: November 2, 2025

</div>
