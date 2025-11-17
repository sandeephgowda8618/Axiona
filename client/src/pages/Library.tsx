import React, { useState, useEffect } from 'react'
import { 
  Filter, 
  Search,
  Plus,
  BookOpen,
  Star,
  ChevronRight,
  ChevronLeft,
  Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton'
import { LibraryBook } from '../types/library'
import { useProgress } from '../contexts/ProgressContext'
import axios from '../api/axios'

const Library: React.FC = () => {
  const navigate = useNavigate()
  const { trackMaterialActivity, currentWeek } = useProgress()
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [filteredBooks, setFilteredBooks] = useState<LibraryBook[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating' | 'title' | 'author'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to get display title - shows subject if title is a placeholder
  const getDisplayTitle = (book: LibraryBook) => {
    const title = book.title || ''
    
    // Check if title is a placeholder pattern like "comp(xx).pdf" or similar generic filenames
    const isPlaceholder = (
      /^comp\(\d+\)\.pdf$/i.test(title) ||
      /^[a-zA-Z]+\(\d+\)\.pdf$/i.test(title) ||
      /^[a-zA-Z]+\d*\.pdf$/i.test(title) ||
      title.toLowerCase().includes('placeholder') ||
      title === '' ||
      title === 'undefined'
    )
    
    // If it's a placeholder, return the subject, otherwise return the original title
    return isPlaceholder ? (book.subject || title) : title
  }

  // Fetch books from pipeline API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError(null)
        // Request a large limit to get all books (100+ books in pipeline DB)
        // Add timestamp to prevent caching issues
        const timestamp = Date.now()
        const response = await axios.get(`/pipeline/books?limit=1000&_t=${timestamp}`)
        
        console.log('📚 Books API Response:', response.data)
        
        if (response.data.success && response.data.data) {
          setBooks(response.data.data)
          setFilteredBooks(response.data.data)
          console.log(`✅ Loaded ${response.data.data.length} books from pipeline database`)
        } else {
          setError('Failed to fetch books from pipeline: ' + (response.data.message || 'Unknown error'))
          console.error('Failed to fetch books from pipeline:', response.data.message)
        }
      } catch (error) {
        setError('Error fetching books from pipeline: ' + (error as Error).message)
        console.error('Error fetching books from pipeline:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = books.filter(book => {
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
      const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject
      const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage
      const matchesSearch = getDisplayTitle(book).toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSubject && matchesLanguage && matchesSearch
    })

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        case 'popular':
          return b.downloadCount - a.downloadCount
        case 'rating':
          return b.rating - a.rating
        case 'title':
          return getDisplayTitle(a).localeCompare(getDisplayTitle(b))
        case 'author':
          return a.author.localeCompare(b.author)
        default:
          return 0
      }
    })

    setFilteredBooks(filtered)
    setCurrentPage(1)
  }, [books, selectedCategory, selectedSubject, selectedLanguage, searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage)

  const handleBookClick = (book: LibraryBook) => {
    console.log('📖 Book clicked:', {
      title: getDisplayTitle(book),
      originalTitle: book.title,
      pdfUrl: book.pdfUrl,
      gridFSFileId: book.gridFSFileId
    })

    // Track this PDF as a material activity for the current week
    trackMaterialActivity({
      type: 'pdf',
      id: book._id || book.gridFSFileId || `book_${Date.now()}`,
      title: getDisplayTitle(book),
      timestamp: Date.now(),
      pages: book.pages || undefined
    }, currentWeek)

    console.log(`📈 Tracked PDF opening: "${getDisplayTitle(book)}" for week ${currentWeek}`)
    
    // Use the pipeline GridFS endpoint with full URL for PDF viewing
    let pdfUrl = book.pdfUrl
    
    if (book.gridFSFileId) {
      // Ensure we use the full URL for PDF viewer
      pdfUrl = `http://localhost:5050/api/pipeline/files/${book.gridFSFileId}`
    } else if (book.pdfUrl && !book.pdfUrl.startsWith('http')) {
      // Convert relative URL to absolute
      pdfUrl = `http://localhost:5050${book.pdfUrl}`
    }
    
    if (!pdfUrl) {
      console.error('❌ No PDF URL available for book:', getDisplayTitle(book))
      alert('PDF not available for this book')
      return
    }
    
    console.log('🔗 Using PDF URL:', pdfUrl)
    
    navigate(`/library/reader/${book._id}`, { 
      state: { 
        book: {
          ...book,
          title: getDisplayTitle(book) // Use display title for reader
        },
        pdfUrl
      } 
    })
  }

  const resetFilters = () => {
    setSelectedCategory('all')
    setSelectedSubject('all')
    setSelectedLanguage('all')
    setSearchQuery('')
    setSortBy('recent')
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'borrowed':
        return 'bg-red-100 text-red-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen dashboard-bg">
      <FloatingWorkspaceButton
        content={{
          id: 'library',
          title: 'Digital Library',
          type: 'book' as const,
          url: `/library`,
          progress: 0
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
              <p className="mt-1 text-sm text-gray-600">Access our comprehensive collection of reference textbooks and academic resources</p>
            </div>
            <div>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Request Book</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search books by title, author, subject, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Categories</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Programming">Programming</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Subjects</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Statistics">Statistics</option>
                <option value="Programming">Programming</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Career">Career</option>
                <option value="Database">Database</option>
                <option value="Business Intelligence">Business Intelligence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Languages</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="recent">Recently Added</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title (A-Z)</option>
                <option value="author">Author (A-Z)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={resetFilters} className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg w-full justify-center hover:bg-gray-200">
                <Filter className="h-4 w-4" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
            <span>Showing {filteredBooks.length} of {books.length} books</span>
            <div className="flex items-center space-x-2">
              <span>View:</span>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <div className="w-4 h-4 flex flex-col space-y-1">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading library books...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center text-red-700">
              <span className="font-medium">Error loading books:</span>
              <span className="ml-2">{error}</span>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Books Grid / List */}
        {!loading && !error && (
        <div className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBooks.map(book => (
                <div 
                  key={book._id} 
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 flex flex-col cursor-pointer transform hover:scale-105"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <img 
                      src={book.coverImage || '/api/placeholder/120/160'} 
                      alt={getDisplayTitle(book)} 
                      className="w-20 h-28 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">{getDisplayTitle(book)}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {book.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {book.tags.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{book.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Rating and Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{book.rating}</span>
                          <span className="ml-1">({book.reviewCount})</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{book.downloadCount}</span>
                        </div>
                        {book.pages && (
                          <div>
                            <span>{book.pages} pages</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{book.description}</p>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(book.availability)}`}>
                        {book.availability}
                      </span>
                      <span className="text-xs text-gray-500">{book.subject}</span>
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>Read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBooks.map(book => (
                <div 
                  key={book._id} 
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <img 
                        src={book.coverImage || '/api/placeholder/80/120'} 
                        alt={getDisplayTitle(book)} 
                        className="w-16 h-20 object-cover rounded shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">{getDisplayTitle(book)}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{book.description}</p>
                        
                        {/* Tags and Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span>{book.rating} ({book.reviewCount})</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{book.downloadCount} views</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(book.availability)}`}>
                            {book.availability}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{book.subject}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center text-blue-600 font-medium">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>Read</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
            <button onClick={resetFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Clear Filters</button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="h-5 w-5" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Library
