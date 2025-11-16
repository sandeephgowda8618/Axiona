import React, { useState } from 'react'
import { 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  BookOpen, 
  FileText, 
  Star,
  Calendar,
  Award,
  PlayCircle,
  Lightbulb
} from 'lucide-react'

interface RoadmapPhase {
  phase_number: number
  title: string
  description: string
  status?: 'completed' | 'in-progress' | 'locked' | 'available'
  progress?: number
  adjusted_duration?: string
  milestones?: string[]
  weekly_objectives?: string[]
  pes_materials?: Array<{
    title: string
    pages: number
    type: string
    fileName?: string
  }>
  projects?: Array<{
    title: string
    description: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }>
  skills_gained?: string[]
  prerequisites?: string[]
  estimated_hours?: number
  week_number?: number
}

interface RoadmapTimelineProps {
  roadmapData: {
    learning_goal: string
    experience_level: string
    hours_per_week: number
    generated_roadmap: {
      total_phases: number
      phases: RoadmapPhase[]
      resource_summary?: {
        total_pes_materials: number
        total_reference_books: number
      }
    }
    created_at: string
    completion_percentage?: number
  }
  onPhaseClick?: (phase: RoadmapPhase) => void
}

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ 
  roadmapData, 
  onPhaseClick 
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1])) // Expand first phase by default
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null)

  if (!roadmapData?.generated_roadmap?.phases) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No roadmap data available</p>
      </div>
    )
  }

  const { generated_roadmap } = roadmapData

  const getDifficultyColor = (phase: RoadmapPhase) => {
    if (phase.phase_number <= 2) return 'bg-green-100 border-green-300 text-green-700'
    if (phase.phase_number <= 4) return 'bg-yellow-100 border-yellow-300 text-yellow-700'
    return 'bg-red-100 border-red-300 text-red-700'
  }

  const getStatusIcon = (phase: RoadmapPhase) => {
    if (phase.status === 'completed' || (phase.progress && phase.progress >= 100)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (phase.status === 'in-progress' || (phase.progress && phase.progress > 0)) {
      return <TrendingUp className="h-5 w-5 text-blue-600" />
    } else if (phase.phase_number === 1) {
      return <PlayCircle className="h-5 w-5 text-blue-600" />
    } else {
      return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (phase: RoadmapPhase) => {
    if (phase.status === 'completed' || (phase.progress && phase.progress >= 100)) {
      return 'bg-green-500'
    } else if (phase.status === 'in-progress' || (phase.progress && phase.progress > 0)) {
      return 'bg-blue-500'
    } else if (phase.phase_number === 1) {
      return 'bg-blue-500'
    } else {
      return 'bg-gray-300'
    }
  }

  const togglePhase = (phaseNumber: number) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseNumber)) {
      newExpanded.delete(phaseNumber)
    } else {
      newExpanded.add(phaseNumber)
    }
    setExpandedPhases(newExpanded)
  }

  const formatDuration = (duration?: string) => {
    if (!duration) return 'TBD'
    return duration.includes('week') ? duration : `${duration}`
  }

  const calculateWeekNumber = (phaseIndex: number) => {
    return Math.floor(phaseIndex * 1.5) + 1 // Rough week calculation
  }

  return (
    <div className="space-y-6">
      {/* Roadmap Header Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              {roadmapData.learning_goal}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Personalized learning path based on your {roadmapData.experience_level} level experience
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {generated_roadmap.total_phases}
                </div>
                <div className="text-sm text-gray-600">Learning Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {generated_roadmap.phases?.filter(p => p.status === 'completed').length || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {roadmapData.hours_per_week}h
                </div>
                <div className="text-sm text-gray-600">Weekly Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {generated_roadmap.resource_summary?.total_pes_materials || 0}
                </div>
                <div className="text-sm text-gray-600">Study Materials</div>
              </div>
            </div>
          </div>
          
          {roadmapData.completion_percentage !== undefined && (
            <div className="ml-6">
              <div className="text-right mb-2">
                <span className="text-2xl font-bold text-green-600">
                  {roadmapData.completion_percentage}%
                </span>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="w-24 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${roadmapData.completion_percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* Timeline Phases */}
        <div className="space-y-6">
          {generated_roadmap.phases.map((phase, index) => {
            const isExpanded = expandedPhases.has(phase.phase_number)
            const isAlternating = index % 2 === 1
            const weekNumber = calculateWeekNumber(index)
            
            return (
              <div
                key={phase.phase_number}
                className={`relative flex items-start ${isAlternating ? 'flex-row-reverse' : ''}`}
                onMouseEnter={() => setHoveredPhase(phase.phase_number)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                {/* Timeline Node */}
                <div className={`absolute ${isAlternating ? 'right-8' : 'left-8'} transform -translate-x-1/2 z-10`}>
                  <div className={`w-4 h-4 rounded-full border-4 border-white ${getStatusColor(phase)} 
                    ${hoveredPhase === phase.phase_number ? 'scale-125' : ''} 
                    transition-all duration-200`}>
                  </div>
                </div>

                {/* Phase Card */}
                <div className={`flex-1 ${isAlternating ? 'pr-16' : 'pl-16'} max-w-2xl`}>
                  <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 cursor-pointer
                    ${hoveredPhase === phase.phase_number ? 'shadow-lg border-blue-300 transform scale-[1.02]' : 'border-gray-200'}
                    ${getDifficultyColor(phase)} bg-opacity-20`}>
                    
                    {/* Phase Header */}
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => togglePhase(phase.phase_number)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getDifficultyColor(phase)}`}>
                              {phase.phase_number}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Week {weekNumber}</span>
                              {phase.adjusted_duration && (
                                <>
                                  <span>•</span>
                                  <Clock className="h-4 w-4" />
                                  <span>{formatDuration(phase.adjusted_duration)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {phase.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {phase.description}
                          </p>
                          
                          {/* Progress Bar */}
                          {phase.progress !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{phase.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${phase.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusIcon(phase)}
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white bg-opacity-50">
                        <div className="p-6 space-y-4">
                          
                          {/* Weekly Objectives */}
                          {phase.weekly_objectives && phase.weekly_objectives.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                                <Target className="h-4 w-4 mr-2 text-blue-600" />
                                Weekly Objectives
                              </h5>
                              <ul className="space-y-1">
                                {phase.weekly_objectives.map((objective, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    {objective}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Milestones */}
                          {phase.milestones && phase.milestones.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                                <Award className="h-4 w-4 mr-2 text-green-600" />
                                Key Milestones
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {phase.milestones.map((milestone, i) => (
                                  <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                    {milestone}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Study Materials */}
                          {phase.pes_materials && phase.pes_materials.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                                <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                                Study Materials
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {phase.pes_materials.map((material, i) => (
                                  <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h6 className="text-sm font-medium text-purple-900">{material.title}</h6>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <FileText className="h-3 w-3 text-purple-600" />
                                          <span className="text-xs text-purple-700">{material.pages} pages</span>
                                          {material.type && (
                                            <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">
                                              {material.type}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {phase.projects && phase.projects.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                                <Lightbulb className="h-4 w-4 mr-2 text-orange-600" />
                                Projects & Practice
                              </h5>
                              <div className="space-y-2">
                                {phase.projects.map((project, i) => (
                                  <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h6 className="text-sm font-medium text-orange-900">{project.title}</h6>
                                        <p className="text-xs text-orange-700 mt-1">{project.description}</p>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        project.difficulty === 'beginner' ? 'bg-green-100 text-green-600' :
                                        project.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-red-100 text-red-600'
                                      }`}>
                                        {project.difficulty}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills Gained */}
                          {phase.skills_gained && phase.skills_gained.length > 0 && (
                            <div>
                              <h5 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                                <Star className="h-4 w-4 mr-2 text-yellow-600" />
                                Skills You'll Gain
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {phase.skills_gained.map((skill, i) => (
                                  <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2">
                            <button
                              onClick={() => onPhaseClick?.(phase)}
                              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                phase.status === 'completed' ? 
                                  'bg-green-100 text-green-700 hover:bg-green-200' :
                                phase.status === 'in-progress' || phase.phase_number === 1 ?
                                  'bg-blue-600 text-white hover:bg-blue-700' :
                                  'bg-gray-100 text-gray-500 cursor-not-allowed'
                              }`}
                              disabled={phase.status === 'locked' || (phase.phase_number > 1 && !phase.status)}
                            >
                              {phase.status === 'completed' ? 'Review Phase' :
                               phase.status === 'in-progress' || phase.phase_number === 1 ? 'Continue Learning' :
                               'Locked - Complete Previous Phase'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resource Summary Footer */}
      {generated_roadmap.resource_summary && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center mb-3">
            <Star className="h-5 w-5 text-indigo-600 mr-2" />
            <h4 className="font-medium text-indigo-900">Enhanced with AI-Curated Resources</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-indigo-600">
                {generated_roadmap.resource_summary.total_pes_materials}
              </div>
              <div className="text-sm text-gray-600">PES Materials</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {generated_roadmap.resource_summary.total_reference_books}
              </div>
              <div className="text-sm text-gray-600">Reference Books</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600">
                {generated_roadmap.phases.reduce((acc, phase) => acc + (phase.pes_materials?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Study Resources</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {generated_roadmap.phases.reduce((acc, phase) => acc + (phase.projects?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Practice Projects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapTimeline
