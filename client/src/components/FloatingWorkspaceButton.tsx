import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, ArrowRight, Sparkles, FileText, Play } from 'lucide-react'

interface FloatingWorkspaceButtonProps {
  content?: {
    id: string;
    title: string;
    type: 'video' | 'pdf' | 'material' | 'book';
    url?: string;
    pdfData?: any;
    videoData?: any;
    currentPage?: number;
    currentTime?: number;
    progress?: number;
  };
  className?: string;
  isVisible?: boolean;
}

const FloatingWorkspaceButton: React.FC<FloatingWorkspaceButtonProps> = ({ 
  content, 
  className = "fixed bottom-6 right-6 z-50",
  isVisible = true
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Don't render if no content is provided
  if (!content || !isVisible) return null;

  const openWorkspace = () => {
    setIsAnimating(true);
    
    // Save the current content context for workspace to display on left side
    const workspaceContent = {
      id: content.id,
      title: content.title,
      type: content.type,
      url: content.url,
      pdfData: content.pdfData,
      videoData: content.videoData,
      currentPage: content.currentPage || 1,
      currentTime: content.currentTime || 0,
      progress: content.progress || 0,
      transferredAt: new Date().toISOString(),
      source: window.location.pathname // Track where user came from
    };

    localStorage.setItem('workspaceActiveContent', JSON.stringify(workspaceContent));
    
    // Navigate to workspace after brief animation
    setTimeout(() => {
      navigate('/workspace', { 
        state: { 
          contentTransferred: true,
          contentType: content.type,
          contentTitle: content.title
        }
      });
    }, 300);
  };

  const getContentIcon = () => {
    switch (content.type) {
      case 'pdf':
      case 'material':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Play className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className={className}>
      <button
        onClick={openWorkspace}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative bg-gradient-to-r from-blue-600 to-purple-600 
          text-white rounded-full p-4 shadow-lg 
          transform transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-2xl hover:from-blue-700 hover:to-purple-700
          ${isAnimating ? 'scale-125 rotate-12' : ''}
        `}
        title={`Open ${content?.title || 'content'} in Workspace for AI assistance and notes`}
      >
        <div className="flex items-center space-x-2">
          {getContentIcon()}
          <ArrowRight className={`h-4 w-4 transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          <Briefcase className={`h-5 w-5 transition-transform duration-300 ${isHovered ? 'rotate-12' : ''}`} />
        </div>
        
        {/* Glowing effect on hover */}
        <div className={`
          absolute inset-0 rounded-full bg-white opacity-20
          transform scale-0 transition-transform duration-300
          ${isHovered ? 'scale-100' : ''}
        `} />
      </button>

      {/* Enhanced Tooltip */}
      <div className={`
        absolute bottom-16 right-0 bg-gray-900 text-white text-sm
        px-4 py-3 rounded-lg shadow-xl whitespace-nowrap max-w-xs
        transform transition-all duration-300 pointer-events-none
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <div className="flex items-center space-x-2 mb-1">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="font-medium">Open in Workspace</span>
        </div>
        <div className="text-xs text-gray-300 mb-2">
          {content?.title || 'Current content'}
        </div>
        <div className="text-xs text-blue-300 flex items-center space-x-1">
          <span>•</span>
          <span>Use AI assistance</span>
          <span>•</span>
          <span>Take notes</span>
          <span>•</span>
          <span>Ask questions</span>
        </div>
        
        {/* Tooltip arrow */}
        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>

      {/* Activity indicator */}
      <div className="absolute -top-1 -right-1">
        <div className="relative">
          <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
        </div>
      </div>
    </div>
  );
};

export default FloatingWorkspaceButton;
