// Dynamic Quiz System Types and Interfaces

export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'single-choice' | 'true-false' | 'numerical' | 'text'
  options?: string[]
  correctAnswer: string | number | string[]
  explanation?: string
  marks: number
  timeLimit?: number // in seconds, optional per question
  difficulty: 'easy' | 'medium' | 'hard'
  topics: string[]
  image?: string
  diagram?: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  subject: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  totalQuestions: number
  maxMarks: number
  duration: number // in minutes
  passingMarks: number
  instructions: string[]
  questions: QuizQuestion[]
  isTimeLimited: boolean
  allowReview: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResults: boolean
  retakeAllowed: boolean
  maxAttempts: number
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  prerequisites?: string[]
  // Proctoring and Security Settings
  proctoring: {
    enabled: boolean
    fullscreenRequired: boolean
    tabSwitchLimit: number
    timeWarningAt: number // seconds before end to show warning
    criticalTimeWarningAt: number // seconds before end for critical warning
    preventCopyPaste: boolean
    preventRightClick: boolean
    preventBrowserBack: boolean
    detectTabSwitch: boolean
    detectFullscreenExit: boolean
    autoSubmitOnTimeExpiry: boolean
    maxIdleTime: number // seconds of inactivity before warning
    suspiciousActivityThreshold: number
    blockDeveloperTools: boolean
    preventTextSelection: boolean
    disableZoom: boolean
    monitorMouseActivity: boolean
  }
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  startTime: string
  endTime?: string
  duration: number // actual time taken in seconds
  status: 'in-progress' | 'completed' | 'abandoned' | 'timeout'
  answers: Record<string, any>
  markedForReview: string[]
  score: number
  percentage: number
  passed: boolean
  submittedAt?: string
  timeRemaining?: number
  currentQuestionIndex: number
  visitedQuestions: string[]
  flaggedQuestions: string[]
}

export interface QuizResult {
  attemptId: string
  quiz: Quiz
  attempt: QuizAttempt
  questionResults: {
    questionId: string
    question: string
    userAnswer: any
    correctAnswer: any
    isCorrect: boolean
    marksObtained: number
    timeSpent: number
  }[]
  analytics: {
    totalTimeSpent: number
    averageTimePerQuestion: number
    correctAnswers: number
    wrongAnswers: number
    unanswered: number
    accuracy: number
    subjectWisePerformance: Record<string, {
      correct: number
      total: number
      percentage: number
    }>
  }
}

export interface QuizSession {
  attemptId: string
  quizId: string
  isActive: boolean
  startTime: number
  timeLimit: number
  warningShown: boolean
  tabSwitchCount: number
  maxTabSwitches: number
  fullscreenExited: boolean
  allowTabSwitch: boolean
  proctoring: {
    enabled: boolean
    tabSwitchDetection: boolean
    fullscreenRequired: boolean
    timeTrackingEnabled: boolean
    copyPasteDisabled: boolean
    rightClickDisabled: boolean
  }
}

export interface SecurityEvent {
  type: 'tab_switch' | 'fullscreen_exit' | 'right_click' | 'copy_paste' | 'developer_tools' | 'idle' | 'suspicious_key' | 'focus_loss'
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

// Quiz Categories and Subjects
export const quizCategories = [
  { id: 'mathematics', name: 'Mathematics', icon: '📐' },
  { id: 'physics', name: 'Physics', icon: '⚛️' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
  { id: 'biology', name: 'Biology', icon: '🧬' },
  { id: 'computer-science', name: 'Computer Science', icon: '💻' },
  { id: 'engineering', name: 'Engineering', icon: '⚙️' },
  { id: 'general-knowledge', name: 'General Knowledge', icon: '🌍' },
  { id: 'aptitude', name: 'Aptitude', icon: '🧠' }
]

export const difficultyLevels = [
  { id: 'Beginner', name: 'Beginner', color: 'green', description: 'Basic concepts and fundamentals' },
  { id: 'Intermediate', name: 'Intermediate', color: 'yellow', description: 'Moderate difficulty with applications' },
  { id: 'Advanced', name: 'Advanced', color: 'red', description: 'Complex problems requiring deep understanding' }
]

// Quiz Instructions Templates
export const defaultInstructions = [
  "Read each question carefully before answering.",
  "You can navigate between questions using the Previous/Next buttons.",
  "Use the question palette to jump to any question directly.",
  "Mark questions for review if you want to revisit them later.",
  "Ensure you submit your answers before the time limit expires.",
  "Once submitted, you cannot modify your answers.",
  "Avoid switching tabs or minimizing the browser window during the exam.",
  "Your progress is automatically saved as you answer questions."
]

// Enhanced Proctoring Rules and Anti-Cheating Measures
export const examRestrictions = {
  tabSwitchLimit: 2,
  fullscreenRequired: true,
  timeWarningAt: 300, // 5 minutes in seconds
  criticalTimeWarningAt: 60, // 1 minute in seconds
  autoSubmitOnTimeExpiry: true,
  preventCopyPaste: true,
  preventRightClick: true,
  preventBrowserBack: true,
  detectTabSwitch: true,
  detectFullscreenExit: true,
  showTimeRemaining: true,
  allowReviewDuringExam: true,
  maxIdleTime: 300, // 5 minutes of inactivity before warning
  suspiciousActivityThreshold: 5,
  blockDeveloperTools: true,
  preventTextSelection: true,
  disableZoom: true,
  monitorMouseActivity: true,
  requireWebcam: false, // Future webcam proctoring
  multipleMonitorDetection: true,
  screenshotDetection: true,
  minimumFocusTime: 80, // Minimum % of time window should be focused
  warningGracePeriod: 10, // 10 seconds to return to fullscreen
  keyboardShortcutBlocking: [
    'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 
    'Ctrl+Shift+C', 'Ctrl+A', 'Ctrl+C', 'Ctrl+V', 
    'Ctrl+X', 'Ctrl+S', 'Ctrl+P', 'Alt+Tab', 'Cmd+Tab'
  ]
}


