import React, { createContext, useContext, useState, useCallback } from 'react'

type WorkspaceView = 'notes' | 'chat' | 'pdf' | 'video' | 'quiz'

interface WorkspaceState {
  isWorkspaceOpen: boolean
  currentView: WorkspaceView
  activeContent: {
    id?: string
    title?: string
    type?: 'pdf' | 'video' | 'playlist'
    url?: string
  } | null
  splitView: boolean
  sidebarCollapsed: boolean
}

interface WorkspaceContextType {
  state: WorkspaceState
  openWorkspace: (view: WorkspaceView, content?: any) => void
  closeWorkspace: () => void
  switchView: (view: WorkspaceView) => void
  setActiveContent: (content: any) => void
  toggleSplitView: () => void
  toggleSidebar: () => void
  resetWorkspace: () => void
}

const defaultState: WorkspaceState = {
  isWorkspaceOpen: false,
  currentView: 'notes',
  activeContent: null,
  splitView: false,
  sidebarCollapsed: false,
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

interface WorkspaceProviderProps {
  children: React.ReactNode
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [state, setState] = useState<WorkspaceState>(() => {
    const saved = localStorage.getItem('workspaceState')
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState
  })

  // Save state to localStorage whenever it changes
  const updateState = useCallback((newState: Partial<WorkspaceState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState }
      localStorage.setItem('workspaceState', JSON.stringify(updated))
      return updated
    })
  }, [])

  const openWorkspace = useCallback((view: WorkspaceView, content?: any) => {
    updateState({
      isWorkspaceOpen: true,
      currentView: view,
      activeContent: content || null,
    })
  }, [updateState])

  const closeWorkspace = useCallback(() => {
    updateState({
      isWorkspaceOpen: false,
      activeContent: null,
    })
  }, [updateState])

  const switchView = useCallback((view: WorkspaceView) => {
    updateState({ currentView: view })
  }, [updateState])

  const setActiveContent = useCallback((content: any) => {
    updateState({ activeContent: content })
  }, [updateState])

  const toggleSplitView = useCallback(() => {
    updateState({ splitView: !state.splitView })
  }, [state.splitView, updateState])

  const toggleSidebar = useCallback(() => {
    updateState({ sidebarCollapsed: !state.sidebarCollapsed })
  }, [state.sidebarCollapsed, updateState])

  const resetWorkspace = useCallback(() => {
    setState(defaultState)
    localStorage.removeUser('workspaceState')
  }, [])

  const value = {
    state,
    openWorkspace,
    closeWorkspace,
    switchView,
    setActiveContent,
    toggleSplitView,
    toggleSidebar,
    resetWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
