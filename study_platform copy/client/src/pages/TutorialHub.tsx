import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  Share2,
  MoreVertical,
  Star
} from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'history' | 'saved' | 'liked' | 'downloaded' | null>(null)
  const [sidebarData, setSidebarData] = useState<SidebarData>({
    history: [],
    saved: [],
    liked: [],
    downloaded: []
  })

  // Load tutorials dynamically with a safe fallback mock (removed later)
  useEffect(() => {
    const fallbackTutorials: Tutorial[] = [
      {
        id: '1',
        title: 'Introduction to SQL Databases',
        description: 'Learn the basics of relational databases and SQL queries with practical examples.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'dQw4w9WgXcQ', // Mock YouTube video ID
        duration: '15:42',
        views: 45823,
        publishedAt: new Date('2024-01-15'),
        category: 'Database Management',
        tags: ['SQL', 'Database', 'Backend'],
        instructor: 'Dr. Sarah Johnson',
        difficulty: 'Beginner',
        rating: 4.8,
        isLiked: false,
        isSaved: true,
        isDownloaded: false
      },
      {
        id: '2',
        title: 'TCP/IP Protocol Suite',
        description: 'Comprehensive guide to understanding TCP/IP networking protocols and their applications.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'xyz123abc',
        duration: '22:18',
        views: 32156,
        publishedAt: new Date('2024-02-10'),
        category: 'Computer Networks',
        tags: ['TCP/IP', 'Networking', 'Protocols'],
        instructor: 'Prof. Michael Chen',
        difficulty: 'Intermediate',
        rating: 4.6,
        isLiked: true,
        isSaved: false,
        isDownloaded: true,
        lastWatched: new Date('2024-09-15'),
        watchProgress: 65
      },
      {
        id: '3',
        title: 'Object-Oriented Programming in Java',
        description: 'Master the principles of OOP including inheritance, polymorphism, and encapsulation.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'abc456def',
        duration: '28:33',
        views: 67432,
        publishedAt: new Date('2024-01-28'),
        category: 'Object-Oriented Programming',
        tags: ['Java', 'OOP', 'Programming'],
        instructor: 'Dr. Emily Rodriguez',
        difficulty: 'Intermediate',
        rating: 4.9,
        isLiked: true,
        isSaved: true,
        isDownloaded: false,
        lastWatched: new Date('2024-09-20'),
        watchProgress: 30
      },
      {
        id: '4',
        title: 'Linux System Administration',
        description: 'Essential Linux commands and system administration techniques for beginners.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'def789ghi',
        duration: '18:45',
        views: 28934,
        publishedAt: new Date('2024-03-05'),
        category: 'Operating Systems',
        tags: ['Linux', 'System Admin', 'Command Line'],
        instructor: 'Mark Thompson',
        difficulty: 'Beginner',
        rating: 4.5,
        isLiked: false,
        isSaved: false,
        isDownloaded: true,
        lastWatched: new Date('2024-09-10'),
        watchProgress: 100
      },
      {
        id: '5',
        title: 'Arrays and Linked Lists',
        description: 'Fundamental data structures with implementation examples and use cases.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'ghi012jkl',
        duration: '24:12',
        views: 41287,
        publishedAt: new Date('2024-02-22'),
        category: 'Data Structures',
        tags: ['Arrays', 'Linked Lists', 'Data Structures'],
        instructor: 'Dr. Alex Kumar',
        difficulty: 'Intermediate',
        rating: 4.7,
        isLiked: true,
        isSaved: false,
        isDownloaded: false
      },
      {
        id: '6',
        title: 'Sorting and Searching Algorithms',
        description: 'Explore efficient sorting and searching techniques with time complexity analysis.',
        thumbnail: '/api/placeholder/320/180',
        videoId: 'jkl345mno',
        duration: '31:28',
        views: 53621,
        publishedAt: new Date('2024-03-12'),
        category: 'Algorithms',
        tags: ['Sorting', 'Searching', 'Algorithms'],
        instructor: 'Prof. Lisa Wang',
        difficulty: 'Advanced',
        rating: 4.8,
        isLiked: false,
        isSaved: true,
        isDownloaded: true,
        lastWatched: new Date('2024-09-18'),
        watchProgress: 85
      }
    ]

    let mounted = true
    ;(async () => {
      try {
        const { tutorialsAPI } = await import('../api/endpoints')
        const data = await tutorialsAPI.getTutorials()
        const items: Tutorial[] = Array.isArray(data) ? data : (data?.items ?? [])
        if (mounted && items.length) {
          setTutorials(items)
          setSidebarData({
            history: items.filter(t => t.lastWatched),
            saved: items.filter(t => t.isSaved),
            liked: items.filter(t => t.isLiked),
            downloaded: items.filter(t => t.isDownloaded)
          })
          return
        }
      } catch {}
      if (mounted) {
        setTutorials(fallbackTutorials)
        setSidebarData({
          history: fallbackTutorials.filter(t => t.lastWatched),
          saved: fallbackTutorials.filter(t => t.isSaved),
          liked: fallbackTutorials.filter(t => t.isLiked),
          downloaded: fallbackTutorials.filter(t => t.isDownloaded)
        })
      }
    })()

    return () => { mounted = false }
  }, [])

  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const allTopics = Array.from(new Set(tutorials.map(t => t.category))).sort()

  const filteredTutorials = useMemo(() => {
    return tutorials.filter(tutorial => {
      const q = searchQuery.toLowerCase()
      const matchesQuery = (
        tutorial.title.toLowerCase().includes(q) ||
        tutorial.description.toLowerCase().includes(q) ||
        tutorial.category.toLowerCase().includes(q) ||
        tutorial.instructor.toLowerCase().includes(q)
      )
      const matchesTopic = selectedTopics.length === 0 || selectedTopics.includes(tutorial.category)
      return matchesQuery && matchesTopic
    })
  }, [tutorials, searchQuery, selectedTopics])

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
  }

  // Stable action handler to avoid recreating closures passed to memoized cards
  const handleTutorialAction = useCallback((tutorialId: string, action: 'like' | 'save' | 'download') => {
    setTutorials(prev => {
      const updated = prev.map(tutorial => {
        if (tutorial.id === tutorialId) {
          const copy = { ...tutorial }
          switch (action) {
            case 'like':
              copy.isLiked = !copy.isLiked
              break
            case 'save':
              copy.isSaved = !copy.isSaved
              break
            case 'download':
              copy.isDownloaded = !copy.isDownloaded
              break
          }
          return copy
        }
        return tutorial
      })

      // Derive sidebar data from the updated tutorials array to avoid stale reads
      setSidebarData({
        history: updated.filter(t => t.lastWatched),
        saved: updated.filter(t => t.isSaved),
        liked: updated.filter(t => t.isLiked),
        downloaded: updated.filter(t => t.isDownloaded)
      })

      return updated
    })
  }, [setSidebarData, setTutorials])

  // Debounce search input for better UX and avoid excessive filtering on each keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchTerm.trim()), 250)
    return () => clearTimeout(id)
  }, [searchTerm])

  

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

  // Memoized TutorialCard to prevent re-rendering cards whose tutorial object hasn't changed
  type CardProps = {
    tutorial: Tutorial
    onAction: (id: string, action: 'like' | 'save' | 'download') => void
    onWatch: (id: string) => void
  }

  const TutorialCard: React.FC<CardProps> = React.memo(({ tutorial, onAction, onWatch }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" tabIndex={-1}>
        {/* Header: gray with centered category, extra padding */}
        <div className="bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-sm font-medium" style={{height: '64px', paddingTop: '12px', paddingBottom: '8px'}}>
          <span className="text-base font-medium">{tutorial.category}</span>
        </div>
        {/* Thumbnail */}
        <div className="bg-gray-100 flex items-center justify-center" style={{height: '160px'}}>
          <ThumbnailImage src={tutorial.thumbnail} alt={tutorial.title} className="w-56 h-32 object-cover rounded" />
        </div>
        {/* Title/Description */}
        <div className="px-5 pt-4 pb-2" style={{marginTop: '32px'}}>
          <h3 className="font-semibold text-gray-900 mb-1 text-lg leading-6">{tutorial.title}</h3>
          <p className="text-sm text-gray-600 mb-4 leading-5">{tutorial.description}</p>
          {/* Button row */}
          <div className="flex items-center gap-2 pb-2">
            <button
              aria-label={`Watch ${tutorial.title}`}
              onClick={() => onWatch(tutorial.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium shadow hover:bg-gray-800 focus:outline-none"
            >
              <Play className="h-4 w-4" />
              Watch
            </button>
            <button
              aria-label="Download tutorial"
              onClick={() => onAction(tutorial.id, 'download')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium shadow hover:bg-gray-100 focus:outline-none"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              aria-label="Add to playlist"
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-lg font-bold shadow hover:bg-gray-100 focus:outline-none"
            >
              +
            </button>
          </div>
        </div>
      </div>
    )
  }, (prev, next) => prev.tutorial === next.tutorial && prev.onAction === next.onAction && prev.onWatch === next.onWatch)

  // Memoized thumbnail image to avoid re-creating the <img> element when card props change
  const ThumbnailImage: React.FC<{ src: string; alt: string; className?: string }> = React.memo(({ src, alt, className }) => {
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22 viewBox=%220 0 320 180%22%3E%3Crect width=%22320%22 height=%22180%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2212%22 fill=%22%239ca3af%22%3EThumbnail%3C/text%3E%3C/svg%3E'
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget
      // don't reassign if already set to placeholder to avoid infinite loop
      if (img.src && !img.src.includes(placeholder)) img.src = placeholder
    }

    return (
      // keep attributes stable so React can reuse DOM node when parent re-renders
      <img
        src={src || placeholder}
        alt={alt}
        className={className}
        loading="lazy"
        width={320}
        height={180}
        onError={handleError}
        style={{ transform: 'translateZ(0)' }}
      />
    )
  }, (a, b) => a.src === b.src && a.alt === b.alt && a.className === b.className)

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
                      <ThumbnailImage src={tutorial.thumbnail} alt={tutorial.title} className="w-full h-40 object-cover" />
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
      {/* Light Navbar like reference */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Mobile: toggle filters */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                aria-label="Toggle filters"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                <span className="text-gray-900 font-semibold">Study-AI</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
              <Link to="/tutorial-hub" className="hover:text-gray-900">Tutorial Hub</Link>
              <Link to="/study-materials" className="hover:text-gray-900">StudyPES</Link>
              <Link to="/conference" className="hover:text-gray-900">Conference</Link>
              <Link to="/my-rack" className="hover:text-gray-900">My Rack</Link>
              <Link to="/dashboard" className="hover:text-gray-900">Profile</Link>
            </nav>

            <div className="hidden md:block">
              <Link to="/auth" className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700">Sign Up</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Collapsible Sidebar */}
        {/* Left Filters (visible on md+) */}
        <aside className="hidden md:block w-72 px-6">
          <div className="sticky top-20">
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">Filter by Topic</h4>
              <div className="space-y-4">
                {allTopics.map(topic => (
                  <label key={topic} className="flex items-center gap-3 py-1">
                    <input aria-label={`Filter by ${topic}`} type="checkbox" checked={selectedTopics.includes(topic)} onChange={() => toggleTopic(topic)} className="w-4 h-4" />
                    <span className="text-sm text-gray-700 leading-5">{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">Library</h4>
              <div className="space-y-2">
                <button onClick={() => setActiveModal('history')} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-2"><History className="h-4 w-4" /> History</span>
                  <span className="text-gray-500">{sidebarData.history.length}</span>
                </button>
                <button onClick={() => setActiveModal('saved')} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-2"><Bookmark className="h-4 w-4" /> Saved</span>
                  <span className="text-gray-500">{sidebarData.saved.length}</span>
                </button>
                <button onClick={() => setActiveModal('liked')} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> Liked</span>
                  <span className="text-gray-500">{sidebarData.liked.length}</span>
                </button>
                <button onClick={() => setActiveModal('downloaded')} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Downloaded</span>
                  <span className="text-gray-500">{sidebarData.downloaded.length}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer (kept in DOM, toggled with transform to avoid layout flicker) */}
        <div aria-hidden={!sidebarOpen} className={`md:hidden fixed inset-0 z-50 pointer-events-none`}> 
          <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${sidebarOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
          <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white p-4 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{willChange: 'transform'}}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Filters</h4>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close filters" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {allTopics.map(topic => (
                <label key={topic} className="flex items-center space-x-3">
                  <input aria-label={`Filter by ${topic}`} type="checkbox" checked={selectedTopics.includes(topic)} onChange={() => toggleTopic(topic)} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">{topic}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <nav className="text-sm text-gray-500 mb-2">Home &gt; <span className="text-gray-700">Tutorial Hub</span></nav>
                <h1 className="text-2xl font-bold text-gray-900">Tutorial Hub</h1>
                <p className="text-gray-600">Discover and learn with our curated video tutorials</p>
              </div>
              {/* Mobile filter toggle */}
              <div className="md:hidden">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-3 py-2 bg-gray-100 rounded-md">Filters</button>
              </div>
            </div>
            {/* Move search into content area, with button to the right */}
            <div className="mt-4 max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search tutorials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-4 pr-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-gray-500 text-gray-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery(searchTerm.trim())}
                  className="shrink-0 h-10 px-5 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                >
                  <Search className="h-5 w-5 text-white" />
                  <span>Search</span>
                </button>
              </div>
            </div>
            {/* Topic chips */}
            {allTopics.length > 0 && (
              <div className="mt-4 -mx-1 flex items-center gap-2 overflow-x-auto pb-1">
                {allTopics.map(topic => {
                  const active = selectedTopics.includes(topic)
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {topic}
                    </button>
                  )
                })}
                {selectedTopics.length > 0 && (
                  <button onClick={() => setSelectedTopics([])} className="ml-2 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200">Clear</button>
                )}
                <span className="ml-auto text-sm text-gray-500 whitespace-nowrap">Showing {filteredTutorials.length} of {tutorials.length}</span>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                onAction={handleTutorialAction}
                onWatch={(id) => navigate(`/tutorial-player/${id}`)}
              />
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
