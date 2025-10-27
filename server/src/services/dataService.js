// Hardcoded data service - Database integration ready
// This file provides static data that matches the MongoDB schema structure
// Replace function implementations with actual database queries when ready

class DataService {
  constructor() {
    // Mock user data
    this.users = [
      {
        _id: '673e1234567890123456789a',
        email: 'demo@studyspace.com',
        fullName: 'Demo User',
        password: '$2a$10$X8H7pE9R3mKzNsGxOCVvou2j2I3TQrVXdGdVyK8sLrD9lFn6pQd8m', // hashed 'password123'
        role: 'student',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
        stats: {
          coursesCompleted: 5,
          streakDays: 12,
          totalNotes: 48,
          weeklyActivity: '15h 32m'
        },
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        isVerified: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      },
      {
        _id: '673e1234567890123456789b',
        email: 'admin@studyspace.com',
        fullName: 'Admin User',
        password: '$2a$10$X8H7pE9R3mKzNsGxOCVvou2j2I3TQrVXdGdVyK8sLrD9lFn6pQd8m',
        role: 'admin',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        stats: {
          coursesCompleted: 25,
          streakDays: 45,
          totalNotes: 120,
          weeklyActivity: '35h 15m'
        },
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en'
        },
        isVerified: true,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      }
    ];

    // Mock quiz data
    this.quizzes = [
      {
        _id: '673e3234567890123456789a',
        title: 'Machine Learning Basics',
        description: 'Test your understanding of ML fundamentals',
        category: 'Computer Science',
        difficulty: 'beginner',
        timeLimit: 30,
        passingScore: 70,
        questions: [
          {
            question: 'What is supervised learning?',
            type: 'multiple-choice',
            options: [
              'Learning with labeled data',
              'Learning without any data',
              'Learning with unlabeled data',
              'Learning with partial data'
            ],
            correctAnswer: 0,
            explanation: 'Supervised learning uses labeled training data to learn patterns.',
            points: 10
          },
          {
            question: 'Which algorithm is commonly used for classification?',
            type: 'multiple-choice',
            options: [
              'K-means',
              'Random Forest',
              'DBSCAN',
              'PCA'
            ],
            correctAnswer: 1,
            explanation: 'Random Forest is a popular classification algorithm.',
            points: 10
          }
        ],
        tags: ['machine learning', 'basics', 'ai'],
        userId: '673e1234567890123456789a',
        createdAt: new Date('2024-10-10'),
        updatedAt: new Date()
      },
      {
        _id: '673e3234567890123456789b',
        title: 'JavaScript Fundamentals',
        description: 'Essential JavaScript concepts every developer should know',
        category: 'Programming',
        difficulty: 'intermediate',
        timeLimit: 25,
        passingScore: 75,
        questions: [
          {
            question: 'What is a closure in JavaScript?',
            type: 'multiple-choice',
            options: [
              'A function that returns another function',
              'A function that has access to outer scope variables',
              'A function that is immediately executed',
              'A function that takes parameters'
            ],
            correctAnswer: 1,
            explanation: 'A closure gives access to an outer function\'s scope from an inner function.',
            points: 15
          }
        ],
        tags: ['javascript', 'programming', 'web development'],
        userId: '673e1234567890123456789a',
        createdAt: new Date('2024-10-12'),
        updatedAt: new Date()
      }
    ];

    // Mock study materials
    this.studyMaterials = [
      {
        _id: '673e4234567890123456789a',
        title: 'Machine Learning Handbook',
        description: 'Comprehensive guide to ML algorithms and techniques',
        category: 'Computer Science',
        difficulty: 'intermediate',
        type: 'pdf',
        fileUrl: '/samples/ml-handbook.pdf',
        thumbnailUrl: '/images/ml-handbook-thumb.jpg',
        userId: '673e1234567890123456789a',
        metadata: {
          pages: 156,
          readTime: '4 hours',
          topics: ['machine learning', 'algorithms', 'data science', 'python']
        },
        tags: ['machine learning', 'handbook', 'reference'],
        downloads: 1247,
        rating: 4.8,
        createdAt: new Date('2024-09-20'),
        updatedAt: new Date()
      },
      {
        _id: '673e4234567890123456789b',
        title: 'React Development Guide',
        description: 'Complete guide to modern React development practices',
        category: 'Web Development',
        difficulty: 'intermediate',
        type: 'pdf',
        fileUrl: '/samples/react-guide.pdf',
        thumbnailUrl: '/images/react-guide-thumb.jpg',
        userId: '673e1234567890123456789a',
        metadata: {
          pages: 89,
          readTime: '2.5 hours',
          topics: ['react', 'components', 'hooks', 'state management']
        },
        tags: ['react', 'frontend', 'javascript'],
        downloads: 892,
        rating: 4.6,
        createdAt: new Date('2024-10-05'),
        updatedAt: new Date()
      }
    ];

    // Mock roadmaps
    this.roadmaps = [
      {
        _id: '673e5234567890123456789a',
        title: 'Full Stack Developer Path',
        description: 'Complete roadmap to become a full stack developer',
        category: 'Web Development',
        difficulty: 'intermediate',
        estimatedDuration: '6 months',
        userId: '673e1234567890123456789a',
        items: [
          {
            title: 'HTML & CSS Fundamentals',
            description: 'Learn the basics of web markup and styling',
            type: 'lesson',
            status: 'completed',
            duration: 40,
            order: 1,
            resources: ['673e2234567890123456789b']
          },
          {
            title: 'JavaScript Basics',
            description: 'Programming fundamentals with JavaScript',
            type: 'lesson',
            status: 'in-progress',
            duration: 60,
            order: 2,
            resources: ['673e2234567890123456789b']
          },
          {
            title: 'React Framework',
            description: 'Build dynamic UIs with React',
            type: 'project',
            status: 'not-started',
            duration: 80,
            order: 3,
            resources: ['673e2234567890123456789c']
          }
        ],
        tags: ['web development', 'full stack', 'javascript'],
        createdAt: new Date('2024-09-15'),
        updatedAt: new Date()
      }
    ];

    // Mock topics/categories
    this.topics = [
      {
        _id: '673e6234567890123456789a',
        name: 'Machine Learning',
        iconUrl: '/icons/ml.svg',
        displayOrder: 1,
        isTopFive: true,
        description: 'Artificial intelligence and machine learning concepts'
      },
      {
        _id: '673e6234567890123456789b',
        name: 'Web Development',
        iconUrl: '/icons/web.svg',
        displayOrder: 2,
        isTopFive: true,
        description: 'Frontend and backend web development'
      },
      {
        _id: '673e6234567890123456789c',
        name: 'Data Science',
        iconUrl: '/icons/data.svg',
        displayOrder: 3,
        isTopFive: true,
        description: 'Data analysis, visualization, and statistics'
      },
      {
        _id: '673e6234567890123456789d',
        name: 'Mobile Development',
        iconUrl: '/icons/mobile.svg',
        displayOrder: 4,
        isTopFive: true,
        description: 'iOS and Android app development'
      },
      {
        _id: '673e6234567890123456789e',
        name: 'DevOps',
        iconUrl: '/icons/devops.svg',
        displayOrder: 5,
        isTopFive: true,
        description: 'Deployment, CI/CD, and infrastructure'
      }
    ];

    // Mock study sessions
    this.studySessions = [
      {
        _id: '673e7234567890123456789a',
        userId: '673e1234567890123456789a',
        startAt: new Date(Date.now() - 3600000), // 1 hour ago
        endAt: new Date(Date.now() - 600000), // 10 minutes ago
        actualMinutes: 50,
        status: 'closed',
        resourceType: 'video',
        resourceId: '673e2234567890123456789a',
        notes: ['Understanding supervised learning basics', 'Key algorithms overview']
      }
    ];

    // Mock conference rooms
    this.rooms = [
      {
        _id: '673e8234567890123456789a',
        conferenceId: 'STUDY-AI-1001',
        studentId: '673e1234567890123456789a',
        title: 'ML Study Group',
        description: 'Weekly machine learning discussion',
        startAt: new Date(Date.now() + 3600000), // 1 hour from now
        scheduledEnd: new Date(Date.now() + 7200000), // 2 hours from now
        maxParticipants: 10,
        participants: [],
        status: 'waiting',
        hasPassword: false,
        isPublic: true,
        createdAt: new Date()
      }
    ];
  }

  // USER METHODS
  async findUserByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }

  async findUserById(id) {
    return this.users.find(user => user._id === id) || null;
  }

  async createUser(userData) {
    const newUser = {
      _id: `673e${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // QUIZ METHODS
  async getAllQuizzes(limit = 20, skip = 0) {
    return this.quizzes.slice(skip, skip + limit);
  }

  async getQuizById(id) {
    return this.quizzes.find(quiz => quiz._id === id) || null;
  }

  async getQuizzesByCategory(category, limit = 20) {
    const filtered = this.quizzes.filter(quiz => 
      quiz.category.toLowerCase() === category.toLowerCase()
    );
    return filtered.slice(0, limit);
  }

  // STUDY MATERIALS METHODS
  async getAllStudyMaterials(limit = 20, skip = 0) {
    return this.studyMaterials.slice(skip, skip + limit);
  }

  async getStudyMaterialById(id) {
    return this.studyMaterials.find(material => material._id === id) || null;
  }

  async searchStudyMaterials(query, limit = 20) {
    const filtered = this.studyMaterials.filter(material => 
      material.title.toLowerCase().includes(query.toLowerCase()) ||
      material.description.toLowerCase().includes(query.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.slice(0, limit);
  }

  // ROADMAP METHODS
  async getRoadmapsByUserId(userId) {
    return this.roadmaps.filter(roadmap => roadmap.userId === userId);
  }

  async getRoadmapById(id) {
    return this.roadmaps.find(roadmap => roadmap._id === id) || null;
  }

  // TOPICS METHODS
  async getAllTopics() {
    return this.topics.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getTopFiveTopics() {
    return this.topics.filter(topic => topic.isTopFive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // STUDY SESSIONS METHODS
  async getStudySessionsByUserId(userId, limit = 10) {
    return this.studySessions.filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
      .slice(0, limit);
  }

  async createStudySession(sessionData) {
    const newSession = {
      _id: `673e${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
      ...sessionData,
      createdAt: new Date()
    };
    this.studySessions.push(newSession);
    return newSession;
  }

  // ROOM METHODS
  async getAllRooms(limit = 20) {
    return this.rooms.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, limit);
  }

  async getRoomByConferenceId(conferenceId) {
    return this.rooms.find(room => room.conferenceId === conferenceId) || null;
  }

  async createRoom(roomData) {
    const newRoom = {
      _id: `673e${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
      conferenceId: `STUDY-AI-${Math.floor(1000 + Math.random() * 9000)}`,
      ...roomData,
      participants: [],
      status: 'waiting',
      createdAt: new Date()
    };
    this.rooms.push(newRoom);
    return newRoom;
  }

  // ANALYTICS METHODS
  async getUserStats(userId) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const sessions = await this.getStudySessionsByUserId(userId);
    const totalMinutes = sessions.reduce((sum, session) => sum + (session.actualMinutes || 0), 0);
    
    return {
      ...user.stats,
      totalStudyTime: totalMinutes,
      recentSessions: sessions.length,
      averageSessionTime: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0
    };
  }

  // AI THREAD METHODS (for chat history)
  async getAiThreadBySessionId(sessionId) {
    // Mock AI conversation history
    return {
      _id: `ai_${sessionId}`,
      sessionId,
      messages: [
        {
          role: 'user',
          text: 'Can you explain machine learning?',
          ts: new Date(Date.now() - 300000)
        },
        {
          role: 'assistant',
          text: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or decisions.',
          ts: new Date(Date.now() - 240000)
        }
      ]
    };
  }
}

// Export singleton instance
const dataService = new DataService();
module.exports = dataService;
