import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotesProvider } from './contexts/NotesContext'
import AppRoutes from './routes/AppRoutes'
import './styles/index.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesProvider>
          <WorkspaceProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AppRoutes />
              </div>
            </Router>
          </WorkspaceProvider>
        </NotesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
