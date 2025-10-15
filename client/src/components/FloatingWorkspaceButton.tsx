import React from 'react'
import { useNavigate } from 'react-router-dom'
import { StickyNote } from 'lucide-react'

interface FloatingWorkspaceButtonProps {
  context?: {
    type: 'video' | 'pdf' | 'material' | 'book'
    content: any
    currentPage?: number
    timestamp?: number
    notes?: any[]
    progress?: number
  }
  className?: string
}

const FloatingWorkspaceButton: React.FC<FloatingWorkspaceButtonProps> = ({ 
  context, 
  className = "fixed bottom-6 right-6 z-50" 
}) => {
  const navigate = useNavigate()

  const openWorkspace = () => {
    if (context) {
      // Save the current context to localStorage so workspace can access it
      localStorage.setItem('workspaceContext', JSON.stringify({
        ...context,
        openedAt: new Date().toISOString()
      }))
    }
    navigate('/workspace')
  }

  return (
    <button
      onClick={openWorkspace}
      className={`${className} bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 group`}
      title="Open in Workspace"
    >
      <div className="relative">
        <StickyNote className="h-6 w-6 transition-transform group-hover:scale-110" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Open in Workspace
        <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </button>
  )
}

export default FloatingWorkspaceButton
