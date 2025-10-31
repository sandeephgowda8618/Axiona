# Frontend Components and Features Mapping

## Overview
This document provides detailed mapping of all React components, their functionality, dependencies, and relationships in the Axiona study platform frontend.

---

## 🎯 Component Hierarchy and Relationships

```
App.tsx
├── Layout.tsx
│   ├── LandingNavigation.tsx
│   └── [Page Components]
├── AuthGuard.tsx
└── FloatingWorkspaceButton.tsx
```

---

## 📱 Page Components Detailed Mapping

### 🏠 Landing & Authentication Pages

#### `LandingPage.tsx`
**Functionality:**
- Hero section with app introduction
- Feature highlights and benefits
- Call-to-action buttons
- Responsive design showcase

**Dependencies:**
- No external contexts
- Pure presentational component
- Uses react-router for navigation

**State Management:**
- Local state for UI interactions
- No global state dependencies

**API Calls:** None

**Used CSS:** Tailwind classes, custom animations

---

#### `LoginPage.tsx`
**Functionality:**
- Firebase authentication integration
- Login and registration forms
- Social authentication (Google, etc.)
- Error handling and validation

**Dependencies:**
- `AuthContext` for authentication state
- Firebase SDK for auth operations
- React Router for navigation

**State Management:**
```typescript
// Local state
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState('')

// Context state
const { login, register, user, isAuthenticated } = useAuth()
```

**API Calls:**
- Firebase Authentication API
- Custom `/api/auth/login`
- Custom `/api/auth/register`

---

### 📊 Dashboard & Main Application Pages

#### `Dashboard.tsx`
**Functionality:**
- User statistics and analytics
- Quick access to main features
- Recent activity display
- Progress tracking

**Dependencies:**
- `AuthContext` for user data
- `NotesContext` for recent notes
- API service for statistics

**State Management:**
```typescript
const [stats, setStats] = useState({
  totalNotes: 0,
  totalHighlights: 0,
  studyTime: 0,
  booksRead: 0
})
const [recentActivity, setRecentActivity] = useState([])
```

**API Calls:**
- `GET /api/users/stats`
- `GET /api/notes?recent=true`
- `GET /api/users/progress`

---

#### `StudyPES.tsx`
**Functionality:**
- Subject selection and browsing
- PDF material listing by subject
- Search and filter capabilities
- Navigation to SubjectViewer

**Dependencies:**
- API service for PDF materials
- React Router for navigation
- SubjectCard component

**State Management:**
```typescript
const [subjects, setSubjects] = useState([])
const [selectedSubject, setSelectedSubject] = useState('')
const [pdfs, setPdfs] = useState([])
const [loading, setLoading] = useState(true)
const [searchTerm, setSearchTerm] = useState('')
```

**API Calls:**
- `GET /api/pdfs` (all subjects)
- `GET /api/pdfs/subject/:subject`

**Components Used:**
- `SubjectCard.tsx` for subject display

---

#### `SubjectViewer.tsx` ⭐ **Core PDF Viewer**
**Functionality:**
- Full-featured PDF viewer with react-pdf-viewer
- Text highlighting and annotation
- Note creation and management
- Bookmark functionality
- Search within PDF
- Zoom and navigation controls
- Progress tracking

**Dependencies:**
- Multiple react-pdf-viewer plugins
- `AuthContext` for user identification
- `NotesContext` for note management
- API service for highlights and notes

**State Management:**
```typescript
// PDF viewer state
const [selectedPdf, setSelectedPdf] = useState(null)
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(0)
const [highlights, setHighlights] = useState([])

// Annotation state
const [isAnnotationMode, setIsAnnotationMode] = useState(false)
const [selectedColor, setSelectedColor] = useState('#FFEB3B')

// Notes modal state
const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
const [noteText, setNoteText] = useState('')
const [noteTitle, setNoteTitle] = useState('')
const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 })
const [modalSize, setModalSize] = useState({ width: 380, height: 280 })
```

**React PDF Viewer Plugins:**
```typescript
const bookmarkPluginInstance = bookmarkPlugin()
const searchPluginInstance = searchPlugin()
const zoomPluginInstance = zoomPlugin()
const pageNavigationPluginInstance = pageNavigationPlugin()
const highlightPluginInstance = highlightPlugin()
const defaultLayoutPluginInstance = defaultLayoutPlugin()
```

**API Calls:**
- `GET /api/pdfs/:id`
- `GET /api/pdfs/file/:gridFSFileId`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `POST /api/highlights`
- `GET /api/highlights/pdf/:pdfId`

---

#### `Library.tsx` ⭐ **Digital Library**
**Functionality:**
- Book browsing and search
- Category and subject filtering
- Grid and list view toggle
- Book details display
- Navigation to BookReader

**Dependencies:**
- API service for books
- React Router for navigation
- Loading and error states

**State Management:**
```typescript
const [books, setBooks] = useState([])
const [filteredBooks, setFilteredBooks] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Filter and search state
const [searchTerm, setSearchTerm] = useState('')
const [selectedCategory, setSelectedCategory] = useState('all')
const [selectedSubject, setSelectedSubject] = useState('all')
const [sortBy, setSortBy] = useState('title')
const [viewMode, setViewMode] = useState('grid')
```

**Features:**
- Real-time search filtering
- Category-based filtering
- Sorting by multiple criteria
- Responsive grid/list layouts
- Book download tracking

**API Calls:**
- `GET /api/books`
- `GET /api/books/search?q=term`
- `POST /api/books/:id/download`

---

#### `BookReader.tsx` ⭐ **Library Book Viewer**
**Functionality:**
- Full-featured PDF viewer for library books
- Same annotation features as SubjectViewer
- Notes creation and management
- Download and sharing options
- Navigation back to library

**Dependencies:**
- Same PDF viewer plugins as SubjectViewer
- `AuthContext` and `NotesContext`
- React Router state for book data

**State Management:**
```typescript
// Identical to SubjectViewer for consistency
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(0)
const [isAnnotationMode, setIsAnnotationMode] = useState(false)
const [selectedColor, setSelectedColor] = useState('#FFEB3B')

// Notes modal (matching SubjectViewer exactly)
const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
const [noteText, setNoteText] = useState('')
const [noteTitle, setNoteTitle] = useState('')
const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 })
const [modalSize, setModalSize] = useState({ width: 380, height: 280 })
```

**API Calls:**
- `POST /api/notes`
- File serving: `/docs/library/:fileName`

---

#### `MyRack.tsx` ⭐ **User Content Management**
**Functionality:**
- Display all user notes
- Search and filter notes
- Edit and delete notes
- Progress tracking
- Bookmark management

**Dependencies:**
- `AuthContext` for user identification
- `NotesContext` for note management
- API service for CRUD operations

**State Management:**
```typescript
const [notes, setNotes] = useState([])
const [filteredNotes, setFilteredNotes] = useState([])
const [searchTerm, setSearchTerm] = useState('')
const [selectedTag, setSelectedTag] = useState('all')
const [sortBy, setSortBy] = useState('createdAt')
const [loading, setLoading] = useState(true)
```

**API Calls:**
- `GET /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/notes/search?q=term`

---

### 👤 User Management Pages

#### `ProfilePage.tsx`
**Functionality:**
- User profile display and editing
- Avatar upload and management
- Personal information updates
- Account statistics

**Dependencies:**
- `AuthContext` for user data
- Firebase for profile updates
- File upload for avatar

**State Management:**
```typescript
const [profile, setProfile] = useState({
  fullName: '',
  email: '',
  avatar: '',
  bio: ''
})
const [isEditing, setIsEditing] = useState(false)
const [avatarFile, setAvatarFile] = useState(null)
```

**API Calls:**
- `GET /api/users/profile`
- `PUT /api/users/profile`
- Firebase Storage for avatar upload

---

#### `SettingsPage.tsx`
**Functionality:**
- Application preferences
- Theme selection
- Notification settings
- Account management
- Data export/import

**Dependencies:**
- `AuthContext` for user context
- Local storage for preferences
- API for settings persistence

**State Management:**
```typescript
const [settings, setSettings] = useState({
  theme: 'light',
  language: 'English',
  emailNotifications: true,
  pushNotifications: false,
  studyReminderEnabled: true,
  studyReminderTime: '09:00',
  studyReminderFrequency: 'Daily'
})
```

**API Calls:**
- `POST /api/users/preferences`
- `GET /api/users/export-data`

---

### 🎥 Communication Pages

#### `ConferencePage.tsx`
**Functionality:**
- Video conferencing interface
- Meeting room management
- Screen sharing capabilities
- Chat functionality

**Dependencies:**
- WebRTC for video/audio
- Socket.io for real-time communication
- `AuthContext` for user identification

**State Management:**
```typescript
const [isInMeeting, setIsInMeeting] = useState(false)
const [participants, setParticipants] = useState([])
const [isVideoEnabled, setIsVideoEnabled] = useState(true)
const [isAudioEnabled, setIsAudioEnabled] = useState(true)
const [isScreenSharing, setIsScreenSharing] = useState(false)
```

---

## 🧩 Reusable Components

### 🧭 Layout & Navigation

#### `Layout.tsx`
**Functionality:**
- App-wide layout wrapper
- Navigation integration
- Main content area
- Responsive design

**Props:**
```typescript
interface LayoutProps {
  children: React.ReactNode
  className?: string
  showNavigation?: boolean
}
```

**Used By:** All main pages

---

#### `LandingNavigation.tsx`
**Functionality:**
- Top navigation bar
- User menu dropdown
- Authentication status display
- Route navigation

**Dependencies:**
- `AuthContext` for user state
- React Router for navigation

**State:**
```typescript
const [isMenuOpen, setIsMenuOpen] = useState(false)
const [showUserMenu, setShowUserMenu] = useState(false)
```

---

#### `FloatingWorkspaceButton.tsx`
**Functionality:**
- Floating action button for workspace
- Content preview
- Quick access to features
- Progress indication

**Props:**
```typescript
interface FloatingWorkspaceButtonProps {
  content: {
    id: string
    title: string
    type: 'pdf' | 'book'
    url: string
    currentPage?: number
    progress?: number
  }
  isVisible?: boolean
}
```

---

### 🔐 Authentication Components

#### `AuthGuard.tsx`
**Functionality:**
- Route protection
- Authentication verification
- Redirect to login if needed
- Loading state management

**Props:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}
```

**Logic:**
```typescript
const { isAuthenticated, loading } = useAuth()

if (loading) return <LoadingSpinner />
if (requireAuth && !isAuthenticated) return <Navigate to="/login" />
return <>{children}</>
```

---

### 📚 StudyPES Components

#### `SubjectCard.tsx`
**Functionality:**
- Individual subject display
- Click handling for navigation
- Progress indication
- Statistics display

**Props:**
```typescript
interface SubjectCardProps {
  subject: {
    id: string
    name: string
    description: string
    pdfCount: number
    progress?: number
  }
  onClick: (subjectId: string) => void
}
```

---

## 🎯 Context Providers Detailed

### 🔐 AuthContext (`/client/src/contexts/AuthContext.tsx`)

**Purpose:** Global authentication state management

**State:**
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
```

**Methods:**
```typescript
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}
```

**Firebase Integration:**
- `onAuthStateChanged` listener
- Token management
- Automatic user sync

**Used By:**
- All protected pages
- Navigation components
- API service for authentication headers

---

### 📝 NotesContext (`/client/src/contexts/NotesContext.tsx`)

**Purpose:** Global notes state management and synchronization

**State:**
```typescript
interface NotesState {
  notes: Note[]
  loading: boolean
  error: string | null
  refreshTrigger: number
}
```

**Methods:**
```typescript
interface NotesContextType extends NotesState {
  createNote: (noteData: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  getNotesByPdf: (pdfId: string) => Note[]
  triggerRefresh: () => void
}
```

**Used By:**
- `SubjectViewer.tsx`
- `BookReader.tsx`
- `MyRack.tsx`
- Notes creation flows

---

## 🎨 Styling and CSS Architecture

### 🎯 Tailwind Configuration (`tailwind.config.js`)
```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  },
  plugins: []
}
```

### 📄 PDF Viewer Styles (`/client/src/styles/pdf-viewer.css`)
**Custom overrides for react-pdf-viewer:**
- Toolbar hiding/customization
- Annotation styling
- Modal positioning
- Responsive design
- Dark/light theme support

### ⚙️ Settings Styles (`/client/src/styles/settings.css`)
**Settings page specific styles:**
- Form layouts
- Toggle switches
- Modal styling
- Responsive forms

---

## 🔧 Custom Hooks

### 🔐 useAuth Hook (`/client/src/hooks/useAuth.ts`)
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 📝 useNotes Hook (`/client/src/hooks/useNotes.ts`)
```typescript
export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider')
  }
  return context
}
```

---

## 📊 Component Performance Optimization

### React.memo Usage
- `SubjectCard.tsx` - Memoized for list rendering
- `NoteItem.tsx` - Prevents unnecessary re-renders
- `FloatingWorkspaceButton.tsx` - Optimized for frequent updates

### useMemo and useCallback
- Search filtering in `Library.tsx`
- Note filtering in `MyRack.tsx`
- PDF viewer event handlers

### Lazy Loading
- PDF viewer plugins loaded on demand
- Route-based code splitting
- Image lazy loading for book covers

---

## 🔄 Data Flow Patterns

### 📖 PDF Viewing Flow
```
Page Component → PDF Viewer → Annotation → Notes Context → API → Database
```

### 📝 Notes Management Flow
```
User Action → Notes Context → API Service → Backend → Database → UI Update
```

### 🔐 Authentication Flow
```
Login Form → Auth Context → Firebase → Backend Verification → Route Protection
```

---

*Last Updated: October 31, 2025*
*This document provides complete frontend component mapping for cleanup and optimization*
