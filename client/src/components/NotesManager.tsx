import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon,
  FunelIcon,
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import FloatingNotesWidget from './FloatingNotesWidget';

interface Note {
  _id: string;
  title: string;
  content: string;
  context: 'pes_material' | 'workspace' | 'general';
  referenceId?: string;
  referenceType?: string;
  referenceTitle?: string;
  pageNumber?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotesStats {
  total: number;
  pes_materials: number;
  workspace: number;
  general: number;
}

const NotesManager: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<NotesStats>({
    total: 0,
    pes_materials: 0,
    workspace: 0,
    general: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    if (user?.id) {
      loadNotes();
      loadStats();
    }
  }, [user?.id, searchQuery, selectedContext, sortBy, sortOrder, page]);

  const loadNotes = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (selectedContext !== 'all') {
        params.append('context', selectedContext);
      }

      const response = await fetch(`http://localhost:5050/api/pipeline/notes/user/${user.id}?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:5050/api/pipeline/notes/stats/${user.id}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading notes stats:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5050/api/pipeline/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadNotes();
        await loadStats();
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note');
    }
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'pes_material':
        return <BookOpenIcon className="h-4 w-4 text-blue-600" />;
      case 'workspace':
        return <ComputerDesktopIcon className="h-4 w-4 text-green-600" />;
      default:
        return <DocumentDuplicateIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getContextLabel = (context: string) => {
    switch (context) {
      case 'pes_material':
        return 'PES Material';
      case 'workspace':
        return 'Workspace';
      default:
        return 'General';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view your notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PES Materials</p>
              <p className="text-2xl font-bold text-green-600">{stats.pes_materials}</p>
            </div>
            <BookOpenIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workspace</p>
              <p className="text-2xl font-bold text-purple-600">{stats.workspace}</p>
            </div>
            <ComputerDesktopIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">General</p>
              <p className="text-2xl font-bold text-orange-600">{stats.general}</p>
            </div>
            <DocumentDuplicateIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-3">
            <select
              value={selectedContext}
              onChange={(e) => {
                setSelectedContext(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Contexts</option>
              <option value="pes_material">PES Materials</option>
              <option value="workspace">Workspace</option>
              <option value="general">General</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="createdAt-desc">Recently Created</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedContext !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start taking notes to see them here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notes.map((note) => (
              <div key={note._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {getContextIcon(note.context)}
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {note.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getContextLabel(note.context)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {note.content}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                      
                      {note.pageNumber && (
                        <span className="text-blue-600">Page {note.pageNumber}</span>
                      )}
                      
                      {note.referenceTitle && (
                        <span className="truncate max-w-32" title={note.referenceTitle}>
                          • {note.referenceTitle}
                        </span>
                      )}
                    </div>

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => deleteNote(note._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems} notes
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Notes Widget for General Notes */}
      <FloatingNotesWidget
        context="general"
        className="z-40"
      />
    </div>
  );
};

export default NotesManager;
