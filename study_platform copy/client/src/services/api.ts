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

// API Service Class
class ApiService {
  private baseURL: string
  private token: string | null

  constructor() {
    this.baseURL = 'http://localhost:3000/api' // TODO: Use environment variable
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
