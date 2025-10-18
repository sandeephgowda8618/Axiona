import React from 'react'
import { BookOpen, FileText, Video, Download, Star, Clock, Tag } from 'lucide-react'

const MyRack: React.FC = () => {
  const savedContent = [
    {
      id: 1,
      title: "React Fundamentals",
      type: "pdf",
      size: "2.4 MB",
      dateAdded: "2024-01-15",
      tags: ["React", "JavaScript", "Frontend"],
      rating: 4.5
    },
    {
      id: 2,
      title: "Data Structures Tutorial",
      type: "video",
      duration: "45:30",
      dateAdded: "2024-01-14",
      tags: ["DSA", "Algorithms", "Programming"],
      rating: 4.8
    },
    {
      id: 3,
      title: "Machine Learning Notes",
      type: "notes",
      wordCount: 1250,
      dateAdded: "2024-01-13",
      tags: ["ML", "AI", "Python"],
      rating: 4.2
    }
  ]

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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Rack</h1>
        <p className="text-gray-600 dark:text-gray-300">Your saved study materials and resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedContent.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
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

      {savedContent.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved content</h3>
          <p className="text-gray-600 dark:text-gray-300">Start saving your study materials to see them here.</p>
        </div>
      )}
    </div>
  )
}

export default MyRack