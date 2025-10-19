import React, { useState } from 'react'
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Star,
  Clock,
  Tag,
  Trash,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const MyRack: React.FC = () => {
  const initialSavedContent = [
    { id: 1, title: 'Quantum Mechanics Fundamentals', type: 'pdf', size: '1.8 MB', dateAdded: '2024-12-08', tags: ['Physics'], rating: 4.6 },
    { id: 2, title: 'Machine Learning Algorithms Overview', type: 'notes', wordCount: 980, dateAdded: '2024-12-07', tags: ['Computer Science'], rating: 4.7 },
    { id: 3, title: 'Organic Chemistry Reactions', type: 'pdf', size: '3.1 MB', dateAdded: '2024-12-06', tags: ['Chemistry'], rating: 4.3 },
    { id: 4, title: 'World War II Timeline', type: 'notes', wordCount: 1500, dateAdded: '2024-12-05', tags: ['History'], rating: 4.4 },
    { id: 5, title: 'Calculus Integration Techniques', type: 'pdf', size: '2.0 MB', dateAdded: '2024-12-04', tags: ['Mathematics'], rating: 4.5 },
    { id: 6, title: 'Cell Biology Structures', type: 'notes', wordCount: 760, dateAdded: '2024-12-03', tags: ['Biology'], rating: 4.2 },
    { id: 7, title: 'Linear Algebra Cheat Sheet', type: 'pdf', size: '1.2 MB', dateAdded: '2024-12-02', tags: ['Mathematics'], rating: 4.1 },
    { id: 8, title: 'Introduction to Thermodynamics', type: 'video', duration: '32:10', dateAdded: '2024-12-01', tags: ['Physics'], rating: 4.6 },
    { id: 9, title: 'Organic Synthesis Notes', type: 'pdf', size: '2.7 MB', dateAdded: '2024-11-30', tags: ['Chemistry'], rating: 4.0 },
    { id: 10, title: 'Programming Patterns', type: 'notes', wordCount: 860, dateAdded: '2024-11-29', tags: ['Computer Science'], rating: 4.8 },
    { id: 11, title: 'Genetics Overview', type: 'pdf', size: '2.9 MB', dateAdded: '2024-11-28', tags: ['Biology'], rating: 4.3 },
    { id: 12, title: 'Discrete Math Problems', type: 'notes', wordCount: 1120, dateAdded: '2024-11-27', tags: ['Mathematics'], rating: 4.2 },
  ]

  const [items, setItems] = useState(initialSavedContent)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />
      case 'notes':
        return <BookOpen className="w-5 h-5 text-green-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage)

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    setItems((prev) => prev.filter((it) => !selectedIds.includes(it.id)))
    setSelectedIds([])
    // keep current page valid
    setCurrentPage((p) => Math.min(p, Math.max(1, Math.ceil((totalItems - selectedIds.length) / itemsPerPage))))
  }

  const handleExportTxt = () => {
    const toExport = selectedIds.length > 0 ? items.filter((it) => selectedIds.includes(it.id)) : items
    const text = toExport
      .map((it) => `${it.title} — ${it.tags.join(', ')} — Added ${it.dateAdded}`)
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my_rack_export.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Rack — Study-AI Mini</h1>
          <p className="text-gray-600 dark:text-gray-300">Study Notes Collection<br /><span className="text-sm text-gray-500">Manage and organize your saved study materials</span></p>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleExportTxt} className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md">
            <Download className="w-4 h-4 mr-2" />
            Export TXT
          </button>
          <button onClick={handleDeleteSelected} className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md">
            <Trash className="w-4 h-4 mr-2" />
            Delete Selected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map((item) => (
          <div key={item.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleSelect(item.id)}
              className="absolute top-4 left-4 w-4 h-4"
            />
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getIconForType(item.type)}
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                  {item.type}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{item.rating}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {item.title}
            </h3>

            <div className="space-y-2 mb-4">
              {item.type === 'pdf' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Download className="w-4 h-4" />
                  <span>{item.size}</span>
                </div>
              )}
              {item.type === 'video' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{item.duration}</span>
                </div>
              )}
              {item.type === 'notes' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <FileText className="w-4 h-4" />
                  <span>{item.wordCount} words</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Added {item.dateAdded}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Open {item.type === 'pdf' ? 'PDF' : item.type === 'video' ? 'Video' : 'Notes'}
            </button>
          </div>
        ))}
      </div>

      {/* Footer / pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} notes • Last updated 2 hours ago</div>
        <div className="flex items-center space-x-2">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1
            return (
              <button key={page} onClick={() => goToPage(page)} className={`px-3 py-1 rounded-md ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                {page}
              </button>
            )
          })}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyRack