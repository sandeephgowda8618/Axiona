import { useState, useEffect } from 'react';
import { Note, CreateNoteRequest, UpdateNoteRequest, apiService } from '../services/api';

export interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (noteData: CreateNoteRequest) => Promise<Note | null>;
  updateNote: (noteId: string, updateData: UpdateNoteRequest) => Promise<Note | null>;
  deleteNote: (noteId: string) => Promise<boolean>;
  getUserNotes: (userId: string) => Promise<Note[]>;
  refreshNotes: () => Promise<void>;
  createDefaultNote: (userId: string) => Promise<Note | null>;
}

export const useNotes = (userId?: string): UseNotesReturn => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = async (noteData: CreateNoteRequest): Promise<Note | null> => {
    try {
      setLoading(true);
      setError(null);
      const newNote = await apiService.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      console.error('Error creating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (noteId: string, updateData: UpdateNoteRequest): Promise<Note | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedNote = await apiService.updateNote(noteId, updateData);
      setNotes(prev => prev.map(note => note._id === noteId ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      console.error('Error updating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note._id !== noteId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      console.error('Error deleting note:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserNotes = async (userId: string): Promise<Note[]> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useNotes: Fetching notes for user:', userId);
      const userNotes = await apiService.getUserNotes(userId);
      console.log('📋 useNotes: Received notes:', userNotes.length);
      
      // Don't create default note if user already has notes
      setNotes(userNotes);
      return userNotes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user notes';
      setError(errorMessage);
      console.error('❌ useNotes: Error fetching user notes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createDefaultNote = async (userId: string): Promise<Note | null> => {
    try {
      const defaultNoteContent = `=== Welcome to Your Study Notes! ===

📚 Study Platform - Personal Notes System
📅 Created: ${new Date().toLocaleDateString()}
👤 User ID: ${userId}

=== HOW TO USE YOUR NOTES ===

🎯 This is your personal study notes collection!

📝 CREATING NOTES:
• Open any PDF in the study platform
• Click the "Notes" button in the annotation toolbar
• A floating, draggable modal will appear
• Type your notes while still viewing the PDF
• Notes are automatically saved as .txt files

✨ FEATURES:
• Drag notes modal anywhere on screen
• Resize the modal by dragging corners
• Maximize/minimize the modal
• Continue reading PDF while taking notes
• All notes are saved to your MyRack section

🏷️ AUTOMATIC ORGANIZATION:
• Notes are tagged with PDF title and page number
• Searchable by title, content, and tags
• Each note includes PDF context and metadata

📁 FILE FORMAT:
• All notes are saved in .txt format
• Include PDF information and timestamps
• Downloadable for offline access

💡 TIP: This default note will help you get started. Delete it anytime!

=== HAPPY STUDYING! ===`;

      const defaultNote: CreateNoteRequest = {
        title: 'Welcome to Your Study Notes - Getting Started Guide',
        content: defaultNoteContent,
        pdfId: 'default', // Special ID for default note
        userId: userId,
        tags: ['Welcome', 'Guide', 'Getting Started'],
        isPublic: false
      };

      return await createNote(defaultNote);
    } catch (err) {
      console.error('Error creating default note:', err);
      return null;
    }
  };

  const refreshNotes = async (): Promise<void> => {
    if (userId) {
      await getUserNotes(userId);
    }
  };

  // Auto-fetch notes when userId is provided
  useEffect(() => {
    if (userId) {
      getUserNotes(userId);
    }
  }, [userId]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getUserNotes,
    refreshNotes,
    createDefaultNote
  };
};
