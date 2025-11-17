import React, { useState, useEffect } from 'react'
import { BookOpen, Download, ExternalLink, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'
import NotesManager from '../components/NotesManager'

const MyRack: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  const [savedFiles, setSavedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load saved files when component mounts
  useEffect(() => {
    const loadSavedFiles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const files = await apiService.getSavedMaterials(user.id);
        setSavedFiles(files);
        setError(null);
      } catch (error) {
        console.error('❌ Error loading saved files:', error);
        setError('Failed to load saved files');
      } finally {
        setLoading(false);
      }
    };

    loadSavedFiles();
  }, [user]);

  // Remove saved file
  const handleRemoveFile = async (materialId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to remove this file from your saved collection?')) {
      return;
    }

    try {
      await apiService.unsaveMaterial(materialId, user.id);
      setSavedFiles(savedFiles.filter(file => file.materialId !== materialId));
    } catch (error) {
      console.error('❌ Error removing saved file:', error);
      alert('Failed to remove file');
    }
  };

  // Open saved file
  const handleOpenFile = (file: any) => {
    if (file.materialType === 'pes_material') {
      // Navigate to PES material viewer - you might need to adjust this route
      navigate(`/studypes/${encodeURIComponent(file.subject)}`);
    } else if (file.materialType === 'reference_book') {
      // Navigate to book reader
      navigate(`/library/reader/${file.materialId}`, {
        state: {
          book: {
            _id: file.materialId,
            title: file.title,
            subject: file.subject,
            author: file.author,
            pages: file.pages,
            description: file.description,
            gridFSFileId: file.gridFSFileId,
            fileName: file.fileName
          },
          pdfUrl: file.gridFSFileId ? `http://localhost:5050/api/pipeline/files/${file.gridFSFileId}` : null
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">My Study Rack</h1>
            <p className="text-gray-600 dark:text-gray-300">Access your saved PDFs, notes, and study materials</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Files
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Notes
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'files' ? (
          // Files Tab Content - Show Saved Files
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your saved files...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Files</h3>
                <p className="text-gray-500">{error}</p>
              </div>
            ) : !user ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Please Sign In</h3>
                <p className="text-gray-500">Sign in to view your saved files and materials.</p>
              </div>
            ) : savedFiles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Saved Files Yet</h3>
                <p className="text-gray-500">Start saving your favorite study materials and they'll appear here.</p>
                <p className="text-gray-500 mt-2">Look for the "Save" button when viewing PDFs or reference books.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedFiles.map((file) => (
                  <div key={file._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {file.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {file.materialType === 'pes_material' ? 'PES Material' : 'Reference Book'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.materialId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from saved files"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      {file.author && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Author:</span> {file.author}
                        </p>
                      )}
                      {file.subject && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Subject:</span> {file.subject}
                        </p>
                      )}
                      {file.pages && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Pages:</span> {file.pages}
                        </p>
                      )}
                      {file.unit && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Unit:</span> {file.unit}
                        </p>
                      )}
                    </div>

                    {file.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {file.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500">
                        Saved {new Date(file.savedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {file.gridFSFileId && (
                          <button
                            onClick={() => window.open(`http://localhost:5050/api/pipeline/files/${file.gridFSFileId}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenFile(file)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Open file"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Notes Tab Content - Use NotesManager Component
          <NotesManager />
        )}
      </div>
    </div>
  );
}

export default MyRack