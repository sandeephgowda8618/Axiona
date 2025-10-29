import React, { useEffect, useState } from 'react';
import { useNotesContext } from '../contexts/NotesContext';
import { useAuth, mockUser } from '../contexts/AuthContext';

const NotesDebugPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const currentUser = isAuthenticated ? user : mockUser;
  const { lastRefreshTrigger, triggerRefresh, notes, loading, refreshNotes } = useNotesContext();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (lastRefreshTrigger > 0) {
      setRefreshCount(prev => prev + 1);
      console.log('🔔 NotesDebugPanel: Refresh trigger received:', lastRefreshTrigger);
    }
  }, [lastRefreshTrigger]);

  const handleManualRefresh = () => {
    console.log('🔧 NotesDebugPanel: Manual refresh triggered');
    triggerRefresh();
  };

  const handleFetchNotes = async () => {
    if (currentUser) {
      console.log('📋 NotesDebugPanel: Fetching notes for user:', currentUser.email);
      await refreshNotes(currentUser.id);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="text-sm font-bold text-blue-700 mb-2">Notes Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>User:</span>
          <span className="font-mono">{currentUser?.email || 'None'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Notes Count:</span>
          <span className="font-mono">{notes.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Loading:</span>
          <span className="font-mono">{loading ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Refresh Count:</span>
          <span className="font-mono">{refreshCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Last Trigger:</span>
          <span className="font-mono">
            {lastRefreshTrigger ? new Date(lastRefreshTrigger).toLocaleTimeString() : 'None'}
          </span>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleManualRefresh}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Trigger Refresh
          </button>
          
          <button
            onClick={handleFetchNotes}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
          >
            Fetch Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesDebugPanel;
