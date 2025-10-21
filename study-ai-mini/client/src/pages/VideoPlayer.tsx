import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Heart,
  Bookmark,
  Eye,
  Clock,
  User,
  MessageSquare,
  Send,
  StickyNote,
  Minimize,
  X
} from 'lucide-react'
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton'
import { videosAPI, userAPI } from '../api/studyAI'

interface Tutorial {
  id: string
  title: string
  description: string
  thumbnail: string
  videoId: string
  duration: string
  views: number
  publishedAt: Date
  category: string
  tags: string[]
  instructor: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  isLiked?: boolean
  isSaved?: boolean
  isDownloaded?: boolean
  lastWatched?: Date
  watchProgress?: number
}

interface Playlist {
  id: string
  title: string
  description: string
  tutorials: Tutorial[]
  totalDuration: string
  createdBy: string
  createdAt: Date
}

interface Comment {
  id: string
  user: string
  avatar: string
  content: string
  timestamp: Date
  likes: number
  replies?: Comment[]
}

interface Note {
  id: string
  content: string
  timestamp: number // Video timestamp in seconds
  createdAt: Date
}

const VideoPlayer: React.FC = () => {
  const { tutorialId } = useParams<{ tutorialId: string }>()
  const navigate = useNavigate()
  
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // UI States
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [activeTab, setActiveTab] = useState<'comments' | 'notes'>('comments')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Comments and Notes
  const [comments, setComments] = useState<Comment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newComment, setNewComment] = useState('')
  const [newNote, setNewNote] = useState('')

  // Load tutorial data from API
  useEffect(() => {
    const loadTutorialData = async () => {
      if (!tutorialId) {
        navigate('/tutorial-hub')
        return
      }

      try {
        setLoading(true)
        
        // Load tutorial/video data from backend
        const videoResponse = await videosAPI.getVideoById(tutorialId)
        const tutorial = videoResponse.data
        
        if (!tutorial) {
          navigate('/tutorial-hub')
          return
        }

        setCurrentTutorial(tutorial)
        setLoading(false)
        
        // TODO: Load playlist data if tutorial is part of a playlist
        // TODO: Load comments and notes from backend
        
      } catch (error) {
        console.error('Failed to load tutorial:', error)
        setError('Failed to load tutorial')
        setLoading(false)
      }
    }

    loadTutorialData()
  }, [tutorialId, navigate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: 'Current User',
        avatar: '/api/placeholder/40/40',
        content: newComment,
        timestamp: new Date(),
        likes: 0
      }
      setComments([...comments, comment])
      setNewComment('')
    }
  }

  const handlePlaylistItemClick = (tutorial: Tutorial) => {
    navigate(`/tutorial-player/${tutorial.id}`)
  }

  const handleLike = async () => {
    if (!currentTutorial) return
    
    try {
      await videosAPI.likeVideo(currentTutorial.id)
      setCurrentTutorial(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null)
    } catch (error) {
      console.error('Failed to like video:', error)
    }
  }

  const handleSave = async () => {
    if (!currentTutorial) return
    
    try {
      await videosAPI.saveVideo(currentTutorial.id)
      setCurrentTutorial(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null)
    } catch (error) {
      console.error('Failed to save video:', error)
    }
  }

  const workspaceContext = currentTutorial ? {
    type: 'video' as const,
    content: currentTutorial,
    timestamp: currentTime,
    notes: notes
  } : undefined

  if (!currentTutorial || !playlist) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/tutorial-hub')} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Tutorial Hub
          </button>
        </div>
      </div>
    )
  }

  if (!currentTutorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tutorial not found</p>
          <button 
            onClick={() => navigate('/tutorial-hub')} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Tutorial Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Workspace Button */}
      <FloatingWorkspaceButton context={workspaceContext} />

      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Video Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black relative" style={{ aspectRatio: '16/9' }}>
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
                <p className="text-lg">{currentTutorial.title}</p>
                <p className="text-sm opacity-75">Mock Video Player</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center space-x-4 text-white">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                
                <div className="flex-1 flex items-center space-x-2">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-gray-600 h-1 rounded">
                    <div 
                      className="bg-red-600 h-1 rounded"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm">{formatTime(duration)}</span>
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Maximize className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="bg-white p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentTutorial.title}</h1>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{formatViews(currentTutorial.views)} views</span>
                <span>•</span>
                <span>{formatDate(currentTutorial.publishedAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    currentTutorial?.isLiked 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </button>
                <button 
                  onClick={handleSave}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    currentTutorial?.isSaved 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="h-5 w-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Instructor Info */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentTutorial.instructor}</h3>
                <p className="text-sm text-gray-600">{currentTutorial.category} • {currentTutorial.difficulty}</p>
              </div>
              <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Subscribe
              </button>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{currentTutorial.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {currentTutorial.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Comments and Notes Section */}
          <div className="bg-white flex-1">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-6 py-3 border-b-2 font-medium text-sm ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-6 py-3 border-b-2 font-medium text-sm ${
                    activeTab === 'notes'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Notes ({notes.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-4">
                      <img
                        src={comment.avatar}
                        alt={comment.user}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm">{comment.user}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{comment.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-gray-700">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="hover:text-gray-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Add Note */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Add note at {formatTime(currentTime)}
                      </span>
                    </div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write your note here..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddNote}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  {notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-600">
                          {formatTime(note.timestamp)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        {showPlaylist && (
          <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{playlist.title}</h2>
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="p-1 hover:bg-gray-100 rounded lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {playlist.tutorials.length} videos • {playlist.totalDuration}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {playlist.tutorials.map((tutorial, index) => (
                <div
                  key={tutorial.id}
                  onClick={() => handlePlaylistItemClick(tutorial)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    tutorial.id === currentTutorial.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                  }`}
                >
                  <div className="flex space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white px-1 text-xs rounded">
                        {tutorial.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {index + 1}. {tutorial.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatViews(tutorial.views)} views
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
