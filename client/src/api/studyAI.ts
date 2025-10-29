import axios from './axios'

// Topics API
export const topicsAPI = {
  getAllTopics: async () => {
    const response = await axios.get('/topics')
    return response.data
  },
  
  getTopFiveTopics: async () => {
    const response = await axios.get('/topics/top-five')
    return response.data
  },
  
  getTopicById: async (id: string) => {
    const response = await axios.get(`/topics/${id}`)
    return response.data
  },
  
  getTopicVideos: async (id: string, page = 1, limit = 20) => {
    const response = await axios.get(`/topics/${id}/videos?page=${page}&limit=${limit}`)
    return response.data
  },
  
  getTopicPDFs: async (id: string, page = 1, limit = 20) => {
    const response = await axios.get(`/topics/${id}/pdfs?page=${page}&limit=${limit}`)
    return response.data
  }
}

// Videos API
export const videosAPI = {
  getAllVideos: async (page = 1, limit = 20, search?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      const response = await axios.get(`/videos?${params}`)
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning mock videos data')
      return {
        data: [
          {
            _id: '1',
            title: 'Introduction to React Hooks',
            description: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 1800,
            views: 15420,
            uploadedAt: '2024-01-15T10:00:00Z',
            topicTags: ['React', 'JavaScript', 'Frontend'],
            channelName: 'React Academy'
          },
          {
            _id: '2',
            title: 'Python Data Structures Explained',
            description: 'Deep dive into Python lists, dictionaries, sets, and tuples with practical examples.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 2400,
            views: 12890,
            uploadedAt: '2024-01-12T14:30:00Z',
            topicTags: ['Python', 'Data Structures', 'Programming'],
            channelName: 'Python Mastery'
          },
          {
            _id: '3',
            title: 'Machine Learning Basics',
            description: 'Introduction to machine learning concepts, algorithms, and practical implementations.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 3600,
            views: 8750,
            uploadedAt: '2024-01-10T09:15:00Z',
            topicTags: ['Machine Learning', 'AI', 'Data Science'],
            channelName: 'AI Learning Hub'
          },
          {
            _id: '4',
            title: 'CSS Grid vs Flexbox',
            description: 'Complete comparison of CSS Grid and Flexbox with practical layout examples.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 1200,
            views: 9340,
            uploadedAt: '2024-01-08T16:45:00Z',
            topicTags: ['CSS', 'Web Design', 'Frontend'],
            channelName: 'Web Design Pro'
          },
          {
            _id: '5',
            title: 'Database Design Principles',
            description: 'Learn database normalization, relationships, and design best practices.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 2700,
            views: 6830,
            uploadedAt: '2024-01-05T11:20:00Z',
            topicTags: ['Database', 'SQL', 'Backend'],
            channelName: 'Database Experts'
          },
          {
            _id: '6',
            title: 'Git Workflow Best Practices',
            description: 'Master Git branching, merging, and collaboration workflows for team development.',
            thumbnailUrl: '/api/placeholder/320/180',
            youtubeId: 'dQw4w9WgXcQ',
            durationSec: 1560,
            views: 11250,
            uploadedAt: '2024-01-03T13:10:00Z',
            topicTags: ['Git', 'Version Control', 'DevOps'],
            channelName: 'DevOps Central'
          }
        ],
        totalPages: 1,
        currentPage: 1,
        totalCount: 6
      }
    }
  },
  
  getVideoById: async (id: string) => {
    const response = await axios.get(`/videos/${id}`)
    return response.data
  },
  
  getPopularVideos: async () => {
    const response = await axios.get('/videos/stats/popular')
    return response.data
  },
  
  getVideosByTopic: async (topic: string) => {
    const response = await axios.get('/videos/stats/topics')
    return response.data
  },
  
  likeVideo: async (id: string) => {
    const response = await axios.post(`/videos/${id}/like`)
    return response.data
  },
  
  saveVideo: async (id: string) => {
    const response = await axios.post(`/videos/${id}/save`)
    return response.data
  },
  
  downloadVideo: async (id: string) => {
    const response = await axios.post(`/videos/${id}/download`)
    return response.data
  },
  watchVideo: async (id: string) => {
    const response = await axios.post(`/videos/${id}/watch`)
    return response.data
  },

  getPlaylistVideos: async (playlistId: string) => {
    const response = await axios.get(`/videos/playlist/${playlistId}`)
    return response.data
  },

  getRelatedVideos: async (videoId: string, limit = 10) => {
    const response = await axios.get(`/videos/${videoId}/related?limit=${limit}`)
    return response.data
  },

  getAllPlaylists: async () => {
    const response = await axios.get('/playlists')
    return response.data
  }
}

// PDFs API
export const pdfsAPI = {
  getAllPDFs: async (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    const response = await axios.get(`/pdfs?${params}`)
    return response.data
  },
  
  getPDFById: async (id: string) => {
    const response = await axios.get(`/pdfs/${id}`)
    return response.data
  },
  
  downloadPDF: async (id: string) => {
    const response = await axios.post(`/pdfs/${id}/download`)
    return response.data
  },
  
  getPDFComments: async (id: string) => {
    const response = await axios.get(`/pdfs/${id}/comments`)
    return response.data
  },
  
  getPDFsByDomain: async (domain: string) => {
    const response = await axios.get(`/pdfs/domain/${domain}`)
    return response.data
  },
  
  getTrendingPDFs: async () => {
    const response = await axios.get('/pdfs/popular/trending')
    return response.data
  }
}

// Authentication API
export const authAPI = {
  register: async (userData: { fullName: string; email: string; password: string }) => {
    const response = await axios.post('/auth/register', userData)
    return response.data
  },
  
  login: async (credentials: { email: string; password: string }) => {
    const response = await axios.post('/auth/login', credentials)
    return response.data
  },
  
  logout: async () => {
    const response = await axios.post('/auth/logout')
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await axios.get('/auth/me')
    return response.data
  },
  
  refreshToken: async () => {
    const response = await axios.post('/auth/refresh')
    return response.data
  }
}

// User API
export const userAPI = {
  updateProfile: async (userData: Partial<{ fullName: string; email: string; avatarUrl: string }>) => {
    try {
      const response = await axios.put('/users/me', userData)
      return response.data
    } catch (error) {
      console.warn('Backend not available for profile update')
      return { success: false }
    }
  },
  
  getUserStats: async () => {
    try {
      const response = await axios.get('/users/me/stats')
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning mock user stats')
      return {
        videosWatched: 45,
        hoursWatched: 67,
        coursesCompleted: 12,
        streakDays: 15
      }
    }
  },
  
  getUserHistory: async () => {
    try {
      const response = await axios.get('/users/me/history')
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning empty history')
      return []
    }
  },
  
  getSavedVideos: async () => {
    try {
      const response = await axios.get('/users/me/saved')
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning empty saved videos')
      return []
    }
  },
  
  getLikedVideos: async () => {
    try {
      const response = await axios.get('/users/me/liked')
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning empty liked videos')
      return []
    }
  },
  
  updatePreferences: async (preferences: any) => {
    try {
      const response = await axios.put('/users/me/preferences', preferences)
      return response.data
    } catch (error) {
      console.warn('Backend not available for preferences update')
      return { success: false }
    }
  },
  
  getUserProfile: async (userId: string) => {
    try {
      const response = await axios.get(`/users/${userId}/profile`)
      return response.data
    } catch (error) {
      console.warn('Backend not available, returning mock user profile')
      return {
        id: userId,
        fullName: 'User',
        email: 'user@example.com',
        avatarUrl: null
      }
    }
  }
}

// Daily Plans API
export const dailyPlansAPI = {
  getTodaysPlan: async () => {
    const response = await axios.get('/daily-plans/today')
    return response.data
  },
  
  getPlanByDate: async (date: string) => {
    const response = await axios.get(`/daily-plans/date/${date}`)
    return response.data
  },
  
  createOrUpdatePlan: async (planData: any) => {
    const response = await axios.post('/daily-plans', planData)
    return response.data
  },
  
  updateTask: async (planId: string, taskId: string, taskData: any) => {
    const response = await axios.put(`/daily-plans/${planId}/task/${taskId}`, taskData)
    return response.data
  },
  
  deleteTask: async (planId: string, taskId: string) => {
    const response = await axios.delete(`/daily-plans/${planId}/task/${taskId}`)
    return response.data
  },
  
  getPlanProgress: async (planId: string) => {
    const response = await axios.get(`/daily-plans/${planId}/progress`)
    return response.data
  },
  
  getPlanHistory: async () => {
    const response = await axios.get('/daily-plans/history')
    return response.data
  },
  
  deletePlan: async (planId: string) => {
    const response = await axios.delete(`/daily-plans/${planId}`)
    return response.data
  }
}

// Study Sessions API
export const studySessionsAPI = {
  startSession: async (sessionData: any) => {
    const response = await axios.post('/study-sessions', sessionData)
    return response.data
  },
  
  getCurrentSession: async () => {
    const response = await axios.get('/study-sessions/current')
    return response.data
  },
  
  getSessionHistory: async () => {
    const response = await axios.get('/study-sessions/history')
    return response.data
  },
  
  getSessionStats: async () => {
    const response = await axios.get('/study-sessions/stats')
    return response.data
  },
  
  getSessionById: async (sessionId: string) => {
    const response = await axios.get(`/study-sessions/${sessionId}`)
    return response.data
  },
  
  updateSession: async (sessionId: string, sessionData: any) => {
    const response = await axios.put(`/study-sessions/${sessionId}`, sessionData)
    return response.data
  },
  
  endSession: async (sessionId: string) => {
    const response = await axios.put(`/study-sessions/${sessionId}/end`)
    return response.data
  }
}

// Roadmaps API
export const roadmapsAPI = {
  getMyRoadmap: async () => {
    const response = await axios.get('/roadmaps/my-roadmap')
    return response.data
  },
  
  createOrUpdateRoadmap: async (roadmapData: any) => {
    const response = await axios.put('/roadmaps', roadmapData)
    return response.data
  },
  
  updateMilestoneProgress: async (mileId: string, progressData: any) => {
    const response = await axios.put(`/roadmaps/milestone/${mileId}/progress`, progressData)
    return response.data
  },
  
  getMilestone: async (mileId: string) => {
    const response = await axios.get(`/roadmaps/milestone/${mileId}`)
    return response.data
  },
  
  addMilestoneResource: async (mileId: string, resourceData: any) => {
    const response = await axios.post(`/roadmaps/milestone/${mileId}/resource`, resourceData)
    return response.data
  },
  
  deleteMilestoneResource: async (mileId: string, resourceId: string) => {
    const response = await axios.delete(`/roadmaps/milestone/${mileId}/resource/${resourceId}`)
    return response.data
  },
  
  getRoadmapProgress: async () => {
    const response = await axios.get('/roadmaps/progress')
    return response.data
  },
  
  deleteRoadmap: async () => {
    const response = await axios.delete('/roadmaps')
    return response.data
  }
}

// Quizzes API
export const quizzesAPI = {
  getAllQuizzes: async (page = 1, limit = 20, filters?: {
    subject?: string;
    category?: string;
    difficulty?: string;
    search?: string;
    tags?: string[];
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.subject && { subject: filters.subject }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.difficulty && { difficulty: filters.difficulty }),
      ...(filters?.search && { search: filters.search })
    });
    
    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    
    const response = await axios.get(`/quizzes?${params}`);
    return response.data;
  },
  
  getQuizById: async (id: string) => {
    const response = await axios.get(`/quizzes/${id}`);
    return response.data;
  },
  
  createQuiz: async (quizData: any) => {
    const response = await axios.post('/quizzes', quizData);
    return response.data;
  },
  
  updateQuiz: async (id: string, quizData: any) => {
    const response = await axios.put(`/quizzes/${id}`, quizData);
    return response.data;
  },
  
  deleteQuiz: async (id: string) => {
    const response = await axios.delete(`/quizzes/${id}`);
    return response.data;
  },
  
  getQuizQuestions: async (id: string) => {
    const response = await axios.get(`/quizzes/${id}/questions`);
    return response.data;
  },
  
  submitQuiz: async (id: string, answers: any, timeSpent: number) => {
    const response = await axios.post(`/quizzes/${id}/submit`, {
      answers,
      timeSpent
    });
    return response.data;
  },
  
  getQuizCategories: async () => {
    const response = await axios.get('/quizzes/meta/categories');
    return response.data;
  },
  
  getQuizSubjects: async () => {
    const response = await axios.get('/quizzes/meta/subjects');
    return response.data;
  },
  
  getQuizTags: async () => {
    const response = await axios.get('/quizzes/meta/tags');
    return response.data;
  }
}

// Study Materials API
export const studyMaterialsAPI = {
  getAllMaterials: async (page = 1, limit = 20, filters: any = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await axios.get(`/study-materials?${params}`);
    return response.data;
  },

  getMaterialById: async (id: string) => {
    const response = await axios.get(`/study-materials/${id}`);
    return response.data;
  },

  downloadMaterial: async (id: string) => {
    const response = await axios.post(`/study-materials/${id}/download`);
    return response.data;
  },

  getSubjects: async () => {
    const response = await axios.get('/study-materials/meta/subjects');
    return response.data;
  },

  getClasses: async () => {
    const response = await axios.get('/study-materials/meta/classes');
    return response.data;
  },

  getCategories: async () => {
    const response = await axios.get('/study-materials/meta/categories');
    return response.data;
  },

  getPopularMaterials: async (limit = 10) => {
    const response = await axios.get(`/study-materials/stats/popular?limit=${limit}`);
    return response.data;
  },

  getRecentMaterials: async (limit = 10) => {
    const response = await axios.get(`/study-materials/stats/recent?limit=${limit}`);
    return response.data;
  },

  createMaterial: async (materialData: any) => {
    const response = await axios.post('/study-materials', materialData);
    return response.data;
  },

  updateMaterial: async (id: string, materialData: any) => {
    const response = await axios.put(`/study-materials/${id}`, materialData);
    return response.data;
  },

  deleteMaterial: async (id: string) => {
    const response = await axios.delete(`/study-materials/${id}`);
    return response.data;
  }
}

// AI API
export const aiAPI = {
  // General chat for StudyBuddy page
  sendMessage: async (message: string, context?: any) => {
    const response = await axios.post('/ai/chat', { message, context })
    return response.data
  },

  // Workspace-specific chat
  sendWorkspaceMessage: async (sessionId: string, message: string, context?: any) => {
    const response = await axios.post(`/ai/workspace/${sessionId}/chat`, { message, context })
    return response.data
  },

  // Get workspace chat history
  getWorkspaceChatHistory: async (sessionId: string, limit = 50) => {
    const response = await axios.get(`/ai/workspace/${sessionId}/chat/history?limit=${limit}`)
    return response.data
  },

  // Get AI study suggestions
  getStudySuggestions: async () => {
    const response = await axios.get('/ai/suggestions')
    return response.data
  },

  // Get AI performance analysis
  getPerformanceAnalysis: async (period = '7d') => {
    const response = await axios.get(`/ai/performance-analysis?period=${period}`)
    return response.data
  },

  // Explain a concept
  explainConcept: async (concept: string, context?: any) => {
    const response = await axios.post('/ai/explain', { concept, context })
    return response.data
  },

  // Health check for AI service
  healthCheck: async () => {
    const response = await axios.get('/ai/health')
    return response.data
  }
}
