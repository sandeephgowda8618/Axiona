import React, { createContext, useContext, useState, useCallback } from 'react';
import { Note, CreateNoteRequest, UpdateNoteRequest, apiService } from '../services/api';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refreshNotes: (userId: string) => Promise<void>;
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updatedNote: Note) => void;
  removeNote: (noteId: string) => void;
  clearNotes: () => void;
  triggerRefresh: () => void;
  lastRefreshTrigger: number;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotesContext = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
};

interface NotesProviderProps {
  children: React.ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(0);

  const refreshNotes = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const userNotes = await apiService.getUserNotes(userId);
      setNotes(userNotes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes';
      setError(errorMessage);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNote = useCallback((note: Note) => {
    setNotes(prev => [note, ...prev]);
  }, []);

  const updateNote = useCallback((noteId: string, updatedNote: Note) => {
    setNotes(prev => prev.map(note => note._id === noteId ? updatedNote : note));
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note._id !== noteId));
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  const triggerRefresh = useCallback(() => {
    console.log('🔄 NotesContext: Refresh triggered at', new Date().toISOString());
    setLastRefreshTrigger(Date.now());
  }, []);

  const value: NotesContextType = {
    notes,
    loading,
    error,
    refreshNotes,
    addNote,
    updateNote,
    removeNote,
    clearNotes,
    triggerRefresh,
    lastRefreshTrigger
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
