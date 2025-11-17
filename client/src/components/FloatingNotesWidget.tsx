import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  PencilSquareIcon,
  DocumentTextIcon,
  BookmarkIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

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

interface FloatingNotesWidgetProps {
  context: 'pes_material' | 'workspace' | 'general';
  referenceId?: string;
  referenceType?: string;
  referenceTitle?: string;
  pageNumber?: number;
  className?: string;
}

const FloatingNotesWidget: React.FC<FloatingNotesWidgetProps> = ({
  context,
  referenceId,
  referenceType,
  referenceTitle,
  pageNumber,
  className = ''
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  // Load notes when widget opens or reference changes
  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotes();
    }
  }, [isOpen, user?.id, referenceId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      let url = `http://localhost:5050/api/pipeline/notes/user/${user?.id}?context=${context}`;
      
      // If we have a specific reference, get notes for that reference
      if (referenceId && referenceType) {
        url = `http://localhost:5050/api/pipeline/notes/reference/${referenceType}/${referenceId}?userId=${user?.id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      const noteData = {
        userId: user?.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        context,
        referenceId,
        referenceType,
        referenceTitle,
        pageNumber,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      const url = editingNote 
        ? `http://localhost:5050/api/pipeline/notes/${editingNote._id}`
        : 'http://localhost:5050/api/pipeline/notes';
      
      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      });

      const data = await response.json();
      
      if (data.success) {
        await loadNotes();
        setIsCreating(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', tags: '' });
      } else {
        alert('Failed to save note: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note');
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

      const data = await response.json();
      
      if (data.success) {
        await loadNotes();
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note');
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', ')
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', tags: '' });
  };

  if (!user) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
          title="Open Notes"
        >
          <DocumentTextIcon className="h-6 w-6" />
        </button>
      )}

      {/* Notes Panel */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Notes</span>
              {referenceTitle && (
                <span className="text-xs text-gray-500 truncate max-w-24" title={referenceTitle}>
                  • {referenceTitle}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Add Note"
              >
                <PlusIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-80">
            {/* Create/Edit Form */}
            {isCreating && (
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <textarea
                    placeholder="Write your note here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                  />
                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNote}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      {editingNote ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="p-2">
              {loading ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No notes yet. Click + to add one!
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note._id}
                      className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate" title={note.title}>
                            {note.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {note.content}
                          </p>
                          {note.pageNumber && (
                            <span className="text-xs text-blue-600 mt-1 inline-block">
                              Page {note.pageNumber}
                            </span>
                          )}
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
                                >
                                  <TagIcon className="h-2.5 w-2.5 mr-0.5" />
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Edit Note"
                          >
                            <PencilSquareIcon className="h-3 w-3 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteNote(note._id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete Note"
                          >
                            <TrashIcon className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingNotesWidget;
