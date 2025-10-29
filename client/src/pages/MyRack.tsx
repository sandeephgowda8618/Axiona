import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  FileText,
  Trash,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  Edit,
  Eye,
  Calendar,
  Download
} from 'lucide-react'
import { apiService, Note } from '../services/api'
import { useAuth, mockUser } from '../contexts/AuthContext'
import { useNotes } from '../hooks/useNotes'
import { useNotesContext } from '../contexts/NotesContext'
import EditNoteModal from '../components/EditNoteModal'
import NotesDebugPanel from '../components/NotesDebugPanel'

const MyRack: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  // Use real Firebase user now that backend supports Firebase UIDs
  const currentUser = isAuthenticated ? user : mockUser;
  const { lastRefreshTrigger } = useNotesContext();
  
  // Use the notes hook
  const { 
    notes: userNotes, 
    loading: notesLoading, 
    error: notesError, 
    deleteNote, 
    updateNote,
    refreshNotes 
  } = useNotes(currentUser?.id);
  
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  
  // Edit note modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  
  // Notes pagination and search
  const [notesPage, setNotesPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const notesPerPage = 6;

  // Refresh notes when tab changes to notes
  useEffect(() => {
    if (activeTab === 'notes' && currentUser) {
      refreshNotes();
    }
  }, [currentUser, activeTab, refreshNotes]);

  // Listen for refresh triggers from other components
  useEffect(() => {
    if (lastRefreshTrigger > 0 && currentUser) {
      console.log('🔄 MyRack: Refreshing notes due to external trigger at', new Date(lastRefreshTrigger).toISOString());
      console.log('🔄 MyRack: Current user:', currentUser.email, 'Active tab:', activeTab);
      refreshNotes();
    }
  }, [lastRefreshTrigger, currentUser, refreshNotes]);

  // Helper functions for note actions
  const handleEditNote = (note: Note) => {
    setNoteToEdit(note);
    setEditModalOpen(true);
  };

  const handleSaveNote = async (noteId: string, updatedData: { title: string; content: string; tags: string[]; isPublic: boolean }) => {
    try {
      await updateNote(noteId, updatedData);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleViewNotePDF = (note: Note) => {
    if (note.pdfId) {
      // Navigate to the PDF viewer with the linked PDF
      window.location.href = `/subject-viewer?pdf=${note.pdfId}`;
    }
  };

  // Filter and paginate notes
  const filteredNotes = userNotes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const totalNotesPages = Math.ceil(filteredNotes.length / notesPerPage);
  const startNotesIndex = (notesPage - 1) * notesPerPage;
  const paginatedNotes = filteredNotes.slice(startNotesIndex, startNotesIndex + notesPerPage);

  const goToNotesPage = (page: number) => {
    if (page >= 1 && page <= totalNotesPages) {
      setNotesPage(page);
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
          // Files Tab Content - Coming Soon
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Saved Files Feature Coming Soon</h3>
            <p className="text-gray-500">We're working on adding the ability to save and bookmark your favorite study materials.</p>
            <p className="text-gray-500 mt-2">For now, you can take notes on PDFs which will be saved in the "My Notes" tab.</p>
          </div>
        ) : (
          // Notes Tab Content
          <div className="space-y-4">
            {/* Search Bar for Notes */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search notes by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setNotesPage(1); // Reset to first page when searching
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {notesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading notes...</span>
              </div>
            ) : notesError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{notesError}</p>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : userNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h3>
                <p className="text-gray-500">Start taking notes while studying to see them here.</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notes found</h3>
                <p className="text-gray-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedNotes.map((note) => (
                  <div key={note._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{note.title}</h3>
                      <div className="flex items-center gap-2 ml-4">
                        {note.isPublic ? (
                          <div title="Public note">
                            <Eye className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div title="Private note">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      {note.pdfId && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Linked to PDF</span>
                        </div>
                      )}
                      {note.pageNumber && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Page {note.pageNumber}</span>
                        </div>
                      )}
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-gray-400 text-xs">+{note.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">PDF:</span> {note.pdfTitle}
                      </div>
                      <div className="flex items-center gap-2">
                        {note.pdfId && (
                          <button
                            onClick={() => handleViewNotePDF(note)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="View linked PDF"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditNote(note)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit note"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete note"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {/* Notes Pagination */}
                {totalNotesPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startNotesIndex + 1}-{Math.min(startNotesIndex + notesPerPage, filteredNotes.length)} of {filteredNotes.length} notes
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => goToNotesPage(notesPage - 1)} 
                        disabled={notesPage === 1} 
                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: totalNotesPages }).map((_, idx) => {
                        const page = idx + 1
                        return (
                          <button 
                            key={page} 
                            onClick={() => goToNotesPage(page)} 
                            className={`px-3 py-1 rounded-md ${page === notesPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button 
                        onClick={() => goToNotesPage(notesPage + 1)} 
                        disabled={notesPage === totalNotesPages} 
                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{userNotes.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {userNotes.filter(note => note.isPublic).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Public Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {userNotes.filter(note => note.tags && note.tags.length > 0).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Tagged Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {userNotes.filter(note => note.pdfId).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">PDF-linked Notes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Note Modal */}
      <EditNoteModal
        isOpen={editModalOpen}
        note={noteToEdit}
        onClose={() => {
          setEditModalOpen(false);
          setNoteToEdit(null);
        }}
        onSave={handleSaveNote}
      />

      {/* Debug Panel - Remove in production */}
      <NotesDebugPanel />
    </div>
  );
}

export default MyRack