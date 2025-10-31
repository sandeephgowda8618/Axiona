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
  Bot,
  PlayCircle,
  Folder,
  Youtube,
  Clock
} from 'lucide-react'
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

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

  // Initialize PDF viewer plugins exactly like SubjectViewer
  const bookmarkPluginInstance = bookmarkPlugin();
  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  
  // Page navigation plugin with page change tracking
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });
  
  // Highlight plugin
  const highlightPluginInstance = highlightPlugin();

  // Default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    // Check for transferred content from floating button
    const activeContent = localStorage.getItem('workspaceActiveContent');
    if (activeContent) {
      try {
        const parsedContent = JSON.parse(activeContent);
        console.log('🚀 Workspace received content:', parsedContent);
        
        setContext({
          type: parsedContent.type,
          content: {
            id: parsedContent.id,
            title: parsedContent.title,
            url: parsedContent.url,
            pdfData: parsedContent.pdfData,
            videoData: parsedContent.videoData
          },
          currentPage: parsedContent.currentPage || 1,
          timestamp: parsedContent.currentTime || 0,
          progress: parsedContent.progress || 0,
          notes: [],
          openedAt: parsedContent.transferredAt
        });
        
        if (parsedContent.currentPage) {
          setCurrentPage(parsedContent.currentPage);
        }
        if (parsedContent.currentTime) {
          setCurrentTime(parsedContent.currentTime);
        }
        
        // Set total pages for PDFs
        if (parsedContent.type === 'pdf' && parsedContent.pdfData?.pages) {
          setTotalPages(parsedContent.pdfData.pages);
        }
        
        // Add welcome message with context
        setChatMessages([
          {
            id: '1',
            type: 'assistant',
            content: `Hi! I can see you've opened "${parsedContent.title}" from your study materials. I'm here to help you understand this ${parsedContent.type} content. Feel free to ask me any questions!`,
            timestamp: new Date(),
            context: parsedContent.title
          }
        ]);
        
        // Clear the transferred content after loading
        localStorage.removeItem('workspaceActiveContent');
      } catch (error) {
        console.error('Error parsing transferred content:', error);
      }
    } else {
      // Fall back to old system for backward compatibility
      const savedContext = localStorage.getItem('workspaceContext');
      if (savedContext) {
        try {
          const parsedContext = JSON.parse(savedContext);
          setContext(parsedContext);
          if (parsedContext.notes) {
            setNotes(parsedContext.notes);
          }
          if (parsedContext.timestamp) {
            setCurrentTime(parsedContext.timestamp);
          }
          if (parsedContext.currentPage) {
            setCurrentPage(parsedContext.currentPage);
          }
        } catch (error) {
          console.error('Error parsing workspace context:', error);
        }
      }
      
      // Default welcome message
      setChatMessages([
        {
          id: '1',
          type: 'assistant',
          content: 'Hi! I\'m here to help you with your studies. Open some content using the workspace button to get started, or feel free to ask me anything!',
          timestamp: new Date(),
          context: 'welcome'
        }
      ]);
    }
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
            {/* Real Video Player */}
            {context.content?.url || context.content?.videoData?.videoUrl ? (
              <div className="w-full h-full">
                {context.content.videoData?.youtubeId ? (
                  // YouTube Video
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${context.content.videoData.youtubeId}?start=${Math.floor(currentTime)}&autoplay=0`}
                    title={context.content.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  // Regular Video
                  <video
                    className="w-full h-full object-contain"
                    controls
                    src={context.content.url || context.content.videoData?.videoUrl}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              // Fallback when no video URL
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Play className="h-16 w-16 ml-2" />
                  </div>
                  <p className="text-lg">{context.content?.title}</p>
                  <p className="text-sm opacity-75">Video content not available</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'pdf':
      case 'material':
      case 'book':
        return (
          <div className="flex-1 bg-white relative overflow-hidden">
            {/* Real PDF Viewer */}
            {context.content?.url || context.content?.pdfData?.fileUrl ? (
              <div className="h-full w-full flex flex-col overflow-hidden">
                {/* Document Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{context.content?.title}</h3>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      <span>Page {currentPage}</span>
                      {totalPages > 0 && (
                        <>
                          <span>of</span>
                          <span>{totalPages}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* PDF Viewer Container with proper constraints */}
                <div className="flex-1 overflow-auto">
                  {(() => {
                    let pdfUrl = context.content.url || context.content.pdfData?.fileUrl;
                    
                    // Ensure PDF URL is absolute
                    if (pdfUrl && !pdfUrl.startsWith('http')) {
                      pdfUrl = `http://localhost:5050${pdfUrl}`;
                    }
                    
                    console.log('🔍 Raw PDF URL:', context.content.url || context.content.pdfData?.fileUrl);
                    console.log('🔍 Final PDF URL for viewer:', pdfUrl);
                    console.log('🔍 Context content:', context.content);
                    
                    return (
                      <div className="flex-1 bg-gray-100 relative overflow-hidden">
                        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
                          <div style={{ height: '100%', width: '100%' }} className="relative">
                            <Viewer
                              fileUrl={pdfUrl}
                              plugins={[
                                defaultLayoutPluginInstance,
                                highlightPluginInstance,
                                bookmarkPluginInstance,
                                searchPluginInstance,
                                zoomPluginInstance,
                                pageNavigationPluginInstance,
                              ]}
                              theme="light"
                              defaultScale={1.2}
                              onDocumentLoad={(e) => {
                                console.log('PDF loaded with', e.doc.numPages, 'pages');
                              }}
                              onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                              renderLoader={(percentages: number) => (
                                <div className="flex items-center justify-center h-full bg-gray-50">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600">Loading PDF... {Math.round(percentages)}%</p>
                                  </div>
                                </div>
                              )}
                            />
                          </div>
                        </Worker>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // Fallback when no PDF URL
              <div className="flex-1 overflow-auto bg-gray-50 p-8">
                <div className="bg-white shadow-lg mx-auto max-w-4xl min-h-screen">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {context.content?.title}
                      </h2>
                      <p className="text-gray-600">
                        PDF content not available. Please try opening the document again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return <div className="flex-1 bg-gray-100"></div>
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {renderContent()}
        </div>

        {/* Right Sidebar - Notes & Chat */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
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
