import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MessageSquare,
  StickyNote,
  Download,
  Send,
  User,
  Bot,
  SkipBack,
  SkipForward,
  Maximize2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Note {
  id: string
  content: string
  timestamp: number
  createdAt: Date
}

interface WorkspaceContent {
  type: 'video' | 'pdf'
  title: string
  url?: string
  duration?: number
  pages?: number
}

const Workspace: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(745) // 12:45 as shown in reference
  const [duration] = useState(2730) // 45:30 total duration
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(10)
  const [zoomLevel, setZoomLevel] = useState(100)
  
  // Determine content type from URL params or default to video
  const [content, setContent] = useState<WorkspaceContent>({
    type: 'video',
    title: 'Machine Learning Fundamentals',
    duration: 2730
  })

  useEffect(() => {
    const type = searchParams.get('type') as 'video' | 'pdf'
    const title = searchParams.get('title') || 'Machine Learning Fundamentals'
    
    if (type) {
      setContent({
        type,
        title,
        duration: type === 'video' ? 2730 : undefined,
        pages: type === 'pdf' ? 10 : undefined
      })
      
      if (type === 'pdf') {
        setActiveTab('chat') // Always start with chat for PDF
      }
    }
  }, [searchParams])
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm here to help you understand the content. What would you like to know about machine learning fundamentals?",
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'user',
      content: "Can you explain what supervised learning is?",
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'assistant',
      content: "Supervised Learning is a type of machine learning where:\n• The algorithm learns from labeled training data\n• Each input has a corresponding correct output\n• Goal is to predict outputs for new, unseen inputs\n• Examples: Classification and Regression",
      timestamp: new Date()
    }
  ])
  
  const [notes, setNotes] = useState<Note[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newNote, setNewNote] = useState('')

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: newMessage,
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, userMessage])
      setNewMessage('')

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I understand your question. Let me help you with that concept based on the content.",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        timestamp: content.type === 'video' ? currentTime : currentPage,
        createdAt: new Date()
      }
      setNotes([...notes, note])
      setNewNote('')
    }
  }

  const renderContent = () => {
    if (content.type === 'video') {
      return (
        <div className="bg-black rounded-lg overflow-hidden h-full relative">
          {/* Video Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer"
                   onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </div>
              <h3 className="text-xl font-medium mb-2">{content.title}</h3>
              <p className="text-gray-300">Duration: {formatTime(duration)}</p>
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center space-x-4 text-white">
              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <SkipBack className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <SkipForward className="h-4 w-4" />
              </button>
              
              <div className="flex-1 flex items-center space-x-2">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-600 h-1 rounded cursor-pointer">
                  <div 
                    className="bg-red-600 h-1 rounded"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span className="text-sm">{formatTime(duration)}</span>
              </div>

              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )
    } else {
      // PDF Viewer
      return (
        <div className="bg-white rounded-lg overflow-hidden h-full border border-gray-200">
          {/* PDF Header */}
          <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="font-medium text-gray-900">{content.title}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="border-l border-gray-300 pl-2 ml-2">
                <button
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded mr-1"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 mx-2">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded ml-1"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <div 
              className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {content.title} - Page {currentPage}
                </h1>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This is a sample PDF document viewer showing page {currentPage} of {totalPages}. 
                    In a real implementation, this would display the actual PDF content using a PDF.js 
                    viewer or similar library.
                  </p>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Machine Learning Concepts</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Machine learning is a subset of artificial intelligence that focuses on algorithms 
                    that can learn and make decisions from data without being explicitly programmed.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Supervised Learning: Uses labeled training data</li>
                    <li>Unsupervised Learning: Finds patterns in unlabeled data</li>
                    <li>Reinforcement Learning: Learns through trial and error</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-medium text-gray-700">Study-AI Mini</span>
          </div>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-700">Workspace</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span className="text-sm">Download</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <span className="text-sm">📚 Add to Rack</span>
          </button>
        </div>
      </div>

      {/* Content Title */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <h2 className="text-lg font-medium text-gray-900">{content.title}</h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Content Viewer */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>

        {/* Right Side - Chat Interface Only */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">AI Chat</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start space-x-2 max-w-[85%]">
                  {message.type === 'assistant' && (
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.type === 'assistant' ? 'AI Assistant' : 'You'}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the content..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Workspace