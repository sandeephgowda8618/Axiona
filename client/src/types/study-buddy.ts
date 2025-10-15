export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  context?: StudyContext
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  id: string
  type: 'pdf' | 'image' | 'note' | 'quiz'
  name: string
  url: string
  size?: number
}

export interface StudyContext {
  currentSubject?: string
  currentTopic?: string
  studyGoals: string[]
  currentNotes?: string[]
  recentQuizzes?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface StudyPlan {
  id: string
  title: string
  description: string
  subjects: StudySubject[]
  startDate: Date
  endDate: Date
  progress: number
  status: 'active' | 'completed' | 'paused'
  dailyGoal: number // minutes
  weeklyGoal: number // minutes
}

export interface StudySubject {
  id: string
  name: string
  progress: number
  totalTopics: number
  completedTopics: number
  lastStudied?: Date
  nextDeadline?: Date
  priority: 'high' | 'medium' | 'low'
}

export interface CompletedCourse {
  id: string
  title: string
  subject: string
  completedDate: Date
  grade: string
  totalTime: number // minutes
  certificate?: string
}

export interface QuizPerformance {
  id: string
  quizTitle: string
  subject: string
  score: number
  totalQuestions: number
  completedDate: Date
  timeSpent: number // minutes
  difficulty: string
  streak?: number
}

export interface StudyStreak {
  currentStreak: number
  longestStreak: number
  lastStudyDate: Date
  weeklyGoal: number
  weeklyProgress: number
  dailyGoal: number // minutes
  todayProgress: number // minutes
}

export interface QuickNote {
  id: string
  content: string
  subject?: string
  tags: string[]
  createdDate: Date
  lastModified: Date
  isPinned: boolean
  color: string
}

export interface StudySession {
  id: string
  startTime: Date
  endTime?: Date
  duration: number // minutes
  subject: string
  activity: 'reading' | 'quiz' | 'notes' | 'practice' | 'discussion'
  productivity: number // 1-5 rating
  notes?: string
}

export interface StudyBuddyState {
  isLoading: boolean
  messages: ChatMessage[]
  studyContext: StudyContext
  studyPlan: StudyPlan | null
  completedCourses: CompletedCourse[]
  quizPerformance: QuizPerformance[]
  studyStreak: StudyStreak
  quickNotes: QuickNote[]
  currentSession: StudySession | null
  suggestions: string[]
  recentTopics: string[]
}

export interface ChatInputOptions {
  placeholder?: string
  maxLength?: number
  allowAttachments?: boolean
  supportedFileTypes?: string[]
  quickActions?: QuickAction[]
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
  color?: string
}

export interface StudyResource {
  id: string
  title: string
  type: 'pdf' | 'video' | 'article' | 'practice'
  subject: string
  difficulty: string
  estimatedTime: number // minutes
  rating: number
  url: string
  thumbnail?: string
}
