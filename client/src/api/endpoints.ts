import axios from './axios'
import { 
  ChatMessage, 
  StudyPlan, 
  CompletedCourse, 
  QuizPerformance, 
  StudyStreak, 
  QuickNote, 
  StudySession,
  StudyResource,
  StudyContext
} from '../types/study-buddy'

// Chat endpoints
export const chatAPI = {
  sendMessage: async (message: string, context?: StudyContext) => {
    const response = await axios.post('/api/chat/message', { message, context })
    return response.data
  },
  
  getChatHistory: async (limit = 50) => {
    const response = await axios.get(`/api/chat/history?limit=${limit}`)
    return response.data
  },
  
  clearChatHistory: async () => {
    const response = await axios.delete('/api/chat/history')
    return response.data
  },
  
  uploadAttachment: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post('/api/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

// Study Plan endpoints
export const studyPlanAPI = {
  getCurrentPlan: async () => {
    const response = await axios.get('/api/study-plan/current')
    return response.data
  },
  
  updateProgress: async (subjectId: string, progress: number) => {
    const response = await axios.patch(`/api/study-plan/progress`, { subjectId, progress })
    return response.data
  },
  
  createPlan: async (plan: Partial<StudyPlan>) => {
    const response = await axios.post('/api/study-plan', plan)
    return response.data
  }
}

// Completed Courses endpoints
export const coursesAPI = {
  getCompletedCourses: async () => {
    const response = await axios.get('/api/courses/completed')
    return response.data
  },
  
  markCourseComplete: async (courseId: string, grade: string) => {
    const response = await axios.post(`/api/courses/${courseId}/complete`, { grade })
    return response.data
  }
}

// Quiz Performance endpoints
export const quizPerformanceAPI = {
  getPerformanceHistory: async (limit = 10) => {
    const response = await axios.get(`/api/quiz/performance?limit=${limit}`)
    return response.data
  },
  
  getPerformanceStats: async () => {
    const response = await axios.get('/api/quiz/performance/stats')
    return response.data
  }
}

// Study Streak endpoints
export const streakAPI = {
  getCurrentStreak: async () => {
    const response = await axios.get('/api/study/streak')
    return response.data
  },
  
  updateStreak: async (minutes: number) => {
    const response = await axios.post('/api/study/streak', { minutes })
    return response.data
  }
}

// Quick Notes endpoints
export const notesAPI = {
  getQuickNotes: async () => {
    const response = await axios.get('/api/notes/quick')
    return response.data
  },
  
  createQuickNote: async (note: Omit<QuickNote, 'id' | 'createdDate' | 'lastModified'>) => {
    const response = await axios.post('/api/notes/quick', note)
    return response.data
  },
  
  updateQuickNote: async (id: string, updates: Partial<QuickNote>) => {
    const response = await axios.patch(`/api/notes/quick/${id}`, updates)
    return response.data
  },
  
  deleteQuickNote: async (id: string) => {
    const response = await axios.delete(`/api/notes/quick/${id}`)
    return response.data
  }
}

// Study Session endpoints
export const sessionAPI = {
  startSession: async (subject: string, activity: string) => {
    const response = await axios.post('/api/study/session/start', { subject, activity })
    return response.data
  },
  
  endSession: async (sessionId: string, productivity: number, notes?: string) => {
    const response = await axios.post(`/api/study/session/${sessionId}/end`, { productivity, notes })
    return response.data
  },
  
  getCurrentSession: async () => {
    const response = await axios.get('/api/study/session/current')
    return response.data
  }
}

// Study Resources endpoints
export const resourcesAPI = {
  getRecommendedResources: async (subject?: string, difficulty?: string) => {
    const params = new URLSearchParams()
    if (subject) params.append('subject', subject)
    if (difficulty) params.append('difficulty', difficulty)
    
    const response = await axios.get(`/api/resources/recommended?${params}`)
    return response.data
  },
  
  searchResources: async (query: string, filters?: any) => {
    const response = await axios.post('/api/resources/search', { query, filters })
    return response.data
  }
}

// Study Materials endpoints
export const studyMaterialsAPI = {
  getMaterials: async (filters?: any, page = 1, limit = 6) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await axios.get(`/api/study-materials?${params}`)
    return response.data
  },
  
  getMaterialById: async (id: string) => {
    const response = await axios.get(`/api/study-materials/${id}`)
    return response.data
  },
  
  downloadMaterial: async (id: string) => {
    const response = await axios.get(`/api/study-materials/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },
  
  uploadMaterial: async (materialData: FormData) => {
    const response = await axios.post('/api/study-materials/upload', materialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  searchMaterials: async (query: string, filters?: any) => {
    const response = await axios.post('/api/study-materials/search', { query, filters })
    return response.data
  },
  
  getCategories: async () => {
    const response = await axios.get('/api/study-materials/categories')
    return response.data
  }
}

// Library endpoints  
export const libraryAPI = {
  getBooks: async (filters?: any, page = 1, limit = 6) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })
    const response = await axios.get(`/api/library/books?${params}`)
    return response.data
  },
  
  getBookById: async (id: string) => {
    const response = await axios.get(`/api/library/books/${id}`)
    return response.data
  },
  
  downloadBook: async (id: string) => {
    const response = await axios.get(`/api/library/books/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },
  
  previewBook: async (id: string) => {
    const response = await axios.get(`/api/library/books/${id}/preview`)
    return response.data
  },
  
  searchBooks: async (query: string, filters?: any) => {
    const response = await axios.post('/api/library/books/search', { query, filters })
    return response.data
  },
  
  toggleFavorite: async (bookId: string) => {
    const response = await axios.post(`/api/library/books/${bookId}/favorite`)
    return response.data
  },
  
  getFavorites: async () => {
    const response = await axios.get('/api/library/favorites')
    return response.data
  },
  
  addReview: async (bookId: string, rating: number, review?: string) => {
    const response = await axios.post(`/api/library/books/${bookId}/reviews`, { rating, review })
    return response.data
  },
  
  getReviews: async (bookId: string) => {
    const response = await axios.get(`/api/library/books/${bookId}/reviews`)
    return response.data
  },
  
  requestBook: async (bookRequest: any) => {
    const response = await axios.post('/api/library/book-requests', bookRequest)
    return response.data
  },
  
  getBookRequests: async () => {
    const response = await axios.get('/api/library/book-requests')
    return response.data
  },
  
  getCategories: async () => {
    const response = await axios.get('/api/library/categories')
    return response.data
  },
  
  getStats: async () => {
    const response = await axios.get('/api/library/stats')
    return response.data
  }
}
