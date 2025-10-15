// API URLs
export const API_ENDPOINTS = {
  AUTH: '/auth',
  DOCS: '/docs',
  NOTES: '/notes',
  QUIZ: '/quiz',
  CHAT: '/chat',
  CONFERENCE: '/conference',
  ADMIN: '/admin',
  PROGRESS: '/progress',
} as const

// App configuration
export const APP_CONFIG = {
  NAME: 'StudyAI Mini',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Learning Platform',
  CONTACT_EMAIL: 'support@studyai.com',
} as const

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: '280px',
  HEADER_HEIGHT: '64px',
  MOBILE_BREAKPOINT: '768px',
  ANIMATION_DURATION: '0.3s',
} as const

// Quiz settings
export const QUIZ_CONFIG = {
  TIME_LIMIT: 60, // minutes
  MAX_QUESTIONS: 50,
  PASSING_SCORE: 70, // percentage
  DIFFICULTIES: ['easy', 'medium', 'hard'] as const,
} as const

// File upload settings
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['pdf', 'docx', 'txt', 'md'],
  MAX_FILES: 5,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  WORKSPACE_STATE: 'workspaceState',
  CHAT_HISTORY: 'chatHistory',
} as const

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#0ea5e9',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#6366f1',
} as const

// Conference settings
export const CONFERENCE_CONFIG = {
  MAX_PARTICIPANTS: 20,
  VIDEO_QUALITY: {
    LOW: { width: 320, height: 240 },
    MEDIUM: { width: 640, height: 480 },
    HIGH: { width: 1280, height: 720 },
  },
  AUDIO_SETTINGS: {
    SAMPLE_RATE: 44100,
    ECHO_CANCELLATION: true,
    NOISE_SUPPRESSION: true,
  },
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const
