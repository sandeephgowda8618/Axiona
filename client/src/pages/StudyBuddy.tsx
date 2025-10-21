import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, 
  Send, 
  Paperclip,
  BookOpen, 
  Target, 
  Trophy,
  TrendingUp,
  Clock,
  Plus,
  Settings,
  Search,
  Pin,
  Trash2,
  Edit,
  Play,
  Square,
  Brain,
  CheckCircle,
  Zap
} from 'lucide-react'

// Mock data types (simplified)
interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface StudyStreak {
  currentStreak: number
  longestStreak: number
  weeklyGoal: number
  weeklyProgress: number
  dailyGoal: number
  todayProgress: number
}

interface StudySubject {
  id: string
  name: string
  progress: number
  totalTopics: number
  completedTopics: number
  priority: 'high' | 'medium' | 'low'
}

interface StudyPlan {
  id: string
  title: string
  description: string
  subjects: StudySubject[]
  progress: number
  status: 'active' | 'completed' | 'paused'
}

interface CompletedCourse {
  id: string
  title: string
  subject: string
  completedDate: Date
  grade: string
  totalTime: number
}

interface QuizPerformance {
  id: string
  quizTitle: string
  subject: string
  score: number
  totalQuestions: number
  completedDate: Date
  timeSpent: number
  difficulty: string
  streak?: number
}

interface QuickNote {
  id: string
  content: string
  subject?: string
  tags: string[]
  createdDate: Date
  isPinned: boolean
  color: string
}

const StudyBuddy: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'performance' | 'notes'>('chat')
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNote, setNewNote] = useState({ content: '', subject: '', tags: '', color: '#3b82f6' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [currentSession, setCurrentSession] = useState<{ subject: string; startTime: Date } | null>(null)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data
  const [studyStreak] = useState<StudyStreak>({
    currentStreak: 7,
    longestStreak: 15,
    weeklyGoal: 840, // 14 hours
    weeklyProgress: 520, // 8.67 hours
    dailyGoal: 120, // 2 hours
    todayProgress: 85 // 1.42 hours
  })

  const [studyPlan] = useState<StudyPlan>({
    id: '1',
    title: 'Computer Science Fundamentals',
    description: 'Master the core concepts of computer science',
    subjects: [
      {
        id: '1',
        name: 'Data Structures',
        progress: 75,
        totalTopics: 12,
        completedTopics: 9,
        priority: 'high'
      },
      {
        id: '2',
        name: 'Algorithms',
        progress: 45,
        totalTopics: 15,
        completedTopics: 7,
        priority: 'medium'
      },
      {
        id: '3',
        name: 'Database Systems',
        progress: 20,
        totalTopics: 10,
        completedTopics: 2,
        priority: 'low'
      }
    ],
    progress: 47,
    status: 'active'
  })

  const [completedCourses] = useState<CompletedCourse[]>([
    {
      id: '1',
      title: 'Introduction to Programming',
      subject: 'Computer Science',
      completedDate: new Date(Date.now() - 30 * 86400000),
      grade: 'A',
      totalTime: 480
    },
    {
      id: '2',
      title: 'Web Development Basics',
      subject: 'Web Development',
      completedDate: new Date(Date.now() - 45 * 86400000),
      grade: 'B+',
      totalTime: 360
    }
  ])

  const [quizPerformance] = useState<QuizPerformance[]>([
    {
      id: '1',
      quizTitle: 'Data Structures Quiz #3',
      subject: 'Computer Science',
      score: 85,
      totalQuestions: 20,
      completedDate: new Date(Date.now() - 86400000),
      timeSpent: 25,
      difficulty: 'Medium',
      streak: 3
    },
    {
      id: '2',
      quizTitle: 'Algorithm Analysis',
      subject: 'Computer Science',
      score: 92,
      totalQuestions: 15,
      completedDate: new Date(Date.now() - 172800000),
      timeSpent: 18,
      difficulty: 'Hard'
    }
  ])

  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([
    {
      id: '1',
      content: 'Binary search trees have O(log n) average case complexity for search, insert, and delete operations.',
      subject: 'Data Structures',
      tags: ['BST', 'complexity', 'algorithms'],
      createdDate: new Date(Date.now() - 3600000),
      isPinned: true,
      color: '#ef4444'
    },
    {
      id: '2',
      content: 'Remember: Always consider edge cases when implementing recursive algorithms.',
      subject: 'Algorithms',
      tags: ['recursion', 'debugging', 'best-practices'],
      createdDate: new Date(Date.now() - 7200000),
      isPinned: false,
      color: '#3b82f6'
    }
  ])

  const [suggestions] = useState([
    'Review Binary Search Trees concepts',
    'Practice more dynamic programming problems',
    'Complete Database normalization exercises',
    'Schedule algorithm practice session'
  ])

  const [recentTopics] = useState([
    'Binary Search Trees',
    'Dynamic Programming',
    'Database Normalization',
    'Graph Algorithms',
    'System Design'
  ])

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      id: '1',
      content: 'Hello! I\'m your AI study buddy. How can I help you with your studies today?',
      role: 'assistant',
      timestamp: new Date(Date.now() - 300000)
    }])
  }, [])

  const sendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setChatInput('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(chatInput),
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
      scrollToBottom()
    }, 1500)
  }

  const generateAIResponse = (input: string): string => {
    const responses = [
      "That's a great question! Let me help you understand this concept better.",
      "Based on your current study plan, I recommend focusing on this topic next.",
      "I can see you're making excellent progress! Here's how to build on that.",
      "Let me break this down into simpler steps for you.",
      "This connects well with what you studied yesterday. Here's the relationship..."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('Uploading file:', file.name)
    }
  }

  const createQuickNote = () => {
    if (!newNote.content.trim()) return

    const note: QuickNote = {
      id: Date.now().toString(),
      content: newNote.content,
      subject: newNote.subject || undefined,
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdDate: new Date(),
      isPinned: false,
      color: newNote.color
    }

    setQuickNotes(prev => [note, ...prev])
    setNewNote({ content: '', subject: '', tags: '', color: '#3b82f6' })
    setShowNewNoteModal(false)
  }

  const toggleNotePin = (noteId: string) => {
    setQuickNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ))
  }

  const deleteNote = (noteId: string) => {
    setQuickNotes(prev => prev.filter(note => note.id !== noteId))
  }

  const startStudySession = (subject: string) => {
    setCurrentSession({
      subject,
      startTime: new Date()
    })
  }

  const endStudySession = () => {
    setCurrentSession(null)
  }

  const filteredNotes = quickNotes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Study Buddy</h1>
                <p className="text-sm text-gray-500">Your AI-powered learning companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentSession && (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700">Study session active</span>
                </div>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Study Context */}
          <div className="lg:col-span-1 space-y-6">
            {/* Study Streak Card */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Study Streak</h3>
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {studyStreak.currentStreak}
                </div>
                <p className="text-sm text-gray-600">days in a row</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Today's Goal</span>
                    <span className="text-gray-900">{studyStreak.todayProgress}/{studyStreak.dailyGoal}min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((studyStreak.todayProgress / studyStreak.dailyGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Weekly Goal</span>
                    <span className="text-gray-900">{Math.floor(studyStreak.weeklyProgress / 60)}h {studyStreak.weeklyProgress % 60}m / {Math.floor(studyStreak.weeklyGoal / 60)}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((studyStreak.weeklyProgress / studyStreak.weeklyGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Study Plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Study Plan</h3>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">{studyPlan.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{studyPlan.description}</p>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="text-gray-900">{studyPlan.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${studyPlan.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-3">
                {studyPlan.subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                        <span className="text-xs text-gray-500">{subject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            subject.priority === 'high' ? 'bg-red-500' :
                            subject.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${subject.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => startStudySession('Computer Science')}
                  className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 p-3 rounded-lg transition-colors"
                  disabled={!!currentSession}
                >
                  <Play className="h-4 w-4" />
                  <span className="text-sm font-medium">Start Session</span>
                </button>
                <button 
                  onClick={endStudySession}
                  className="flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 p-3 rounded-lg transition-colors"
                  disabled={!currentSession}
                >
                  <Square className="h-4 w-4" />
                  <span className="text-sm font-medium">End Session</span>
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Quick Note</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 p-3 rounded-lg transition-colors">
                  <Search className="h-4 w-4" />
                  <span className="text-sm font-medium">Find Resource</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
                    { id: 'plan', label: 'Study Plan', icon: BookOpen },
                    { id: 'performance', label: 'Performance', icon: TrendingUp },
                    { id: 'notes', label: 'Quick Notes', icon: Edit }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <div 
                      ref={chatContainerRef}
                      className="h-96 overflow-y-auto space-y-4 bg-gray-50 rounded-lg p-4"
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Ask me anything about your studies..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!chatInput.trim() || isLoading}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Suggested topics:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setChatInput(suggestion)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'plan' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Completed Courses */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Completed Courses</h4>
                        <div className="space-y-3">
                          {completedCourses.map((course) => (
                            <div key={course.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{course.title}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{course.subject}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <Trophy className="h-4 w-4" />
                                      <span>Grade: {course.grade}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{Math.floor(course.totalTime / 60)}h {course.totalTime % 60}m</span>
                                    </span>
                                  </div>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Topics */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h4>
                        <div className="space-y-2">
                          {recentTopics.map((topic, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Quiz Performance</h4>
                    <div className="space-y-4">
                      {quizPerformance.map((quiz) => (
                        <div key={quiz.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{quiz.quizTitle}</h5>
                              <p className="text-sm text-gray-600 mt-1">{quiz.subject}</p>
                              <div className="flex items-center space-x-4 mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    quiz.score >= 90 ? 'bg-green-500' :
                                    quiz.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className="text-sm font-medium">{quiz.score}%</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {quiz.score}/{quiz.totalQuestions} correct
                                </span>
                                <span className="text-sm text-gray-500">
                                  {quiz.timeSpent}min
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  quiz.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                  quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {quiz.difficulty}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {quiz.completedDate.toLocaleDateString()}
                              </p>
                              {quiz.streak && (
                                <div className="flex items-center justify-end space-x-1 mt-1">
                                  <Zap className="h-3 w-3 text-orange-500" />
                                  <span className="text-xs text-orange-600">{quiz.streak} streak</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {/* Notes Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Quick Notes</h4>
                      <button
                        onClick={() => setShowNewNoteModal(true)}
                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Note</span>
                      </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search notes..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Subjects</option>
                        <option value="Data Structures">Data Structures</option>
                        <option value="Algorithms">Algorithms</option>
                        <option value="Database Systems">Database Systems</option>
                      </select>
                    </div>

                    {/* Notes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {note.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
                              {note.subject && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {note.subject}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => toggleNotePin(note.id)}
                                className="p-1 text-gray-400 hover:text-yellow-500 rounded"
                              >
                                <Pin className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 mb-3">{note.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {note.createdDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {sortedNotes.length === 0 && (
                      <div className="text-center py-8">
                        <Edit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No notes found</p>
                        <p className="text-sm text-gray-400">Create your first quick note to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Quick Note</h3>
            <div className="space-y-4">
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <input
                type="text"
                value={newNote.subject}
                onChange={(e) => setNewNote(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newNote.tags}
                onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Tags (comma separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Color:</span>
                <div className="flex space-x-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNote(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newNote.color === color ? 'border-gray-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createQuickNote}
                disabled={!newNote.content.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyBuddy
