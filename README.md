# 🎓 Study-AI Mini - Comprehensive Learning Platform

A modern, AI-powered study platform built with React 18 + Vite + Tailwind CSS, featuring video conferencing, interactive quizzes, note-taking, and personalized learning experiences.

## 📋 **Table of Contents**
- [Project Overview](#project-overview)
- [Documentation](#documentation)
- [Page Components Analysis](#page-components-analysis)
- [UI/UX Design System](#uiux-design-system)
- [Feature Requirements](#feature-requirements)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)

## 📚 **Documentation**

For comprehensive documentation, please refer to the [`documentation/`](./documentation/) folder:

- **[📖 Documentation Index](./documentation/INDEX.md)** - Complete guide to all documentation
- **[🏗️ Architecture](./documentation/architecture/)** - System design and tech stack
- **[⚙️ Backend](./documentation/backend/)** - Server-side implementation guides
- **[🎨 Frontend](./documentation/frontend/)** - Client-side development docs
- **[✨ Features](./documentation/features/)** - Specific feature implementations
- **[📊 Implementation Summary](./documentation/IMPLEMENTATION_SUMMARY.md)** - Current project status

For quick setup, see [Getting Started](#getting-started) below.

## 🎯 **Project Overview**

Study-AI Mini is a comprehensive learning management system that combines traditional study materials with modern AI-powered features, real-time collaboration, and interactive assessments.

### **Core Features:**
- 🤖 AI-powered study assistant and chatbot
- 📹 Video conferencing for collaborative study sessions  
- 📝 Interactive quiz system with JEE-style questions
- 📚 PDF and video content management
- 🗒️ Personal note-taking and organization system
- 👥 User management and progress tracking
- 📊 Analytics dashboard for administrators

## 📱 **Page Components Analysis**

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

## ⚙️ **Feature Requirements**

### **Authentication & User Management**:
- Email/password + social OAuth (Google, GitHub)
- Role-based access (Student, Admin, Moderator)
- Profile management with progress tracking
- Session management and security

### **Study Content System**:
- PDF viewer with bookmarking and annotations
- Video streaming with progress tracking
- Note-taking with auto-save and organization
- Search and filtering across all content types

### **Interactive Learning**:
- AI-powered chatbot with context awareness
- Quiz generation and assessment system
- Progress tracking and analytics
- Personalized learning recommendations

### **Collaboration Features**:
- Video conferencing with WebRTC
- Real-time chat and screen sharing
- Study room creation and management
- Collaborative note-taking

### **Admin Dashboard**:
- User management and analytics
- Content upload and moderation
- System monitoring and reporting
- Bulk operations and data export

## 🛠️ **Tech Stack**

### **Frontend**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Context API + React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives
- **Charts**: Chart.js for analytics visualization

### **Backend**:
- **Runtime**: Node.js 20+ with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Firebase Auth
- **File Storage**: Google Cloud Storage
- **Caching**: Redis for session management
- **Rate Limiting**: Express rate limit with Redis

### **AI Service**:
- **Framework**: Python 3.11 + FastAPI
- **AI/ML**: OpenAI GPT API for chat functionality
- **Vector DB**: Embeddings for content search
- **PDF Processing**: PyPDF2 for text extraction

### **Real-time Features**:
- **WebRTC**: Simple-peer for video conferencing
- **WebSockets**: Socket.io for real-time chat
- **Signaling**: Custom signaling server

### **DevOps & Deployment**:
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Render/Railway
- **Database**: MongoDB Atlas
- **CDN**: Cloudflare for static assets

## 📁 **Project Structure**

```
study-ai-mini/                 ← repo root
├── client/                    ← React 18 + Vite + Tailwind
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/               ← axios instances + interceptors
│   │   ├── components/        ← reusable UI blocks
│   │   ├── contexts/          ← React Context providers
│   │   ├── hooks/             ← custom React hooks
│   │   ├── pages/             ← route-level components
│   │   ├── styles/            ← Tailwind CSS
│   │   └── utils/             ← helper functions
│   └── package.json
├── server/                    ← Node.js + Express API
│   ├── src/
│   │   ├── config/            ← database, auth, storage configs
│   │   ├── controllers/       ← route handlers
│   │   ├── middleware/        ← auth, validation, rate limiting
│   │   ├── models/            ← MongoDB schemas
│   │   ├── routes/            ← API endpoints
│   │   ├── services/          ← business logic
│   │   └── utils/             ← utilities
│   └── package.json
├── ai-service/                ← Python FastAPI
│   ├── routers/               ← API endpoints
│   ├── services/              ← AI/ML logic
│   └── requirements.txt
├── admin-cli/                 ← helper scripts
├── docs/                      ← wireframes + API docs
└── docker-compose.yml         ← local development
```

## 🚀 **Getting Started**

### **Prerequisites**:
- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### **Installation**:

1. **Clone the repository**:
```bash
git clone <repository-url>
cd study-ai-mini
```

2. **Install dependencies**:
```bash
# Frontend
cd client && npm install

# Backend  
cd ../server && npm install

# AI Service
cd ../ai-service && pip install -r requirements.txt
```

3. **Environment Setup**:
```bash
# Copy environment files
cp server/.env.example server/.env
# Edit with your configuration
```

4. **Run with Docker**:
```bash
docker-compose up -d
```

5. **Or run individually**:
```bash
# Terminal 1 - Frontend
cd client && npm run dev

# Terminal 2 - Backend
cd server && npm run dev

# Terminal 3 - AI Service  
cd ai-service && python main.py
```

### **Access Points**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Built with ❤️ using MERN + Python + WebRTC**

## 📚 **Documentation**

All comprehensive documentation has been organized in the `/documentation` folder:

- **[Documentation Index](documentation/README.md)** - Complete guide to all documentation
- **Architecture & Tech Stack** - System design and technology decisions
- **Backend Implementation** - Complete backend setup and API documentation
- **Frontend Components** - UI components and page implementation guides
- **Features & Integrations** - Specific feature documentation (PDF system, video conferencing, etc.)

### Quick Links:
- 🚀 **[Backend Recovery Guide](documentation/backend/BACKEND_RECOVERY_GUIDE.md)** - Rebuild the backend from scratch
- 🎨 **[Component Library](documentation/frontend/COMPONENT_LIBRARY.md)** - Frontend component documentation
- 🔐 **[Authentication System](documentation/backend/AUTH_SYSTEM_GUIDE.md)** - Firebase auth setup
- 📹 **[Video Conference Architecture](documentation/architecture/VIDEO_CONFERENCE_ARCHITECTURE.md)** - WebRTC implementation
- 📄 **[PDF Highlight System](documentation/features/PDF_HIGHLIGHT_SYSTEM.md)** - PDF viewing and annotation
