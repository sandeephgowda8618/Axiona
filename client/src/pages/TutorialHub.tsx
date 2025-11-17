import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Search,
  Menu,
  Home,
  History,
  Heart,
  Download,
  Bookmark,
  Play,
  Clock,
  Eye,
  X,
  ThumbsUp,
  MoreVertical,
  Check,
  ChevronDown,
  Filter
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
  completed?: boolean
}

interface SidebarData {
  history: Tutorial[]
  saved: Tutorial[]
  liked: Tutorial[]
  downloaded: Tutorial[]
}

const TutorialHub: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [loading, setLoading] = useState(true)
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  // Load tutorials from backend API
  useEffect(() => {
    const loadTutorials = async () => {
      try {
        console.log('🔍 Starting to fetch tutorials from API...')
        const response = await videosAPI.getAllVideos(1, 50) // Get first 50 videos
        console.log('📊 API Response:', response)
        
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

        console.log('✅ Transformed tutorials:', transformedTutorials.length, 'tutorials')
        setTutorials(transformedTutorials)
        
        // Load user interaction data if user is authenticated
        if (user) {
          await loadUserInteractionData()
        }
      } catch (error) {
        console.error('❌ Failed to load tutorials:', error)
        setTutorials([])
      } finally {
        setLoading(false)
      }
    }

    loadTutorials()
  }, [user])

  // Load user's interaction data
  const loadUserInteractionData = async () => {
    try {
      const [historyResp, savedResp, likedResp, downloadedResp] = await Promise.all([
        videosAPI.getWatchHistory(1, 100),
        videosAPI.getSavedVideos(1, 100),
        videosAPI.getLikedVideos(1, 100),
        videosAPI.getDownloadedVideos(1, 100)
      ])

      setSidebarData({
        history: historyResp.data || [],
        saved: savedResp.data || [],
        liked: likedResp.data || [],
        downloaded: downloadedResp.data || []
      })

      // Update tutorials with user interaction status
      setTutorials(prev => prev.map(tutorial => ({
        ...tutorial,
        isLiked: (likedResp.data || []).some((liked: any) => liked.id === tutorial.id),
        isSaved: (savedResp.data || []).some((saved: any) => saved.id === tutorial.id),
        isDownloaded: (downloadedResp.data || []).some((downloaded: any) => downloaded.id === tutorial.id),
        lastWatched: (historyResp.data || []).find((h: any) => h.id === tutorial.id)?.lastWatched,
        watchProgress: (historyResp.data || []).find((h: any) => h.id === tutorial.id)?.watchProgress,
        completed: (historyResp.data || []).find((h: any) => h.id === tutorial.id)?.completed
      })))

    } catch (error) {
      console.warn('⚠️ Could not load user interaction data:', error)
    }
  }

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
    if (!user) {
      navigate('/auth/login')
      return
    }

    try {
      if (action === 'watch') {
        // Record watch history and navigate to video player
        await videosAPI.watchVideo(tutorialId, { watchProgress: 0, watchDuration: 0 })
        navigate(`/video/${tutorialId}`)
        return
      }
      
      let response;
      if (action === 'like') {
        response = await videosAPI.likeVideo(tutorialId)
      } else if (action === 'save') {
        response = await videosAPI.saveVideo(tutorialId)
      } else if (action === 'download') {
        response = await videosAPI.downloadVideo(tutorialId)
      }
      
      // Update local state based on response
      setTutorials(prev => prev.map(tutorial => {
        if (tutorial.id === tutorialId) {
          const updated = { ...tutorial }
          switch (action) {
            case 'like':
              updated.isLiked = response?.isLiked || false
              break
            case 'save':
              updated.isSaved = response?.isSaved || false
              break
            case 'download':
              updated.isDownloaded = response?.isDownloaded || false
              break
          }
          return updated
        }
        return tutorial
      }))
      
      // Refresh user interaction data
      await loadUserInteractionData()

    } catch (error) {
      console.error(`Failed to ${action} video:`, error)
      alert(`Failed to ${action} video. Please try again.`)
    }
  }

  const handleCardClick = (tutorialId: string) => {
    handleTutorialAction(tutorialId, 'watch')
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

  const formatTopicName = (topic: string) => {
    return topic
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100'
      case 'Intermediate': return 'text-amber-600 bg-amber-100'
      case 'Advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
        <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{modalTitles[activeModal]}</h2>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {modalData.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  {activeModal === 'history' && <History className="h-16 w-16 mx-auto" />}
                  {activeModal === 'saved' && <Bookmark className="h-16 w-16 mx-auto" />}
                  {activeModal === 'liked' && <Heart className="h-16 w-16 mx-auto" />}
                  {activeModal === 'downloaded' && <Download className="h-16 w-16 mx-auto" />}
                </div>
                <p className="text-gray-500 text-lg">No tutorials found in {activeModal}</p>
                <p className="text-gray-400 text-sm mt-2">Start exploring to build your collection!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modalData.map((tutorial) => (
                  <div key={tutorial.id} 
                       className="group cursor-pointer"
                       onClick={() => handleCardClick(tutorial.id)}>
                    <div className="relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-full h-36 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                        {tutorial.duration}
                      </div>
                      {tutorial.watchProgress && tutorial.watchProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                          <div 
                            className="h-full bg-red-600 transition-all duration-300"
                            style={{ width: `${tutorial.watchProgress}%` }}
                          />
                        </div>
                      )}
                      {tutorial.completed && (
                        <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {tutorial.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{tutorial.instructor}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{formatViews(tutorial.views)} views</span>
                        <span className="mx-1">•</span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Left Sidebar - Fixed Position YouTube-like */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0 z-10`}>
          <div className="p-4">
            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
              <button 
                className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => navigate('/')}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </button>
            </div>

            {/* User Library Section */}
            {user && (
              <>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 px-3">Library</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveModal('history')}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <History className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">History</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {sidebarData.history.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveModal('saved')}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Bookmark className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">Saved</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {sidebarData.saved.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveModal('liked')}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <ThumbsUp className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">Liked videos</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {sidebarData.liked.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveModal('downloaded')}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Download className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">Downloads</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {sidebarData.downloaded.length}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Topics Filter */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3 px-3">
                <h3 className="text-sm font-medium text-gray-900">Topics</h3>
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {Array.from(new Set(tutorials.map(t => t.category))).map(topic => (
                  <label key={topic} className="flex items-center space-x-2 px-3 py-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => {
                        setSelectedTopics(prev => 
                          prev.includes(topic) 
                            ? prev.filter(t => t !== topic) 
                            : [...prev, topic]
                        )
                      }}
                      className="form-checkbox h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{formatTopicName(topic)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Tutorial Hub</h1>
                  <p className="text-sm text-gray-600">Discover and learn with curated tutorials</p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center flex-1 max-w-2xl mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search tutorials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button className="absolute right-0 top-0 h-full px-4 bg-gray-50 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-100">
                    <Search className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Grid - YouTube-like */}
          <div className="p-6">
            {selectedTopics.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm text-gray-600">Filtered by:</span>
                  {selectedTopics.map(topic => (
                    <span 
                      key={topic}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {formatTopicName(topic)}
                      <button 
                        onClick={() => setSelectedTopics(prev => prev.filter(t => t !== topic))}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button 
                    onClick={() => setSelectedTopics([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {topicFilteredTutorials.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <Play className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No tutorials found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
                {topicFilteredTutorials.map((tutorial) => (
                  <div 
                    key={tutorial.id} 
                    className="group cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
                    onMouseEnter={() => setHoveredVideo(tutorial.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                    onClick={() => handleCardClick(tutorial.id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/320/180';
                        }}
                      />
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                        {tutorial.duration}
                      </div>
                      
                      {/* Difficulty Badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                        getDifficultyColor(tutorial.difficulty)
                      }`}>
                        {tutorial.difficulty}
                      </div>

                      {/* Watch Progress Bar */}
                      {tutorial.watchProgress && tutorial.watchProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                          <div 
                            className="h-full bg-red-600 transition-all duration-300"
                            style={{ width: `${tutorial.watchProgress}%` }}
                          />
                        </div>
                      )}

                      {/* Completion Check */}
                      {tutorial.completed && (
                        <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {/* Hover Action Buttons */}
                      {hoveredVideo === tutorial.id && user && (
                        <div className="absolute bottom-2 left-2 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTutorialAction(tutorial.id, 'save')
                            }}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              tutorial.isSaved 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-black bg-opacity-60 text-white hover:bg-black hover:bg-opacity-80'
                            }`}
                            title={tutorial.isSaved ? 'Saved' : 'Save'}
                          >
                            <Bookmark className={`h-4 w-4 ${tutorial.isSaved ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTutorialAction(tutorial.id, 'like')
                            }}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              tutorial.isLiked 
                                ? 'bg-red-600 text-white' 
                                : 'bg-black bg-opacity-60 text-white hover:bg-black hover:bg-opacity-80'
                            }`}
                            title={tutorial.isLiked ? 'Liked' : 'Like'}
                          >
                            <ThumbsUp className={`h-4 w-4 ${tutorial.isLiked ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTutorialAction(tutorial.id, 'download')
                            }}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              tutorial.isDownloaded 
                                ? 'bg-green-600 text-white' 
                                : 'bg-black bg-opacity-60 text-white hover:bg-black hover:bg-opacity-80'
                            }`}
                            title={tutorial.isDownloaded ? 'Downloaded' : 'Download'}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="mt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {tutorial.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 hover:text-gray-900 cursor-pointer">
                            {tutorial.instructor}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span>{formatViews(tutorial.views)} views</span>
                            <span className="mx-1">•</span>
                            <span>{formatDate(tutorial.publishedAt)}</span>
                          </div>
                        </div>
                        
                        {/* More Options Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('More options for', tutorial.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modal */}
      {renderModal()}
    </div>
  )
}

export default TutorialHub
