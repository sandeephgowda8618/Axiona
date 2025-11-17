import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Lock, TrendingUp, Calendar, FileText, Clock, Star, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { apiService } from '../services/api'
import SimpleRoadmapWizard from '../components/SimpleRoadmapWizard'
import VerticalProgressStepper from '../components/VerticalProgressStepper'

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
  const navigate = useNavigate()
  const { user, updateRoadmapCompleted } = useAuth()
  const { initializeWeeks, updateWeekMaterialRequirement } = useProgress()
  
  // Pipeline roadmap state
  const [pipelineRoadmap, setPipelineRoadmap] = useState<any>(null)
  const [roadmapLoading, setRoadmapLoading] = useState(true)
  const [roadmapError, setRoadmapError] = useState<string | null>(null)
  
  // Roadmap wizard state
  const [showRoadmapWizard, setShowRoadmapWizard] = useState(false)
  const [hasCheckedRoadmap, setHasCheckedRoadmap] = useState(false)

  // Initialize progress tracking
  useEffect(() => {
    initializeWeeks(8) // Initialize 8-week roadmap
    
    // Set dynamic material requirements for each week
    weekData.forEach(week => {
      const totalMaterials = week.materials.videos + week.materials.pdfs + week.materials.references + week.materials.slides
      updateWeekMaterialRequirement(week.week, totalMaterials)
    })
  }, [initializeWeeks, updateWeekMaterialRequirement])

  // Week data for the roadmap stepper
  const weekData = [
    {
      week: 1,
      phase: "Week 1 - 1",
      studyHours: 7,
      projectHours: 3,
      activities: ["Read Unit 1", "Watch videos"],
      materials: { videos: 3, pdfs: 2, references: 2, slides: 1 }
    },
    {
      week: 2,
      phase: "Week 2 - 1", 
      studyHours: 7,
      projectHours: 3,
      activities: ["Practice HTML", "Work on project"],
      materials: { videos: 2, pdfs: 3, references: 1, slides: 2 }
    },
    {
      week: 3,
      phase: "Week 3 - 2",
      studyHours: 9,
      projectHours: 1,
      activities: ["Read CSS and JavaScript chapters", "Watch videos"],
      materials: { videos: 4, pdfs: 2, references: 3, slides: 1 }
    },
    {
      week: 4,
      phase: "Week 4 - 2",
      studyHours: 9,
      projectHours: 1,
      activities: ["Practice CSS and JavaScript", "Advanced concepts"],
      materials: { videos: 3, pdfs: 3, references: 2, slides: 2 }
    },
    {
      week: 5,
      phase: "Week 5 - 3",
      studyHours: 8,
      projectHours: 2,
      activities: ["React fundamentals", "Component basics"],
      materials: { videos: 5, pdfs: 2, references: 1, slides: 3 }
    },
    {
      week: 6,
      phase: "Week 6 - 3", 
      studyHours: 8,
      projectHours: 2,
      activities: ["React advanced", "State management"],
      materials: { videos: 3, pdfs: 4, references: 2, slides: 1 }
    },
    {
      week: 7,
      phase: "Week 7 - 4",
      studyHours: 7,
      projectHours: 3,
      activities: ["Final project", "Integration testing"],
      materials: { videos: 2, pdfs: 3, references: 3, slides: 2 }
    },
    {
      week: 8,
      phase: "Week 8 - 4",
      studyHours: 7,
      projectHours: 3,
      activities: ["Project completion", "Documentation"],
      materials: { videos: 1, pdfs: 2, references: 4, slides: 3 }
    }
  ]

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

  // Load pipeline roadmap
  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user?.id) return;
      
      try {
        setRoadmapLoading(true);
        setRoadmapError(null);
        console.log('🔍 Loading roadmap for user:', user.id);
        
        const roadmapData = await apiService.getUserRoadmap(user.id);
        console.log('📊 Roadmap loaded:', roadmapData);
        
        setPipelineRoadmap(roadmapData);
        setHasCheckedRoadmap(true);
        
        // No auto-popup - user must manually click "Create Roadmap"
      } catch (error) {
        console.error('❌ Error loading roadmap:', error);
        setRoadmapError('Failed to load roadmap');
        setHasCheckedRoadmap(true);
      } finally {
        setRoadmapLoading(false);
      }
    };

    loadRoadmap();
  }, [user?.id]);

  // Handle roadmap generation completion
  const handleRoadmapComplete = async (newRoadmapData: any) => {
    console.log('✅ Roadmap generation completed:', newRoadmapData);
    setPipelineRoadmap(newRoadmapData);
    setShowRoadmapWizard(false);
    
    // Update user's roadmap completion status
    updateRoadmapCompleted(true);
    
    // Mark wizard as seen for this user
    if (user?.id) {
      localStorage.setItem(`roadmap_wizard_seen_${user.id}`, 'true');
    }
  };

  const handleWizardClose = () => {
    setShowRoadmapWizard(false);
    // Mark wizard as dismissed for this user
    if (user?.id) {
      localStorage.setItem(`roadmap_wizard_dismissed_${user.id}`, 'true');
    }
  };

  const refreshRoadmap = async () => {
    if (!user?.id) return;
    
    setRoadmapLoading(true);
    setRoadmapError(null);
    
    try {
      const roadmapData = await apiService.getUserRoadmap(user.id);
      setPipelineRoadmap(roadmapData);
    } catch (error) {
      console.error('❌ Error refreshing roadmap:', error);
      setRoadmapError('Failed to refresh roadmap');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handlePhaseClick = (phase: any) => {
    console.log('📖 Phase clicked:', phase);
    // Navigate to study materials or specific learning content
    if (phase.pes_materials && phase.pes_materials.length > 0) {
      navigate('/study-materials-pes');
    }
  };

  // Function to format roadmap phase progress
  const getPhaseStatusIcon = (phase: any) => {
    if (phase.status === 'completed' || phase.progress >= 100) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (phase.status === 'in-progress' || phase.progress > 0) {
      return <TrendingUp className="h-5 w-5 text-blue-600" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // Function to get phase status color
  const getPhaseStatusColor = (phase: any) => {
    if (phase.status === 'completed' || phase.progress >= 100) {
      return 'bg-green-100 text-green-700';
    } else if (phase.status === 'in-progress' || phase.progress > 0) {
      return 'bg-blue-100 text-blue-700';
    } else {
      return 'bg-gray-100 text-gray-400';
    }
  };

  const handleWeekClick = (weekNumber: number) => {
    console.log(`Week ${weekNumber} clicked - navigating to study materials`)
    // Navigate to study materials/library page where users can open PDFs and videos
    navigate('/study-materials')
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
                    <p className="text-2xl font-semibold text-gray-900">{userProfile.coursesCompleted}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{userProfile.streakDays}</p>
                  </div>
                </div>
              </div>

              {/* Total Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Notes</p>
                    <p className="text-2xl font-semibold text-gray-900">{userProfile.totalNotes}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{userProfile.weeklyActivity}</p>
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

            {/* Pipeline Learning Roadmap */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 text-blue-600 mr-2" />
                  Your Learning Roadmap
                </h2>
                <div className="flex items-center space-x-3">
                  {pipelineRoadmap && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {pipelineRoadmap.learning_goal}
                    </span>
                  )}
                  {pipelineRoadmap && (
                    <button
                      onClick={refreshRoadmap}
                      disabled={roadmapLoading}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Refresh roadmap"
                    >
                      <RefreshCw className={`h-4 w-4 ${roadmapLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {!pipelineRoadmap && !user?.roadmapCompleted && hasCheckedRoadmap && (
                    <button
                      onClick={() => setShowRoadmapWizard(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Roadmap
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {roadmapLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading your learning roadmap...</span>
                  </div>
                ) : roadmapError ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{roadmapError}</p>
                    <div className="space-x-3">
                      <button
                        onClick={refreshRoadmap}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                      {!user?.roadmapCompleted && (
                        <button
                          onClick={() => setShowRoadmapWizard(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Create New Roadmap
                        </button>
                      )}
                    </div>
                  </div>
                ) : (pipelineRoadmap?.generated_roadmap || pipelineRoadmap?.learning_schedule) ? (
                  <VerticalProgressStepper 
                    weekData={weekData} 
                    onWeekClick={handleWeekClick}
                  />
                ) : user?.roadmapCompleted ? (
                  <>
                    <div className="text-center py-6">
                      <div className="bg-gradient-to-br from-green-50 to-blue-100 rounded-xl p-6 max-w-lg mx-auto mb-6">
                        <Star className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Roadmap Ready!
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Track your learning progress below.
                        </p>
                      </div>
                    </div>
                    <VerticalProgressStepper 
                      weekData={weekData} 
                      onWeekClick={handleWeekClick}
                    />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 max-w-lg mx-auto">
                      <Star className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Ready to Start Learning?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Create a personalized learning roadmap tailored to your goals, experience level, and interests. 
                        Get access to curated PES materials and structured learning paths.
                      </p>
                      <button
                        onClick={() => setShowRoadmapWizard(true)}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your Roadmap
                      </button>
                    </div>
                  </div>
                )}
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
      
      {/* Simple Roadmap Wizard Modal */}
      {showRoadmapWizard && (
        <SimpleRoadmapWizard
          onComplete={handleRoadmapComplete}
          onCancel={handleWizardClose}
        />
      )}
    </div>
  )
}

export default ProfileDashboard
