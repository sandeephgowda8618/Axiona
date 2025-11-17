import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LandingNavigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigation = (path: string, name: string) => {
    console.log(`Navigating to: ${name} (${path})`)
    try {
      navigate(path)
    } catch (error) {
      console.error(`Navigation failed to ${path}:`, error)
    }
  }

  return (
    <header className="app-header">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="logo flex items-center space-x-2">
            <div className="logo-icon bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
              A
            </div>
            <span className="logo-text text-xl font-bold text-white">Axiona</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavigation('/tutorial-hub', 'Tutorial Hub')}
              className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Tutorial Hub
            </button>
            <button 
              onClick={() => handleNavigation('/study-materials', 'StudyPES')}
              className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              StudyPES
            </button>
            <button 
              onClick={() => handleNavigation('/conference', 'Conference')}
              className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Conference
            </button>
            <button 
              onClick={() => handleNavigation('/library', 'Library')}
              className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Library
            </button>
            <button 
              onClick={() => handleNavigation('/my-rack', 'My Rack')}
              className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              My Rack
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => handleNavigation('/profile', 'Profile')}
                className="nav-link text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Profile
              </button>
            )}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-white text-sm">
                    {user?.fullName || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="btn-signup bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingNavigation
