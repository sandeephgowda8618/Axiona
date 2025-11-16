import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Download,
  Clock,
  User,
  Tag,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'
import { studyPESRAGService } from '../services/studyPESRAG'
import { StudyMaterialsResponse, StudySubject, StudyMaterial } from '../types/studymaterials'

const StudyMaterialsRAG: React.FC = () => {
  const [materialsData, setMaterialsData] = useState<StudyMaterialsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading StudyPES materials from RAG system...')
      
      const data = await studyPESRAGService.getStudyMaterials()
      console.log('✅ Materials loaded:', data)
      
      setMaterialsData(data)
    } catch (err) {
      console.error('❌ Error loading materials:', err)
      setError('Failed to load study materials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject)
    } else {
      newExpanded.add(subject)
    }
    setExpandedSubjects(newExpanded)
  }

  const handleMaterialClick = (material: StudyMaterial) => {
    if (material.file_url) {
      // Open PDF in new tab or navigate to PDF viewer
      window.open(material.file_url, '_blank')
    }
  }

  const getSubjectColor = (subject: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
    ]
    const index = subject.length % colors.length
    return colors[index]
  }

  const filteredSubjects = materialsData?.subjects.filter(subject => {
    const matchesSearch = searchQuery === '' || 
      subject.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedSubject === 'all' || subject.subject === selectedSubject
    return matchesSearch && matchesFilter
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading StudyPES materials...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadMaterials}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">StudyPES Materials</h1>
                <p className="text-gray-600 mt-2">
                  Access {materialsData?.totalMaterials} materials across {materialsData?.totalSubjects} subjects
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">RAG Powered</div>
                  <div className="text-xs text-blue-500">AI-Enhanced Search</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {materialsData?.subjects.map(subject => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Subjects List */}
        <div className="space-y-6">
          {filteredSubjects.map((subject) => (
            <div key={subject.subject} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Subject Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSubject(subject.subject)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`bg-gradient-to-r ${getSubjectColor(subject.subject)} rounded-lg p-3`}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{subject.subject}</h2>
                      <p className="text-gray-600">
                        Semester {subject.semester} • {subject.totalUnits} units • {subject.totalMaterials} materials
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Pages</div>
                      <div className="text-lg font-semibold text-gray-900">{subject.totalPages}</div>
                    </div>
                    {expandedSubjects.has(subject.subject) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Units (Expanded Content) */}
              {expandedSubjects.has(subject.subject) && (
                <div className="border-t bg-gray-50">
                  <div className="p-6">
                    <div className="grid gap-6">
                      {subject.units.map((unit) => (
                        <div key={unit.unit} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Unit {unit.unit}
                            </h3>
                            <div className="text-sm text-gray-500">
                              {unit.totalMaterials} materials • {unit.totalPages} pages
                            </div>
                          </div>
                          
                          {/* Materials in this unit */}
                          <div className="grid gap-3">
                            {unit.materials.map((material) => (
                              <div 
                                key={material.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => handleMaterialClick(material)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {material.title}
                                    </h4>
                                    {material.topic && (
                                      <p className="text-sm text-gray-600 mt-1">{material.topic}</p>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                      <div className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        {material.author}
                                      </div>
                                      <div className="flex items-center">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {material.pages} pages
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {material.level}
                                      </div>
                                    </div>
                                    {material.tags && (
                                      <div className="flex items-center mt-2">
                                        <Tag className="h-3 w-3 mr-1 text-gray-400" />
                                        <div className="flex flex-wrap gap-1">
                                          {material.tags.split(',').slice(0, 3).map((tag, index) => (
                                            <span 
                                              key={index}
                                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                            >
                                              {tag.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {material.file_url && (
                                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                    )}
                                    <Download className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No subjects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyMaterialsRAG
