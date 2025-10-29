import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search,
  Menu,
  Home,
  History,
  Heart,
  Download,
  Bookmark,
  Play,
  Plus,
  Clock,
  Eye,
  X,
  ThumbsUp,
  Share2,
  MoreVertical
} from 'lucide-react'
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

interface SidebarData {
  history: Tutorial[]
  saved: Tutorial[]
  liked: Tutorial[]
  downloaded: Tutorial[]
}

const TutorialHub: React.FC = () => {
  const navigate = useNavigate()
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'history' | 'saved' | 'liked' | 'downloaded' | null>(null)
  const [sidebarData, setSidebarData] = useState<SidebarData>({
    history: [],
    saved: [],
    liked: [],
    downloaded: []
  })
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Load tutorials from backend API
  useEffect(() => {
    const loadTutorials = async () => {
      try {
        const response = await videosAPI.getAllVideos(1, 50) // Get first 50 videos
        
        // Transform backend data to frontend format
        const transformedTutorials: Tutorial[] = response.data.map((video: any) => ({
          id: video._id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnailUrl,
          videoId: video.youtubeId,
          duration: formatDuration(video.durationSec),
          views: video.views,
          publishedAt: new Date(video.uploadedAt),
          category: video.topicTags[0] || 'General',
          tags: video.topicTags,
          instructor: video.channelName,
          difficulty: 'Intermediate', // Default difficulty as backend doesn't have this field
          rating: 4.5, // Default rating
          isLiked: false,
          isSaved: false,
          isDownloaded: false
        }))

        setTutorials(transformedTutorials)

        // Load user's saved and liked videos
        try {
          const [savedVideos, likedVideos] = await Promise.all([
            userAPI.getSavedVideos(),
            userAPI.getLikedVideos()
          ])

          // Update tutorials with user's interaction data
          const updatedTutorials = transformedTutorials.map(tutorial => ({
            ...tutorial,
            isSaved: savedVideos.some((saved: any) => saved.videoId === tutorial.id),
            isLiked: likedVideos.some((liked: any) => liked.videoId === tutorial.id)
          }))

          setTutorials(updatedTutorials)

          // Populate sidebar data based on tutorial properties
          setSidebarData({
            history: [], // TODO: Implement watch history from backend
            saved: updatedTutorials.filter(t => t.isSaved),
            liked: updatedTutorials.filter(t => t.isLiked),
            downloaded: [] // TODO: Implement downloaded videos from backend
          })
        } catch (userError) {
          console.warn('Could not load user data:', userError)
          // Continue with basic tutorial data even if user data fails
          setSidebarData({
            history: [],
            saved: [],
            liked: [],
            downloaded: []
          })
        }
      } catch (error) {
        console.error('Failed to load tutorials:', error)
        // Fallback to empty state or show error message
        setTutorials([])
      }
    }

    loadTutorials()
  }, [])

  // Helper function to format duration from seconds to MM:SS format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const filteredTutorials = tutorials.filter(tutorial =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Apply topic filters if any selected
  const topicFilteredTutorials = filteredTutorials.filter(t => {
    if (selectedTopics.length === 0) return true
    return selectedTopics.includes(t.category)
  })

  const handleTutorialAction = async (tutorialId: string, action: 'like' | 'save' | 'download' | 'watch') => {
    try {
      if (action === 'watch') {
        // Navigate to video player
        navigate(`/video/${tutorialId}`)
        return // Don't update tutorials state for navigation
      }
      
      if (action === 'like') {
        await videosAPI.likeVideo(tutorialId)
      } else if (action === 'save') {
        await videosAPI.saveVideo(tutorialId)
      } else if (action === 'download') {
        await videosAPI.downloadVideo(tutorialId)
      }
      
      // Update local state
      setTutorials(prev => prev.map(tutorial => {
        if (tutorial.id === tutorialId) {
          const updated = { ...tutorial }
          switch (action) {
            case 'like':
              updated.isLiked = !updated.isLiked
              break
            case 'save':
              updated.isSaved = !updated.isSaved
              break
            case 'download':
              updated.isDownloaded = !updated.isDownloaded
              break
          }
          return updated
        }
        return tutorial
      }))
      
      // Update sidebar data
      const updatedTutorials = tutorials.map(tutorial => {
        if (tutorial.id === tutorialId) {
          const updated = { ...tutorial }
          switch (action) {
            case 'like':
              updated.isLiked = !updated.isLiked
              break
            case 'save':
              updated.isSaved = !updated.isSaved
              break
            case 'download':
              updated.isDownloaded = !updated.isDownloaded
              break
          }
          return updated
        }
        return tutorial
      })
      
      setSidebarData({
        history: updatedTutorials.filter(t => t.lastWatched),
        saved: updatedTutorials.filter(t => t.isSaved),
        liked: updatedTutorials.filter(t => t.isLiked),
        downloaded: updatedTutorials.filter(t => t.isDownloaded)
      })
    } catch (error) {
      console.error(`Failed to ${action} video:`, error)
      alert(`Failed to ${action} video. Please try again.`)
    }
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50'
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'Advanced': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const renderModal = () => {
    if (!activeModal) return null

    const modalData = sidebarData[activeModal]
    const modalTitles = {
      history: 'Watch History',
      saved: 'Saved Tutorials',
      liked: 'Liked Tutorials',
      downloaded: 'Downloaded Tutorials'
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">{modalTitles[activeModal]}</h2>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {modalData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No tutorials found in {activeModal}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modalData.map((tutorial) => (
                  <div key={tutorial.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        {tutorial.duration}
                      </div>
                      {tutorial.watchProgress && tutorial.watchProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                          <div 
                            className="h-full bg-red-600"
                            style={{ width: `${tutorial.watchProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{tutorial.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{tutorial.instructor}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatViews(tutorial.views)} views</span>
                        <span>{formatDate(tutorial.publishedAt)}</span>
                      </div>
                      {activeModal === 'history' && tutorial.lastWatched && (
                        <p className="text-xs text-gray-400 mt-2">
                          Watched {formatDate(tutorial.lastWatched)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Main Content Area */}

      <div className="flex">
        {/* Left Filter Sidebar (visible on md+) */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Filter by Topic</h4>
          <div className="space-y-2 text-sm text-gray-700">
            {Array.from(new Set(tutorials.map(t => t.category))).map(topic => (
              <label key={topic} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => {
                    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
                  }}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2">
            <button
              onClick={() => setActiveModal('history')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
            >
              <History className="h-5 w-5" />
              <span>History</span>
              <span className="ml-auto text-sm text-gray-500">{sidebarData.history.length}</span>
            </button>

            <button
              onClick={() => setActiveModal('saved')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
            >
              <Bookmark className="h-5 w-5" />
              <span>Saved</span>
              <span className="ml-auto text-sm text-gray-500">{sidebarData.saved.length}</span>
            </button>

            <button
              onClick={() => setActiveModal('liked')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
            >
              <Heart className="h-5 w-5" />
              <span>Liked</span>
              <span className="ml-auto text-sm text-gray-500">{sidebarData.liked.length}</span>
            </button>

            <button
              onClick={() => setActiveModal('downloaded')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
            >
              <Download className="h-5 w-5" />
              <span>Downloaded</span>
              <span className="ml-auto text-sm text-gray-500">{sidebarData.downloaded.length}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tutorial Hub</h1>
                <p className="text-gray-600">Discover and learn with our curated video tutorials</p>
              </div>
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center w-full max-w-xl">
              <input
                type="text"
                aria-label="Search tutorials"
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
              <button
                onClick={() => {/* explicit search trigger - no-op for now */}}
                className="ml-3 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Tutorials Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {topicFilteredTutorials.map((tutorial) => (
              <div key={tutorial.id} className="tutorial-card">
                <div className="relative group cursor-pointer">
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {tutorial.duration}
                  </div>
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    getDifficultyColor(tutorial.difficulty)
                  }`}>
                    {tutorial.difficulty}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{tutorial.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tutorial.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{tutorial.instructor}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600">{tutorial.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{formatViews(tutorial.views)}</span>
                    </div>
                    <span>{formatDate(tutorial.publishedAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTutorialAction(tutorial.id, 'like')}
                        className={`p-2 rounded-lg transition-colors ${
                          tutorial.isLiked 
                            ? 'text-red-600 bg-red-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${tutorial.isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleTutorialAction(tutorial.id, 'save')}
                        className={`p-2 rounded-lg transition-colors ${
                          tutorial.isSaved 
                            ? 'text-blue-600 bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${tutorial.isSaved ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleTutorialAction(tutorial.id, 'download')}
                        className={`p-2 rounded-lg transition-colors ${
                          tutorial.isDownloaded 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => console.log('add to playlist', tutorial.id)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        title="Add"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleTutorialAction(tutorial.id, 'watch')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Watch</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tutorials found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  )
}

export default TutorialHub
