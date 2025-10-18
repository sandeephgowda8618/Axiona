import React, { useState, useEffect } from 'react'
import '../styles/workspace-charts.css'
import { useNavigate } from 'react-router-dom'
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  BookOpen,
  MessageSquare,
  StickyNote,
  Plus,
  Save,
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Send,
  Minimize,
  Settings,
  RotateCcw,
  User,
  Bot
} from 'lucide-react'

interface WorkspaceContext {
  type: 'video' | 'pdf' | 'material' | 'book'
  content: any
  currentPage?: number
  timestamp?: number
  notes?: any[]
  progress?: number
  openedAt?: string
}

interface Note {
  id: string
  content: string
  timestamp?: number // For videos
  page?: number // For PDFs
  position?: { x: number; y: number } // For positioning
  createdAt: Date
  type: 'text' | 'highlight' | 'drawing'
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: string // Related to current content
}

const Workspace: React.FC = () => {
  const navigate = useNavigate()
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newNote, setNewNote] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [activePanel, setActivePanel] = useState<'notes' | 'chat'>('notes')
  
  // Video/PDF states
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)

  useEffect(() => {
    // Load context from localStorage if available
    const savedContext = localStorage.getItem('workspaceContext')
    if (savedContext) {
      try {
        const parsedContext = JSON.parse(savedContext)
        setContext(parsedContext)
        if (parsedContext.notes) {
          setNotes(parsedContext.notes)
        }
        if (parsedContext.timestamp) {
          setCurrentTime(parsedContext.timestamp)
        }
        if (parsedContext.currentPage) {
          setCurrentPage(parsedContext.currentPage)
        }
      } catch (error) {
        console.error('Error parsing workspace context:', error)
      }
    }

    // Mock initial chat message
    setChatMessages([
      {
        id: '1',
        type: 'assistant',
        content: 'Hi! I\'m here to help you with your studies. Feel free to ask me anything about the content you\'re viewing.',
        timestamp: new Date(),
        context: 'welcome'
      }
    ])
  }, [])

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        timestamp: context?.type === 'video' ? currentTime : undefined,
        page: context?.type === 'pdf' ? currentPage : undefined,
        createdAt: new Date(),
        type: 'text'
      }
      setNotes([...notes, note])
      setNewNote('')
    }
  }

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: newMessage,
        timestamp: new Date(),
        context: context?.content?.title || 'general'
      }
      
      setChatMessages(prev => [...prev, userMessage])
      setNewMessage('')

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateAIResponse(newMessage, context),
          timestamp: new Date(),
          context: context?.content?.title || 'general'
        }
        setChatMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  const generateAIResponse = (message: string, context: WorkspaceContext | null): string => {
    // Simple AI response simulation based on context
    if (context?.type === 'video') {
      return `Based on the video "${context.content?.title}", I can help explain concepts or answer questions about the content. What specific part would you like me to clarify?`
    } else if (context?.type === 'pdf' || context?.type === 'material') {
      return `I can help you understand the material you're reading. Would you like me to explain any specific concepts or help you create study notes?`
    } else if (context?.type === 'book') {
      return `I can assist with this book content. Feel free to ask about key concepts, summaries, or study strategies related to what you're reading.`
    }
    return "I'm here to help! Ask me anything about your studies."
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderContent = () => {
    if (!context) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Content Loaded</h3>
            <p className="text-gray-500">Open content from Study Materials, Library, or Tutorial Hub to start working.</p>
          </div>
        </div>
      )
    }

    switch (context.type) {
      case 'video':
        return (
          <div className="flex-1 bg-black relative">
            {/* Mock Video Player */}
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {isPlaying ? (
                    <Pause className="h-16 w-16" />
                  ) : (
                    <Play className="h-16 w-16 ml-2" />
                  )}
                </div>
                <p className="text-lg">{context.content?.title}</p>
                <p className="text-sm opacity-75">Workspace Video Player</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center space-x-4 text-white">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                
                <div className="flex-1 flex items-center space-x-2">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-gray-600 h-1 rounded">
                    <div 
                      className="bg-red-600 h-1 rounded"
                      style={{ width: `${(currentTime / (context.content?.duration || 1000)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm">{context.content?.duration || '0:00'}</span>
                </div>

                <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded">
                  <Volume2 className="h-5 w-5" />
                </button>

                <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded">
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )

      case 'pdf':
      case 'material':
      case 'book':
        return (
          <div className="flex-1 bg-white relative">
            {/* PDF/Document Viewer */}
            <div className="h-full flex flex-col">
              {/* Document Controls */}
              <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="font-medium text-gray-900">{context.content?.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Page {currentPage} of {totalPages}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="border-l pl-2 ml-2">
                    <button
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="mx-2 text-sm">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-auto bg-gray-50 p-8">
                <div 
                  className="bg-white shadow-lg mx-auto"
                  style={{ 
                    width: `${zoomLevel}%`,
                    maxWidth: '800px',
                    minHeight: '1000px'
                  }}
                >
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {context.content?.title}
                      </h2>
                      <p className="text-gray-600">
                        {context.content?.description || 'Document content would be displayed here'}
                      </p>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        This is a mock document viewer. In a real implementation, this would display 
                        the actual PDF or document content. The content would be interactive, allowing 
                        users to highlight text, add annotations, and take notes directly on the document.
                      </p>
                      <p className="text-gray-700 leading-relaxed mt-4">
                        The workspace provides a unified environment for studying different types of content 
                        with integrated note-taking and AI assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div className="flex-1 bg-gray-100"></div>
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Workspace</h1>
            {context && (
              <p className="text-sm text-gray-600">
                {context.type === 'video' ? 'Video' : 
                 context.type === 'pdf' ? 'PDF' : 
                 context.type === 'material' ? 'Study Material' : 'Book'}: {context.content?.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Save className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content Area */}
        <div className="flex-1 flex">
          {renderContent()}
        </div>

        {/* Right Sidebar - Notes & Chat */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActivePanel('notes')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  activePanel === 'notes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <StickyNote className="h-4 w-4 inline mr-2" />
                Notes ({notes.length})
              </button>
              <button
                onClick={() => setActivePanel('chat')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  activePanel === 'chat'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                AI Chat
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 flex flex-col">
            {activePanel === 'notes' ? (
              <>
                {/* Add Note */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Add Note
                      {context?.type === 'video' && ` at ${formatTime(currentTime)}`}
                      {(context?.type === 'pdf' || context?.type === 'material' || context?.type === 'book') && ` on page ${currentPage}`}
                    </label>
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-yellow-700">
                          {note.timestamp !== undefined && `${formatTime(note.timestamp)}`}
                          {note.page !== undefined && `Page ${note.page}`}
                          {!note.timestamp && !note.page && 'General Note'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {note.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-8">
                      <StickyNote className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notes yet. Start taking notes!</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
                <>
                  <div className="workspace-ai-chart flex-1 flex flex-col">
                    {/* Chat Messages (scrollable area) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              {message.type === 'assistant' ? (
                                <Bot className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="text-xs opacity-75">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input (fixed at bottom of panel) */}
                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask me anything about the content..."
                          className="flex-1 p-3 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Workspace
