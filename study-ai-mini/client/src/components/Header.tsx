import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Trophy, 
  Settings, 
  Library, 
  FileText,
  User,
  LogOut,
  Play,
  StickyNote
} from 'lucide-react'

interface HeaderProps {
  variant?: 'default' | 'landing' | 'auth' | 'minimal'
  showUserMenu?: boolean
  title?: string
}

const Header: React.FC<HeaderProps> = ({ 
  variant = 'default', 
  showUserMenu = true,
  title
}) => {
  const location = useLocation()

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Study Materials', href: '/study-materials', icon: FileText },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Tutorial Hub', href: '/tutorial-hub', icon: Play },
  { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Study Buddy', href: '/study-buddy', icon: Brain },
    { name: 'Quizzes', href: '/quiz', icon: Trophy },
    { name: 'Conference', href: '/conference', icon: MessageSquare },
    { name: 'Workspace', href: '/workspace', icon: StickyNote }
  ]

  const isCurrentPage = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/profile'
    }
    return location.pathname.startsWith(href)
  }

  if (variant === 'landing') {
    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</Link>
              <Link to="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">How it works</Link>
              <Link to="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link to="#contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link 
                to="/auth" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'auth') {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'minimal') {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
              {title && <span className="text-gray-500 ml-2">| {title}</span>}
            </Link>
          </div>
        </div>
      </header>
    )
  }

  // Default header with full navigation
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isCurrent = isCurrentPage(item.href)
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          {showUserMenu && (
            <div className="flex items-center space-x-4">
              <Link
                to="/settings"
                className={`p-2 rounded-md transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
