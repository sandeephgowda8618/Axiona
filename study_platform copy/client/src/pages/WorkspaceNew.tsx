import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Maximize2
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

const Workspace: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(745) // 12:45 as shown in reference
  const [duration] = useState(2730) // 45:30 total duration
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  
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
          content: "I understand your question. Let me help you with that concept based on the video content.",
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
        timestamp: currentTime,
        createdAt: new Date()
      }
      setNotes([...notes, note])
      setNewNote('')
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Video Player */}
        <div className="flex-1 p-6">
          <div className="bg-black rounded-lg overflow-hidden h-full relative">
            {/* Video Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </div>
                <h3 className="text-xl font-medium mb-2">Machine Learning Introduction</h3>
                <p className="text-gray-300">Duration: 45:30</p>
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
        </div>

        {/* Right Side - Chat & Notes Panel */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                AI Chat
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notes'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <StickyNote className="h-4 w-4 inline mr-2" />
                Notes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'chat' ? (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        {message.type === 'assistant' && (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="h-3 w-3 text-blue-600" />
                          </div>
                        )}
                        <div className={`px-3 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about the content..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </>
            ) : (
              <>
                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-yellow-700">
                          {formatTime(note.timestamp)}
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
                      <p className="text-sm text-gray-500">No notes yet</p>
                      <p className="text-xs text-gray-400">Start taking notes while watching!</p>
                    </div>
                  )}
                </div>

                {/* Add Note */}
                <div className="p-4 border-t bg-gray-50">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={`Add note at ${formatTime(currentTime)}...`}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Note
                  </button>
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