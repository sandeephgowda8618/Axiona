import React, { useState, useEffect } from 'react'
import { X, ChevronRight, BookOpen, Brain, Target, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

interface RoadmapWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (roadmapData: any) => void
  userId: string
}

interface DomainOption {
  id: string
  name: string
  description: string
  icon: string
}

interface ExperienceLevel {
  id: string
  name: string
  description: string
  hoursPerWeek: number
}

interface InterviewQuestion {
  question_id: string
  question_text: string
  question_type: 'open_ended' | 'multiple_choice' | 'rating_scale'
  options?: string[]
  category?: string
  required?: boolean
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'electronics',
    name: 'Electronics & Communication',
    description: 'ECE, Signals, Digital Electronics, Communication Systems',
    icon: '📡'
  },
  {
    id: 'computer_science',
    name: 'Computer Science',
    description: 'Programming, Data Structures, Algorithms, Software Development',
    icon: '💻'
  },
  {
    id: 'electrical',
    name: 'Electrical Engineering',
    description: 'Power Systems, Control Systems, Electrical Machines',
    icon: '⚡'
  },
  {
    id: 'mechanical',
    name: 'Mechanical Engineering',
    description: 'Thermodynamics, Fluid Mechanics, Machine Design',
    icon: '⚙️'
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    description: 'Structural Engineering, Transportation, Geotechnical',
    icon: '🏗️'
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Calculus, Linear Algebra, Statistics, Applied Math',
    icon: '🔢'
  }
]

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to this field, need foundational knowledge',
    hoursPerWeek: 5
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Some experience, ready for advanced topics',
    hoursPerWeek: 8
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Strong foundation, looking for specialization',
    hoursPerWeek: 12
  }
]

const RoadmapWizard: React.FC<RoadmapWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState<'domain' | 'experience' | 'questions' | 'generating' | 'complete'>('domain')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [selectedExperience, setSelectedExperience] = useState<string>('')
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('domain')
      setSelectedDomain('')
      setSelectedExperience('')
      setInterviewQuestions([])
      setUserAnswers({})
      setError(null)
      setGeneratedRoadmap(null)
    }
  }, [isOpen])

  const handleDomainSelect = async (domainId: string) => {
    setSelectedDomain(domainId)
  }

  const handleExperienceSelect = async (experienceId: string) => {
    setSelectedExperience(experienceId)
  }

  const proceedToQuestions = async () => {
    if (!selectedDomain || !selectedExperience) {
      setError('Please select both domain and experience level')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Fetch interview questions based on domain and experience
      const questions = await apiService.getInterviewQuestions()
      console.log('📋 Fetched interview questions:', questions)
      
      // Filter questions based on selected domain (if needed)
      setInterviewQuestions(questions.slice(0, 5)) // Limit to 5 questions for demo
      setCurrentStep('questions')
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
      setError('Failed to load interview questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const generateRoadmap = async () => {
    setLoading(true)
    setCurrentStep('generating')
    setError(null)

    try {
      const selectedDomainData = DOMAIN_OPTIONS.find(d => d.id === selectedDomain)
      const selectedExperienceData = EXPERIENCE_LEVELS.find(e => e.id === selectedExperience)

      // Prepare roadmap generation data
      const roadmapRequest = {
        userId,
        domain: selectedDomain,
        domainName: selectedDomainData?.name,
        experienceLevel: selectedExperience,
        hoursPerWeek: selectedExperienceData?.hoursPerWeek,
        userAnswers: Object.entries(userAnswers).map(([questionId, answer]) => ({
          questionId,
          answer,
          question: interviewQuestions.find(q => q.question_id === questionId)?.question_text
        }))
      }

      console.log('🚀 Generating roadmap with data:', roadmapRequest)
      
      const roadmapData = await apiService.generateRoadmap(userId, roadmapRequest.userAnswers)
      console.log('✅ Roadmap generated:', roadmapData)
      
      setGeneratedRoadmap(roadmapData)
      setCurrentStep('complete')
      
      // Call parent completion handler
      onComplete(roadmapData)
      
    } catch (err) {
      console.error('❌ Error generating roadmap:', err)
      setError('Failed to generate roadmap. Please try again.')
      setCurrentStep('questions')
    } finally {
      setLoading(false)
    }
  }

  const renderDomainStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your Learning Domain
        </h3>
        <p className="text-gray-600">
          Select the subject area you want to focus on for your personalized learning roadmap
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {DOMAIN_OPTIONS.map((domain) => (
          <button
            key={domain.id}
            onClick={() => handleDomainSelect(domain.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
              selectedDomain === domain.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl" role="img" aria-label={domain.name}>
                {domain.icon}
              </span>
              <div>
                <h4 className="font-medium text-gray-900">{domain.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{domain.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep('experience')}
          disabled={!selectedDomain}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedDomain
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Experience Level
        </button>
      </div>
    </div>
  )

  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          What's Your Experience Level?
        </h3>
        <p className="text-gray-600">
          This helps us customize the difficulty and pace of your learning path
        </p>
      </div>

      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleExperienceSelect(level.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
              selectedExperience === level.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{level.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  {level.hoursPerWeek}h/week
                </div>
                <div className="text-xs text-gray-500">Recommended</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('domain')}
          className="px-6 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={proceedToQuestions}
          disabled={!selectedExperience || loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            selectedExperience && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </>
          ) : (
            'Next: Quick Assessment'
          )}
        </button>
      </div>
    </div>
  )

  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Quick Learning Assessment
        </h3>
        <p className="text-gray-600">
          Help us personalize your roadmap with a few quick questions
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-4">
        {interviewQuestions.map((question, index) => {
          const questionId = question.question_id;
          const questionType = question.question_type;
          
          return (
            <div key={questionId} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {index + 1}. {question.question_text}
              </h4>

              {questionType === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${questionId}-${optionIndex}`} className="flex items-center">
                      <input
                        type="radio"
                        name={questionId}
                        value={option}
                        onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {(questionType === 'open_ended' || !questionType) && (
                <textarea
                  placeholder="Your answer..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                />
              )}

              {questionType === 'rating_scale' && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="flex-1"
                    onChange={(e) => handleAnswerChange(questionId, parseInt(e.target.value))}
                  />
                  <span className="text-sm text-gray-600">10</span>
                  <span className="text-sm font-medium text-gray-700 min-w-8">
                    {userAnswers[questionId] || 5}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('experience')}
          className="px-6 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={generateRoadmap}
          disabled={loading || Object.keys(userAnswers).length === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            !loading && Object.keys(userAnswers).length > 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Target className="h-4 w-4 mr-2" />
          Generate My Roadmap
        </button>
      </div>
    </div>
  )

  const renderGeneratingStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Creating Your Learning Roadmap
        </h3>
        <p className="text-gray-600">
          Our AI is analyzing your preferences and generating a personalized learning path...
        </p>
      </div>
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2 text-blue-700 text-sm">
          <Brain className="h-4 w-4" />
          <span>Matching with PES curriculum and study materials</span>
        </div>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Roadmap Created Successfully!
        </h3>
        <p className="text-gray-600">
          Your personalized learning roadmap is ready. You can now view it in your dashboard.
        </p>
      </div>
      {generatedRoadmap && (
        <div className="bg-green-50 rounded-lg p-4 text-left">
          <h4 className="font-medium text-green-900 mb-2">Your Learning Path Summary:</h4>
          <div className="space-y-1 text-sm text-green-800">
            <div>🎯 Goal: {generatedRoadmap.learning_goal}</div>
            <div>📚 Phases: {generatedRoadmap.generated_roadmap?.total_phases || 'Multiple'}</div>
            <div>⏱️ Weekly Commitment: {generatedRoadmap.hours_per_week}h</div>
            <div>📈 Level: {generatedRoadmap.experience_level}</div>
          </div>
        </div>
      )}
      <button
        onClick={onClose}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        View My Dashboard
      </button>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Learning Roadmap Setup
            </h2>
          </div>
          {currentStep !== 'generating' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {currentStep === 'domain' && renderDomainStep()}
          {currentStep === 'experience' && renderExperienceStep()}
          {currentStep === 'questions' && renderQuestionsStep()}
          {currentStep === 'generating' && renderGeneratingStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'generating' && currentStep !== 'complete' && (
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Step {currentStep === 'domain' ? 1 : currentStep === 'experience' ? 2 : 3} of 3
              </span>
              <div className="flex space-x-2">
                {['domain', 'experience', 'questions'].map((step, index) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      (currentStep === 'domain' && index === 0) ||
                      (currentStep === 'experience' && index <= 1) ||
                      (currentStep === 'questions' && index <= 2)
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoadmapWizard
