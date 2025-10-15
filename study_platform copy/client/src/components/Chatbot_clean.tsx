import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Trash2, Download, Bot, User } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  attachments?: ChatAttachment[]
}

interface ChatAttachment {
  id: string
  type: 'pdf' | 'image' | 'note'
  name: string
  url: string
}

interface ChatbotProps {
  onSendMessage?: (message: string) => void
  isLoading?: boolean
  messages?: ChatMessage[]
  placeholder?: string
  className?: string
}

const Chatbot: React.FC<ChatbotProps> = ({
  onSendMessage,
  isLoading = false,
  messages = [],
  placeholder = "Ask me anything...",
  className = ""
}) => {
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use provided messages or local state
  const displayMessages = messages.length > 0 ? messages : localMessages

  useEffect(() => {
    // Initialize with welcome message if no messages provided
    if (messages.length === 0 && localMessages.length === 0) {
      setLocalMessages([{
        id: '1',
        content: 'Hello! I\'m your AI study assistant. How can I help you today?',
        role: 'assistant',
        timestamp: new Date()
      }])
    }
  }, [messages.length, localMessages.length])

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  const sendMessage = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    // If using local state, add message
    if (messages.length === 0) {
      setLocalMessages(prev => [...prev, userMessage])
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(input),
          role: 'assistant',
          timestamp: new Date()
        }
        setLocalMessages(prev => [...prev, aiResponse])
      }, 1000)
    }

    // Call parent handler if provided
    if (onSendMessage) {
      onSendMessage(input)
    }

    setInput('')
  }

  const generateAIResponse = (input: string): string => {
    const responses = [
      "That's a great question! Let me help you with that.",
      "I understand what you're asking. Here's my take on it:",
      "Based on your question, I'd recommend exploring this further:",
      "That's an interesting topic! Let me break it down for you:",
      "I can help you understand this concept better."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('File uploaded:', file.name)
      // Handle file upload logic here
    }
  }

  const clearChat = () => {
    if (messages.length === 0) {
      setLocalMessages([])
    }
  }

  const exportChat = () => {
    const chatText = displayMessages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n')
    
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-full">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">AI Study Assistant</h3>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportChat}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Export chat"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-500' 
                : 'bg-gray-200'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div className={`flex-1 max-w-xs lg:max-w-md ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-2 text-xs text-gray-600">
                      <Paperclip className="h-3 w-3" />
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
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
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
