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
  roadmapCompleted: boolean
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
  // Additional fields from StudyMaterial
  semester?: number
  unit?: string
  level?: string
  tags?: string[]
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
  _id: string;
  title: string;
  content: string;
  context: 'pes_material' | 'workspace' | 'general';
  referenceId?: string;
  referenceType?: string;
  referenceTitle?: string;
  pageNumber?: number;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  userId: string;
  title: string;
  content: string;
  context: 'pes_material' | 'workspace' | 'general';
  referenceId?: string;
  referenceType?: string;
  referenceTitle?: string;
  pageNumber?: number;
  tags?: string[];
}

export interface NotesResponse {
  success: boolean;
  data: Note[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface NotesStats {
  total: number;
  pes_materials: number;
  workspace: number;
  general: number;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  pageNumber?: number;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  materialsCount: number;
  [key: string]: any; // Allow additional properties
}

export interface StudyPESSubjectsResponse {
  success: boolean;
  subjects: Record<string, any>;
  totalSubjects?: number;
  totalMaterials?: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// RAG Chat interfaces for workspace AI assistance
export interface RAGChatResponse {
  response: string;
  context?: string;
  sources?: string[];
  relevantPage?: number;
  timestamp: string;
}

export interface ChatHistoryItem {
  id: string;
  pdfId: string;
  userId: string;
  question: string;
  answer: string;
  currentPage: number;
  context?: string;
  timestamp: string;
  createdAt: string;
}

export interface SaveChatRequest {
  pdfId: string;
  userId: string;
  question: string;
  answer: string;
  currentPage: number;
  context?: string;
}

// StudyPES Material interface for PES study materials
export interface StudyPESMaterial {
  id: string
  title: string
  fileName: string
  gridFSFileId: string
  fileUrl?: string
  fileSize?: number
  pages: number
  author?: string
  subject?: string
  semester?: number
  unit?: string
  level?: string
  description?: string
  tags?: string[]
  createdAt?: string
  lastUpdated?: string
  downloadCount?: number
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

  async updateRoadmapProgress(userIdOrItemId: string, progress: number | any): Promise<any> {
    // Check if it's a pipeline roadmap update (userId) or legacy roadmap update (itemId)
    if (typeof progress === 'object') {
      // Pipeline roadmap progress update
      try {
        console.log('📊 Updating roadmap progress for user:', userIdOrItemId);
        const response = await fetch(`${this.baseURL}/pipeline/roadmap/${userIdOrItemId}/progress`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ progress })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update roadmap progress');
        }
        
        const result = await response.json();
        return result.success ? result.data : null;
      } catch (error) {
        console.error('❌ Error updating roadmap progress:', error);
        throw error;
      }
    } else {
      // Legacy roadmap progress update
      const response = await fetch(`${this.baseURL}/users/roadmap/${userIdOrItemId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ progress })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update progress')
      }
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
        id: 'computer-science',
        name: 'Computer Science',
        domain: 'computer-science',
        title: 'Computer Science',
        pdfCount: 45,
        totalPages: 1250,
        totalDownloads: 2350,
        averagePages: 28,
        topicCount: 12,
        materialsCount: 45,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-15',
        description: 'Comprehensive collection of computer science materials including algorithms, data structures, and programming concepts.'
      },
      {
        id: 'mathematics',
        name: 'Mathematics',
        domain: 'mathematics',
        title: 'Mathematics',
        pdfCount: 38,
        totalPages: 980,
        totalDownloads: 1840,
        averagePages: 26,
        topicCount: 10,
        materialsCount: 38,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-12',
        description: 'Mathematical foundations covering calculus, linear algebra, discrete mathematics, and statistical analysis.'
      },
      {
        id: 'physics',
        name: 'Physics',
        domain: 'physics',
        title: 'Physics',
        pdfCount: 32,
        totalPages: 750,
        totalDownloads: 1290,
        averagePages: 23,
        topicCount: 8,
        materialsCount: 32,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-10',
        description: 'Physics concepts from classical mechanics to quantum physics and thermodynamics.'
      },
      {
        id: 'chemistry',
        name: 'Chemistry',
        domain: 'chemistry',
        title: 'Chemistry',
        pdfCount: 28,
        totalPages: 650,
        totalDownloads: 1120,
        averagePages: 23,
        topicCount: 7,
        materialsCount: 28,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-08',
        description: 'Organic, inorganic, and physical chemistry materials with lab procedures and theory.'
      },
      {
        id: 'electronics',
        name: 'Electronics Engineering',
        domain: 'electronics',
        title: 'Electronics Engineering',
        pdfCount: 35,
        totalPages: 920,
        totalDownloads: 1670,
        averagePages: 26,
        topicCount: 9,
        materialsCount: 35,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-14',
        description: 'Circuit analysis, digital electronics, microprocessors, and communication systems.'
      },
      {
        id: 'mechanical',
        name: 'Mechanical Engineering',
        domain: 'mechanical',
        title: 'Mechanical Engineering',
        pdfCount: 30,
        totalPages: 800,
        totalDownloads: 1450,
        averagePages: 27,
        topicCount: 8,
        materialsCount: 30,
        thumbnailUrl: '/api/placeholder/300/200',
        lastUpdated: '2024-01-11',
        description: 'Thermodynamics, fluid mechanics, manufacturing processes, and machine design.'
      }
    ]
  }

  // StudyPES Materials API - Updated to use pipeline database endpoints
  async getStudyPESSubjects(): Promise<StudyPESSubjectsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/pipeline/studypes/subjects`, {
        headers: this.getHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch StudyPES subjects from pipeline')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Count total subjects and materials
        const subjects = result.subjects || {}
        const totalSubjects = Object.keys(subjects).length
        const totalMaterials = Object.values(subjects).reduce((sum: number, subject: any) => {
          return sum + (subject.totalMaterials || 0)
        }, 0)
        
        return {
          subjects,
          totalSubjects,
          totalMaterials,
          success: true,
          message: 'StudyPES materials loaded from pipeline successfully'
        }
      }
      
      return result
    } catch (error) {
      console.error('Error fetching StudyPES subjects from pipeline:', error)
      // Return empty structure if pipeline is not available
      return {
        subjects: {},
        totalSubjects: 0,
        totalMaterials: 0,
        success: false,
        message: 'Failed to load StudyPES materials'
      }
    }
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

  // ==================== PIPELINE APIs ====================
  
  // Interview Questions
  async getInterviewQuestions(domain?: string, experienceLevel?: string): Promise<any[]> {
    try {
      console.log('🎯 Fetching interview questions from pipeline...');
      const response = await fetch(`${this.baseURL}/pipeline/generate-interview-questions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          domain: domain || 'Computer Science',
          experience_level: experienceLevel || 'beginner'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch interview questions');
      }
      
      const result = await response.json();
      return result.success ? result.questions : [];
    } catch (error) {
      console.error('❌ Error fetching interview questions:', error);
      throw error;
    }
  }
  
  // Roadmap Generation
  async generateRoadmap(userId: string, roadmapData: any): Promise<any> {
    try {
      console.log('🚀 Generating roadmap for user:', userId);
      console.log('📝 Roadmap data:', roadmapData);
      
      const response = await fetch(`${this.baseURL}/pipeline/roadmap/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roadmapData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }
      
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('❌ Error generating roadmap:', error);
      throw error;
    }
  }
  
  // Get User Roadmap
  async getUserRoadmap(userId: string): Promise<any> {
    try {
      console.log('🔍 Fetching roadmap for user:', userId);
      const response = await fetch(`${this.baseURL}/pipeline/roadmap/${userId}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No roadmap found
        }
        throw new Error('Failed to fetch user roadmap');
      }
      
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('❌ Error fetching user roadmap:', error);
      throw error;
    }
  }
  
  // Pipeline Health Check
  async checkPipelineHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/pipeline/health`);
      const result = await response.json();
      return result.success && result.data?.overall_status === 'healthy';
    } catch (error) {
      console.warn('⚠️ Pipeline health check failed:', error);
      return false;
    }
  }

  // ==================== NOTES APIs ====================
  
  // Create a new note
  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    console.log('📝 Creating note:', noteData.title);
    
    const response = await fetch(`${this.baseURL}/pipeline/notes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(noteData)
    });

    if (!response.ok) {
      throw new Error('Failed to create note');
    }

    const data = await response.json();
    return data.data;
  }

  // Get notes for a user
  async getUserNotes(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      context?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ): Promise<NotesResponse> {
    console.log('📋 Fetching notes for user:', userId);
    
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);
    if (options.context) params.append('context', options.context);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await fetch(`${this.baseURL}/pipeline/notes/user/${userId}?${params}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }

    return response.json();
  }

  // Get notes by reference (PES material, PDF, etc.)
  async getNotesByReference(
    referenceType: string,
    referenceId: string,
    userId?: string
  ): Promise<Note[]> {
    console.log(`📋 Fetching notes for ${referenceType}: ${referenceId}`);
    
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);

    const response = await fetch(
      `${this.baseURL}/pipeline/notes/reference/${referenceType}/${referenceId}?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reference notes');
    }

    const data = await response.json();
    return data.data;
  }

  // Update a note
  async updateNote(noteId: string, updateData: UpdateNoteRequest): Promise<Note> {
    console.log('✏️ Updating note:', noteId);
    
    const response = await fetch(`${this.baseURL}/pipeline/notes/${noteId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update note');
    }

    const data = await response.json();
    return data.data;
  }

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    console.log('🗑️ Deleting note:', noteId);
    
    const response = await fetch(`${this.baseURL}/pipeline/notes/${noteId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
  }

  // Get notes statistics for a user
  async getNotesStats(userId: string): Promise<NotesStats> {
    console.log('📊 Fetching notes stats for user:', userId);
    
    const response = await fetch(`${this.baseURL}/pipeline/notes/stats/${userId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notes statistics')
    }

    const data = await response.json();
    return data.data;
  }

  // ===== RAG CHAT API METHODS =====

  // Send a question to RAG system and get AI response
  async sendRAGChatMessage(question: string, pdfId?: string, currentPage?: number, context?: string): Promise<RAGChatResponse> {
    console.log('🤖 Sending RAG chat message:', { question, pdfId, currentPage, context });
    
    const response = await fetch(`${this.baseURL}/pipeline/workspace/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        question: question.trim(),
        pdfId: pdfId || null,
        currentPage: currentPage || 1,
        context: context || null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.data;
  }

  // Get chat history for a specific PDF
  async getChatHistory(pdfId: string, userId?: string): Promise<ChatHistoryItem[]> {
    console.log('📚 Fetching chat history for PDF:', pdfId);
    
    const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${this.baseURL}/pipeline/workspace/chat/history/${encodeURIComponent(pdfId)}${queryParams}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return data.data;
  }

  // Save chat conversation to database
  async saveChatHistory(chatData: SaveChatRequest): Promise<ChatHistoryItem> {
    console.log('💾 Saving chat history:', chatData);
    
    const response = await fetch(`${this.baseURL}/pipeline/workspace/chat/save`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(chatData)
    });

    if (!response.ok) {
      throw new Error('Failed to save chat history');
    }

    const data = await response.json();
    return data.data;
  }

  // ===== SAVED MATERIALS API METHODS =====

  // Save a material (PES or reference book)
  async saveMaterial(materialData: any): Promise<any> {
    console.log('💾 Saving material:', materialData.title);
    
    const response = await fetch(`${this.baseURL}/pipeline/saved-materials`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(materialData)
    });

    if (!response.ok) {
      throw new Error('Failed to save material');
    }

    const data = await response.json();
    return data.data;
  }

  // Unsave a material
  async unsaveMaterial(materialId: string, userId: string): Promise<void> {
    console.log('🗑️ Unsaving material:', materialId);
    
    const response = await fetch(`${this.baseURL}/pipeline/saved-materials/${materialId}?userId=${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to unsave material');
    }
  }

  // Get saved materials for a user
  async getSavedMaterials(userId: string): Promise<any[]> {
    console.log('📋 Fetching saved materials for user:', userId);
    
    const response = await fetch(`${this.baseURL}/pipeline/saved-materials/user/${userId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch saved materials');
    }

    const data = await response.json();
    return data.data;
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Convenience function exports
export const generateRoadmap = (roadmapData: any) => {
  // Format roadmap data properly for backend according to pipeline expectations
  const formattedAnswers = [];
  
  if (roadmapData.interview_responses) {
    for (const [questionId, answer] of Object.entries(roadmapData.interview_responses)) {
      formattedAnswers.push({
        questionId: questionId,
        question_id: questionId,  // Pipeline expects this field
        answer: answer
      });
    }
  }
  
  const requestData = {
    userId: 'current-user',
    domain: roadmapData.domain,
    experience_level: roadmapData.experience_level,
    userAnswers: formattedAnswers
  };
  
  return apiService.generateRoadmap('current-user', requestData);
}
export const getUserRoadmap = (userId?: string) => apiService.getUserRoadmap(userId || 'current-user')

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
  roadmapCompleted: false,
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
