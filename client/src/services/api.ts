// API Service for MongoDB Integration
// This file contains the structure for future backend integration

export interface UserProfile {
  id: string
  fullName: string
  email: string
  avatar?: string
  role: string
  coursesCompleted: number
  streakDays: number
  totalNotes: number
  weeklyActivity: string
  joinedDate: string
  lastActive: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    language: string
  }
}

export interface LearningRoadmapItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'locked' | 'available'
  progress: number
  estimatedTime: string
  category: string
  prerequisites: string[]
  skills: string[]
}

export interface ActivityData {
  date: string
  studyHours: number
  notesCreated: number
  videosWatched: number
  quizzesCompleted: number
}

export interface AuthResponse {
  token: string
  user: UserProfile
  refreshToken: string
}

export interface AuthRequest {
  email: string
  password: string
  fullName?: string // For registration
}

// PDF/Study Materials interfaces
export interface PDFMaterial {
  _id: string
  topic: string
  fileName: string
  gridFSFileId: string
  fileUrl: string
  fileSize: number
  pages: number
  author?: string
  domain: string
  year?: number
  class?: string
  description?: string
  publishedAt: string
  downloadCount: number
  approved: boolean
  uploadedBy: string
  createdAt: string
  formattedFileSize?: string
}

export interface SubjectSummary {
  _id: string
  domain: string
  pdfCount: number
  totalDownloads: number
  avgPages: number
  lastUpdated: string
}

export interface HighlightPosition {
  pageNumber: number
  boundingRect: {
    x1: number
    y1: number
    x2: number
    y2: number
    width: number
    height: number
  }
  rects?: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    width: number
    height: number
  }>
  viewportDimensions?: {
    width: number
    height: number
  }
}

export interface Highlight {
  _id: string
  pdfId: string
  userId: string
  content: {
    text: string
    image?: string
  }
  position: HighlightPosition
  style: {
    color: string
    opacity: number
  }
  note?: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface Note {
  _id: string
  title: string
  content: string
  pdfId: string
  userId: string
  pdfTitle: string
  pageNumber?: number
  tags: string[]
  lastViewedAt: string
  createdAt: string
  updatedAt: string
  pdfId_populated?: PDFMaterial
  userId_populated?: UserProfile
}

export interface CreateNoteRequest {
  title: string
  content: string
  pdfId: string
  userId: string
  pageNumber?: number
  tags?: string[]
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  tags?: string[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  message?: string
}

export interface Subject {
  domain: string
  title: string
  pdfCount: number
  totalPages: number
  totalDownloads: number
  averagePages: number
  topicCount: number
  thumbnailUrl: string
  lastUpdated: string
  description: string
}

// API Service Class
class ApiService {
  private baseURL: string
  private token: string | null

  constructor() {
    this.baseURL = 'http://localhost:5050/api' // Updated to match your server port
    this.token = localStorage.getItem('auth_token')
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  // Authentication APIs
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    })
    
    if (!response.ok) {
      throw new Error('Login failed')
    }
    
    const data = await response.json()
    this.token = data.token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    
    return data
  }

  async register(userData: AuthRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      throw new Error('Registration failed')
    }
    
    const data = await response.json()
    this.token = data.token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    
    return data
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    
    this.token = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  // Profile APIs
  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }
    
    return response.json()
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update profile')
    }
    
    return response.json()
  }

  // Learning Roadmap APIs
  async getLearningRoadmap(): Promise<LearningRoadmapItem[]> {
    const response = await fetch(`${this.baseURL}/users/roadmap`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch roadmap')
    }
    
    return response.json()
  }

  async updateRoadmapProgress(itemId: string, progress: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/roadmap/${itemId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ progress })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update progress')
    }
  }

  // Activity APIs
  async getActivityData(timeRange: '7d' | '30d' | '90d' = '7d'): Promise<ActivityData[]> {
    const response = await fetch(`${this.baseURL}/users/activity?range=${timeRange}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity data')
    }
    
    return response.json()
  }

  async logActivity(activity: Partial<ActivityData>): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/activity`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(activity)
    })
    
    if (!response.ok) {
      throw new Error('Failed to log activity')
    }
  }

  // OAuth APIs
  async googleAuth(token: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/google`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token })
    })
    
    if (!response.ok) {
      throw new Error('Google authentication failed')
    }
    
    const data = await response.json()
    this.token = data.token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    
    return data
  }

  async githubAuth(code: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/github`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ code })
    })
    
    if (!response.ok) {
      throw new Error('GitHub authentication failed')
    }
    
    const data = await response.json()
    this.token = data.token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    
    return data
  }

  // PDF/Study Materials APIs
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await fetch(`${this.baseURL}/pdfs/subjects`, {
        headers: this.getHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch subjects')
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      // Return mock data if backend is not available
      console.warn('Backend not available, using mock data for subjects')
      return this.getMockSubjects()
    }
  }

  private getMockSubjects(): Subject[] {
    return [
      {
        domain: 'computer-science',
        title: 'Computer Science',
        pdfCount: 45,
        totalPages: 1250,
        totalDownloads: 2350,
        averagePages: 28,
        topicCount: 12,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-15',
        description: 'Comprehensive collection of computer science materials including algorithms, data structures, and programming concepts.'
      },
      {
        domain: 'mathematics',
        title: 'Mathematics',
        pdfCount: 38,
        totalPages: 980,
        totalDownloads: 1840,
        averagePages: 26,
        topicCount: 10,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-12',
        description: 'Mathematical foundations covering calculus, linear algebra, discrete mathematics, and statistical analysis.'
      },
      {
        domain: 'physics',
        title: 'Physics',
        pdfCount: 32,
        totalPages: 750,
        totalDownloads: 1290,
        averagePages: 23,
        topicCount: 8,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-10',
        description: 'Physics concepts from classical mechanics to quantum physics and thermodynamics.'
      },
      {
        domain: 'chemistry',
        title: 'Chemistry',
        pdfCount: 28,
        totalPages: 650,
        totalDownloads: 1120,
        averagePages: 23,
        topicCount: 7,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-08',
        description: 'Organic, inorganic, and physical chemistry materials with lab procedures and theory.'
      },
      {
        domain: 'electronics',
        title: 'Electronics Engineering',
        pdfCount: 35,
        totalPages: 920,
        totalDownloads: 1670,
        averagePages: 26,
        topicCount: 9,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-14',
        description: 'Circuit analysis, digital electronics, microprocessors, and communication systems.'
      },
      {
        domain: 'mechanical',
        title: 'Mechanical Engineering',
        pdfCount: 30,
        totalPages: 800,
        totalDownloads: 1450,
        averagePages: 27,
        topicCount: 8,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-11',
        description: 'Thermodynamics, fluid mechanics, manufacturing processes, and machine design.'
      }
    ]
  }

  async getPDFsBySubject(domain: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<PDFMaterial>> {
    const response = await fetch(`${this.baseURL}/pdfs/subject/${domain}?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDFs for subject')
    }
    
    return response.json()
  }

  async getPDFDetails(id: string): Promise<PDFMaterial> {
    const response = await fetch(`${this.baseURL}/pdfs/${id}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF details')
    }
    
    const result = await response.json()
    return result.data
  }

  getPDFUrl(fileId: string): string {
    return `${this.baseURL}/pdfs/file/${fileId}`
  }

  async trackPDFDownload(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/pdfs/${id}/download`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to track download')
    }
  }

  async searchPDFs(query: string, domain?: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<PDFMaterial>> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (domain) {
      params.append('domain', domain)
    }
    
    const response = await fetch(`${this.baseURL}/pdfs/search?${params}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to search PDFs')
    }
    
    return response.json()
  }

  // PDF Highlights/Annotations APIs
  async getHighlights(pdfId: string, userId?: string): Promise<Highlight[]> {
    const url = new URL(`${this.baseURL}/highlights/pdf/${pdfId}`)
    if (userId) {
      url.searchParams.append('userId', userId)
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch highlights')
    }
    
    const result = await response.json()
    return result.data
  }

  async createHighlight(highlightData: Omit<Highlight, '_id' | 'createdAt' | 'updatedAt'>): Promise<Highlight> {
    const response = await fetch(`${this.baseURL}/highlights`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(highlightData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create highlight')
    }
    
    const result = await response.json()
    return result.data
  }

  async updateHighlight(id: string, updates: Partial<Highlight>): Promise<Highlight> {
    const response = await fetch(`${this.baseURL}/highlights/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update highlight')
    }
    
    const result = await response.json()
    return result.data
  }

  async deleteHighlight(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/highlights/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete highlight')
    }
  }

  async getUserHighlights(): Promise<Highlight[]> {
    const response = await fetch(`${this.baseURL}/highlights/my-rack`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch user highlights')
    }
    
    const result = await response.json()
    return result.data
  }

  // ==================== NOTES APIs ====================
  
  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    console.log('🌐 API: Creating note with data:', noteData);
    console.log('🔗 API: Using URL:', `${this.baseURL}/notes`);
    console.log('🔑 API: Using headers:', this.getHeaders());
    
    const response = await fetch(`${this.baseURL}/notes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(noteData)
    })
    
    console.log('📡 API: Response status:', response.status);
    console.log('📡 API: Response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API: Error response:', errorData);
      try {
        const errorJson = JSON.parse(errorData);
        throw new Error(errorJson.message || 'Failed to create note')
      } catch (parseError) {
        throw new Error(`Failed to create note: ${errorData}`)
      }
    }
    
    const data = await response.json()
    console.log('✅ API: Success response:', data);
    return data.data
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    console.log('🔍 API: Fetching notes for user:', userId);
    const response = await fetch(`${this.baseURL}/notes/user/${userId}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    console.log('📡 API: Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user notes')
    }
    
    const data = await response.json()
    console.log('📋 API: Received data:', data);
    console.log('📋 API: Notes count:', data.data?.length || 0);
    return data.data
  }

  async updateNote(noteId: string, updateData: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(`${this.baseURL}/notes/${noteId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update note')
    }
    
    const data = await response.json()
    return data.data
  }

  async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete note')
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Mock data for development
export const mockUserProfile: UserProfile = {
  id: '1',
  fullName: 'John Smith',
  email: 'john.smith@university.edu',
  role: 'Computer Science Student',
  coursesCompleted: 12,
  streakDays: 45,
  totalNotes: 234,
  weeklyActivity: '8.5h',
  joinedDate: '2024-08-15',
  lastActive: '2025-10-09',
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
}

export const mockLearningRoadmap: LearningRoadmapItem[] = [
  {
    id: '1',
    title: 'Python Fundamentals',
    description: 'Master basic Python programming concepts',
    status: 'completed',
    progress: 100,
    estimatedTime: '4 weeks',
    category: 'Programming',
    prerequisites: [],
    skills: ['Variables', 'Functions', 'Loops', 'Data Types']
  },
  {
    id: '2',
    title: 'Data Structures & Algorithms',
    description: 'Learn essential programming concepts',
    status: 'completed',
    progress: 100,
    estimatedTime: '6 weeks',
    category: 'Computer Science',
    prerequisites: ['Python Fundamentals'],
    skills: ['Arrays', 'Linked Lists', 'Trees', 'Sorting']
  },
  {
    id: '3',
    title: 'Machine Learning Basics',
    description: 'Introduction to ML concepts and algorithms',
    status: 'in-progress',
    progress: 65,
    estimatedTime: '8 weeks',
    category: 'AI/ML',
    prerequisites: ['Python Fundamentals', 'Data Structures & Algorithms'],
    skills: ['Regression', 'Classification', 'Feature Engineering']
  },
  {
    id: '4',
    title: 'Deep Learning',
    description: 'Advanced neural networks and AI',
    status: 'locked',
    progress: 0,
    estimatedTime: '10 weeks',
    category: 'AI/ML',
    prerequisites: ['Machine Learning Basics'],
    skills: ['Neural Networks', 'CNN', 'RNN', 'Transformers']
  }
]

export const mockActivityData: ActivityData[] = [
  { date: '2025-10-03', studyHours: 2.5, notesCreated: 3, videosWatched: 2, quizzesCompleted: 1 },
  { date: '2025-10-04', studyHours: 3.2, notesCreated: 5, videosWatched: 3, quizzesCompleted: 2 },
  { date: '2025-10-05', studyHours: 1.8, notesCreated: 2, videosWatched: 1, quizzesCompleted: 0 },
  { date: '2025-10-06', studyHours: 2.9, notesCreated: 4, videosWatched: 2, quizzesCompleted: 1 },
  { date: '2025-10-07', studyHours: 3.5, notesCreated: 6, videosWatched: 4, quizzesCompleted: 3 },
  { date: '2025-10-08', studyHours: 1.2, notesCreated: 1, videosWatched: 1, quizzesCompleted: 0 },
  { date: '2025-10-09', studyHours: 2.1, notesCreated: 3, videosWatched: 2, quizzesCompleted: 1 }
]
