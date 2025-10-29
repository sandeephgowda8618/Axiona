import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Lock, TrendingUp, Calendar, FileText, StickyNote, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'

interface LearningRoadmapItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'locked' | 'available'
  progress: number
  estimatedTime: string
}

const ProfileDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const [userStats, setUserStats] = useState<any>(null)
  const [recentNotes, setRecentNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  // Use real user data from AuthContext
  const userProfile = user || {
    id: '1',
    fullName: 'User',
    email: 'user@example.com',
    role: 'Student',
    coursesCompleted: 0,
    streakDays: 0,
    totalNotes: 0,
    weeklyActivity: '0h'
  }

  // Fetch user stats and recent notes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // Fetch user stats
        const stats = await apiService.getUserStats(user.id)
        setUserStats(stats)
        
        // Fetch recent notes (limit to 5 for dashboard)
        const notes = await apiService.getUserNotes(user.id)
        setRecentNotes(notes.slice(0, 5))
        
        console.log('📊 User stats loaded:', stats)
        console.log('📝 Recent notes loaded:', notes.length)
      } catch (error) {
        console.error('❌ Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user, isAuthenticated])

  const learningRoadmap: LearningRoadmapItem[] = [
    {
      id: '1',
      title: 'Python Fundamentals',
      description: 'Master basic Python programming concepts',
      status: 'completed',
      progress: 100,
      estimatedTime: '4 weeks'
    },
    {
      id: '2',
      title: 'Data Structures & Algorithms',
      description: 'Learn essential programming concepts',
      status: 'completed',
      progress: 100,
      estimatedTime: '6 weeks'
    },
    {
      id: '3',
      title: 'Machine Learning Basics',
      description: 'Introduction to ML concepts and algorithms',
      status: 'in-progress',
      progress: 65,
      estimatedTime: '8 weeks'
    },
    {
      id: '4',
      title: 'Deep Learning',
      description: 'Advanced neural networks and AI',
      status: 'locked',
      progress: 0,
      estimatedTime: '10 weeks'
    }
  ]

  const getStatusIcon = (status: LearningRoadmapItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-400" />
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{userProfile.fullName}</h1>
                  <p className="text-gray-600">{userProfile.role}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid - Matches wireframe exactly */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Courses Finished */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Courses Finished</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : (userStats?.coursesCompleted || userProfile.coursesCompleted)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Streak Days */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Streak Days</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : (userStats?.streakDays || userProfile.streakDays)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <StickyNote className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Notes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : (userStats?.totalNotes || userProfile.totalNotes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weekly Activity</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : (userStats?.weeklyActivity || userProfile.weeklyActivity)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Progress Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h2>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Chart.js Line Graph</p>
                  <p className="text-gray-400 text-xs">Weekly activity visualization</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate('/my-rack')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Rack
                </button>
              </div>
            </div>

            {/* Recent Notes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
                <button
                  onClick={() => navigate('/my-rack')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <div key={note._id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <StickyNote className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">
                          {note.pdfTitle} {note.pageNumber && `• Page ${note.pageNumber}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/my-rack')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notes yet</p>
                  <p className="text-gray-400 text-xs">Start taking notes while studying!</p>
                  <button
                    onClick={() => navigate('/study-materials')}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Study Materials
                  </button>
                </div>
              )}
            </div>

            {/* AI Learning Roadmap - Matches wireframe */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Learning Roadmap</h2>
              <div className="space-y-4">
                {learningRoadmap.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={userProfile.fullName}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={userProfile.email}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role/Title</label>
                <input
                  type="text"
                  defaultValue={userProfile.role}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
              </div>
              <div className="pt-2 space-y-3">
                <button className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                  Save Changes
                </button>
                <button 
                  onClick={() => navigate('/my-rack')}
                  className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Rack
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileDashboard
