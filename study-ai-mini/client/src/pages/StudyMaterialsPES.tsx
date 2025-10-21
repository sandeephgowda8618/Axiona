import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Filter, 
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  MoreVertical
} from 'lucide-react'
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton'
import { studyMaterialsAPI } from '../api/studyAI'

interface StudyMaterial {
  id: string
  title: string
  subject: string
  class: string
  year: string
  pages: number
  downloadUrl: string
  thumbnail: string
  author?: string
  description?: string
  uploadDate: Date
  downloadCount: number
  fileSize: string
  category: 'lecture-notes' | 'assignments' | 'past-papers' | 'reference'
}

const StudyMaterialsPES: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title' | 'subject'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Load materials and metadata from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load materials
        const filters = {
          ...(selectedSubject !== 'all' && { subject: selectedSubject }),
          ...(selectedClass !== 'all' && { class: selectedClass }),
          ...(searchQuery && { search: searchQuery }),
          sortBy
        }
        
        const materialsResponse = await studyMaterialsAPI.getAllMaterials(1, 100, filters)
        setMaterials(materialsResponse.materials || [])
        setFilteredMaterials(materialsResponse.materials || [])
        
        // Load metadata
        const [subjectsData, classesData, categoriesData] = await Promise.all([
          studyMaterialsAPI.getSubjects(),
          studyMaterialsAPI.getClasses(),
          studyMaterialsAPI.getCategories()
        ])
        
        setSubjects(subjectsData)
        setClasses(classesData)
        setCategories(categoriesData)
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to load study materials:', error)
        setError('Failed to load study materials')
        setLoading(false)
      }
    }

    loadData()
  }, [selectedSubject, selectedClass, searchQuery, sortBy])

  // Handle download
      {
        id: '1',
        title: 'Operating Systems Fundamentals',
        subject: 'IT',
        class: '3rd Year',
        year: 'CS',
        pages: 42,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Prof. Smith',
        description: 'Comprehensive guide to operating system concepts',
        uploadDate: new Date('2024-09-15'),
        downloadCount: 1250,
        fileSize: '2.5 MB',
        category: 'lecture-notes'
      },
      {
        id: '2',
        title: 'Database Design Principles',
        subject: 'IT',
        class: '2nd Year',
        year: 'DBMS',
        pages: 38,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Dr. Johnson',
        description: 'Database design and normalization principles',
        uploadDate: new Date('2024-09-10'),
        downloadCount: 890,
        fileSize: '1.8 MB',
        category: 'lecture-notes'
      },
      {
        id: '3',
        title: 'Computer Architecture Basics',
        subject: 'CS',
        class: '2nd Year',
        year: 'COA',
        pages: 56,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Prof. Williams',
        description: 'Introduction to computer architecture and organization',
        uploadDate: new Date('2024-09-08'),
        downloadCount: 742,
        fileSize: '3.2 MB',
        category: 'reference'
      },
      {
        id: '4',
        title: 'Advanced Database Concepts',
        subject: 'CS',
        class: '3rd Year',
        year: 'DBMS',
        pages: 64,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Dr. Brown',
        description: 'Advanced topics in database management systems',
        uploadDate: new Date('2024-09-05'),
        downloadCount: 623,
        fileSize: '4.1 MB',
        category: 'reference'
      },
      {
        id: '5',
        title: 'Process Management in OS',
        subject: 'IT',
        class: '3rd Year',
        year: 'OS',
        pages: 28,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Prof. Davis',
        description: 'Process scheduling and management techniques',
        uploadDate: new Date('2024-09-01'),
        downloadCount: 445,
        fileSize: '1.5 MB',
        category: 'assignments'
      },
      {
        id: '6',
        title: 'Memory Management Systems',
        subject: 'CS',
        class: '3rd Year',
        year: 'COA',
        pages: 47,
        downloadUrl: '#',
        thumbnail: '/api/placeholder/300/400',
        author: 'Dr. Wilson',
        description: 'Memory allocation and management strategies',
        uploadDate: new Date('2024-08-28'),
        downloadCount: 567,
        fileSize: '2.8 MB',
        category: 'lecture-notes'
      }
    ]

    loadData()
  }, [selectedSubject, selectedClass, searchQuery, sortBy])

  // Handle download
  const handleDownload = async (material: StudyMaterial) => {
    try {
      const response = await studyMaterialsAPI.downloadMaterial(material.id)
      
      // Update download count locally
      setMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { ...m, downloadCount: response.downloadCount }
          : m
      ))
      setFilteredMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { ...m, downloadCount: response.downloadCount }
          : m
      ))
      
      // Open download URL
      window.open(response.downloadUrl, '_blank')
    } catch (error) {
      console.error('Failed to download material:', error)
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = materials.filter(material => {
      const matchesClass = selectedClass === 'all' || material.class === selectedClass
      const matchesYear = selectedYear === 'all' || material.year === selectedYear
      const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject
      const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           material.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           material.author?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesClass && matchesYear && matchesSubject && matchesSearch
    })

    // Sort materials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case 'popular':
          return b.downloadCount - a.downloadCount
        case 'title':
          return a.title.localeCompare(b.title)
        case 'subject':
          return a.subject.localeCompare(b.subject)
        default:
          return 0
      }
    })

    setFilteredMaterials(filtered)
    setCurrentPage(1)
  }, [materials, selectedClass, selectedYear, selectedSubject, searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage)

  const handleDownload = (material: StudyMaterial) => {
    // Simulate download
    console.log(`Downloading: ${material.title}`)
    // In a real app, this would trigger the actual download
    setMaterials(prev => 
      prev.map(m => 
        m.id === material.id 
          ? { ...m, downloadCount: m.downloadCount + 1 }
          : m
      )
    )
  }

  const resetFilters = () => {
    setSelectedClass('all')
    setSelectedYear('all')
    setSelectedSubject('all')
    setSearchQuery('')
    setSortBy('recent')
  }

  return (
    <div className="min-h-screen">
      {/* Floating Workspace Button */}
      <FloatingWorkspaceButton 
        context={{
          type: 'material',
          content: { 
            title: 'Study Materials - PES',
            materials: filteredMaterials,
            filters: { selectedClass, selectedYear, selectedSubject, searchQuery }
          }
        }} 
      />
      {/* Header */}
      <div className="nav-header">
        <div className="container">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Study Materials</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Access comprehensive study materials and resources for your courses
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Upload button intentionally removed per design request */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Years</option>
                <option value="CS">CS</option>
                <option value="IT">IT</option>
                <option value="DBMS">DBMS</option>
                <option value="COA">COA</option>
                <option value="OS">OS</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                <option value="CS">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="MATH">Mathematics</option>
                <option value="ENG">Engineering</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full justify-center"
              >
                <Filter className="h-4 w-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject, or author..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Sort by: Recent</option>
                <option value="popular">Sort by: Popular</option>
                <option value="title">Sort by: Title</option>
                <option value="subject">Sort by: Subject</option>
              </select>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredMaterials.length} study materials
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid-cards mb-8">
          {paginatedMaterials.map((material) => (
            <div key={material.id} className="material-card hover-lift">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center rounded-t-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">PDF Document</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {material.title}
                  </h3>
                  <button className="btn-ghost p-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{material.subject}</span>
                    <span>•</span>
                    <span>{material.class}</span>
                    <span>•</span>
                    <span>{material.year}</span>
                  </div>
                  
                  {material.author && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{material.author}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{material.pages} pages</span>
                    <span>•</span>
                    <span>{material.fileSize}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{material.uploadDate.toLocaleDateString()}</span>
                  </div>
                </div>

                {material.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {material.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {material.downloadCount.toLocaleString()} downloads
                  </span>
                  <button
                    onClick={() => handleDownload(material)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={resetFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyMaterialsPES
