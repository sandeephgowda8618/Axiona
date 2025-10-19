import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Filter, 
  Search,
  Plus,
  BookOpen,
  Calendar,
  User,
  Star,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Eye,
  Heart,
  Share2
} from 'lucide-react'
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton'

interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string
  publisher: string
  edition: string
  subject: string
  category: string
  year: number
  pages: number
  language: string
  rating: number
  reviewCount: number
  description: string
  coverImage: string
  downloadUrl?: string
  previewUrl?: string
  fileSize?: string
  availability: 'available' | 'borrowed' | 'reserved'
  addedDate: Date
  downloadCount: number
  isFavorite: boolean
  tags: string[]
}

const Library: React.FC = () => {
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

  // Mock data
  useEffect(() => {
    const mockBooks: LibraryBook[] = [
      {
        id: '1',
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson',
        isbn: '978-0262033848',
        publisher: 'MIT Press',
        edition: '3rd Edition',
        subject: 'Computer Science',
        category: 'Algorithms',
        year: 2009,
        pages: 1312,
        language: 'English',
        rating: 4.8,
        reviewCount: 2847,
        description: 'A comprehensive textbook on computer algorithms that covers a broad range of algorithms in depth.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '45.2 MB',
        availability: 'available',
        addedDate: new Date('2024-09-15'),
        downloadCount: 15420,
        isFavorite: true,
        tags: ['algorithms', 'data-structures', 'computer-science', 'programming']
      },
      {
        id: '2',
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth',
        isbn: '978-0073523323',
        publisher: 'McGraw-Hill',
        edition: '7th Edition',
        subject: 'Database Systems',
        category: 'Database',
        year: 2019,
        pages: 1376,
        language: 'English',
        rating: 4.5,
        reviewCount: 1923,
        description: 'Comprehensive introduction to database systems with a focus on database design and implementation.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '38.7 MB',
        availability: 'available',
        addedDate: new Date('2024-09-12'),
        downloadCount: 8765,
        isFavorite: false,
        tags: ['database', 'sql', 'dbms', 'data-modeling']
      },
      {
        id: '3',
        title: 'Computer Organization and Design',
        author: 'David A. Patterson, John L. Hennessy',
        isbn: '978-0124077263',
        publisher: 'Morgan Kaufmann',
        edition: '5th Edition',
        subject: 'Computer Architecture',
        category: 'Hardware',
        year: 2013,
        pages: 793,
        language: 'English',
        rating: 4.6,
        reviewCount: 1456,
        description: 'The hardware/software interface with a focus on computer organization and design principles.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '52.1 MB',
        availability: 'borrowed',
        addedDate: new Date('2024-09-10'),
        downloadCount: 6234,
        isFavorite: true,
        tags: ['computer-architecture', 'hardware', 'mips', 'assembly']
      },
      {
        id: '4',
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin',
        isbn: '978-1118063330',
        publisher: 'Wiley',
        edition: '10th Edition',
        subject: 'Operating Systems',
        category: 'System Software',
        year: 2018,
        pages: 944,
        language: 'English',
        rating: 4.4,
        reviewCount: 2134,
        description: 'Comprehensive coverage of operating system concepts including process management and memory management.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '41.3 MB',
        availability: 'available',
        addedDate: new Date('2024-09-08'),
        downloadCount: 9876,
        isFavorite: false,
        tags: ['operating-systems', 'processes', 'memory-management', 'scheduling']
      },
      {
        id: '5',
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        isbn: '978-0134610993',
        publisher: 'Pearson',
        edition: '4th Edition',
        subject: 'Artificial Intelligence',
        category: 'AI/ML',
        year: 2020,
        pages: 1136,
        language: 'English',
        rating: 4.7,
        reviewCount: 3421,
        description: 'The leading textbook in Artificial Intelligence, comprehensive and up-to-date introduction to AI.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '67.8 MB',
        availability: 'reserved',
        addedDate: new Date('2024-09-05'),
        downloadCount: 12543,
        isFavorite: true,
        tags: ['artificial-intelligence', 'machine-learning', 'ai', 'algorithms']
      },
      {
        id: '6',
        title: 'Software Engineering: A Practitioner\'s Approach',
        author: 'Roger S. Pressman, Bruce R. Maxim',
        isbn: '978-0078022128',
        publisher: 'McGraw-Hill',
        edition: '8th Edition',
        subject: 'Software Engineering',
        category: 'Software Development',
        year: 2014,
        pages: 976,
        language: 'English',
        rating: 4.3,
        reviewCount: 1789,
        description: 'Comprehensive guide to software engineering practices and methodologies.',
        coverImage: '/api/placeholder/300/400',
        downloadUrl: '#',
        previewUrl: '#',
        fileSize: '35.4 MB',
        availability: 'available',
        addedDate: new Date('2024-09-01'),
        downloadCount: 5432,
        isFavorite: false,
        tags: ['software-engineering', 'sdlc', 'agile', 'testing']
      }
    ]

    setBooks(mockBooks)
    setFilteredBooks(mockBooks)
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = books.filter(book => {
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
      const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject
      const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          return a.title.localeCompare(b.title)
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

  const handleDownload = (book: LibraryBook) => {
    console.log(`Downloading: ${book.title}`)
    setBooks(prev => 
      prev.map(b => 
        b.id === book.id 
          ? { ...b, downloadCount: b.downloadCount + 1 }
          : b
      )
    )
  }

  const toggleFavorite = (bookId: string) => {
    setBooks(prev => 
      prev.map(book => 
        book.id === bookId 
          ? { ...book, isFavorite: !book.isFavorite }
          : book
      )
    )
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
        context={{
          type: 'book',
          content: {
            title: 'Digital Library',
            books: filteredBooks,
            filters: { selectedCategory, selectedSubject, selectedLanguage, searchQuery }
          }
        }}
      />

      {/* Header */}
      <div className="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Categories</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Database">Database</option>
                <option value="Hardware">Hardware</option>
                <option value="System Software">System Software</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Software Development">Software Development</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Subjects</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Database Systems">Database Systems</option>
                <option value="Computer Architecture">Computer Architecture</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Software Engineering">Software Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg w-full justify-center">
                <Filter className="h-4 w-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Books Grid / List */}
        <div className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBooks.map(book => (
                <div key={book.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                  <div className="flex items-start space-x-4">
                    <img src={book.coverImage} alt={book.title} className="w-24 h-32 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{book.title}</h3>
                      <p className="text-sm text-gray-600">{book.author}</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">{book.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(book.availability)}`}>{book.availability}</span>
                      <button onClick={() => handleDownload(book)} className="text-sm text-blue-600 hover:underline flex items-center space-x-1"><Download className="w-4 h-4" /> <span>Download</span></button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => toggleFavorite(book.id)} className={`p-2 rounded ${book.isFavorite ? 'text-red-600' : 'text-gray-400'}`}><Heart className="w-4 h-4" /></button>
                      <button className="p-2 rounded text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBooks.map(book => (
                <div key={book.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{book.title}</h3>
                      <p className="text-sm text-gray-600">{book.author}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleDownload(book)} className="text-sm text-blue-600 hover:underline flex items-center space-x-1"><Download className="w-4 h-4" /> <span>Download</span></button>
                      <button onClick={() => toggleFavorite(book.id)} className={`p-2 rounded ${book.isFavorite ? 'text-red-600' : 'text-gray-400'}`}><Heart className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
            <button onClick={resetFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Clear Filters</button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
