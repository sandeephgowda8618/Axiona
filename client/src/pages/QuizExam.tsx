import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Quiz, QuizQuestion, QuizAttempt, QuizSession } from '../types/quiz'
import { quizzesAPI } from '../api/studyAI'

interface QuizExamState {
  quiz: Quiz | null
  attempt: QuizAttempt | null
  session: QuizSession | null
  currentQuestionIndex: number
  answers: Record<string, any>
  markedForReview: Set<string>
  visitedQuestions: Set<string>
  timeRemaining: number
  isSubmitting: boolean
  showWarning: boolean
  tabSwitchCount: number
  isFullscreen: boolean
  showInstructions: boolean
}

const QuizExam: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [state, setState] = useState<QuizExamState>({
    quiz: null,
    attempt: null,
    session: null,
    currentQuestionIndex: 0,
    answers: {},
    markedForReview: new Set(),
    visitedQuestions: new Set(),
    timeRemaining: 0,
    isSubmitting: false,
    showWarning: false,
    tabSwitchCount: 0,
    isFullscreen: false,
    showInstructions: true
  })

  // Initialize quiz and session
  useEffect(() => {
    if (!quizId) {
      navigate('/quiz-selection')
      return
    }

    const loadQuiz = async () => {
      try {
        const response = await quizzesAPI.getQuizQuestions(quizId)
        const quiz = response.data

        if (!quiz) {
          navigate('/quiz-selection')
          return
        }

        // Create new attempt
        const attempt: QuizAttempt = {
          id: `attempt_${Date.now()}`,
          quizId: quiz.id,
          userId: 'current_user', // In real app, get from auth context
          startTime: new Date().toISOString(),
          status: 'in-progress',
          answers: {},
          markedForReview: [],
          score: 0,
          percentage: 0,
          passed: false,
          currentQuestionIndex: 0,
          visitedQuestions: [],
          duration: 0,
          flaggedQuestions: []
        }

        // Create session
        const session: QuizSession = {
          attemptId: attempt.id,
          quizId: quiz.id,
          isActive: true,
          startTime: Date.now(),
          timeLimit: quiz.duration * 60 * 1000, // Convert to milliseconds
          warningShown: false,
          tabSwitchCount: 0,
          maxTabSwitches: 3, // Default tab switch limit
          fullscreenExited: false,
          allowTabSwitch: false,
          proctoring: {
            enabled: true,
            tabSwitchDetection: true,
            fullscreenRequired: false,
            timeTrackingEnabled: true,
            copyPasteDisabled: true,
            rightClickDisabled: true
          }
        }

        setState(prev => ({
          ...prev,
          quiz,
          attempt,
          session,
          timeRemaining: quiz.duration * 60,
          visitedQuestions: new Set(['0'])
        }))
      } catch (error) {
        console.error('Failed to load quiz:', error)
        navigate('/quiz-selection')
      }
    }

    loadQuiz()
  }, [quizId, navigate])

  // Timer effect
  useEffect(() => {
    if (!state.quiz || !state.session?.isActive || state.showInstructions) return

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1
        
        // Show warning at configured time
        if (newTimeRemaining === prev.quiz?.proctoring.timeWarningAt && !prev.showWarning) {
          return { ...prev, timeRemaining: newTimeRemaining, showWarning: true }
        }
        
        // Auto-submit when time expires
        if (newTimeRemaining <= 0) {
          handleTimeExpiry()
          return { ...prev, timeRemaining: 0 }
        }
        
        return { ...prev, timeRemaining: newTimeRemaining }
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.quiz, state.session?.isActive, state.showInstructions])

  // Fullscreen and tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.session?.isActive && !state.showInstructions) {
        handleTabSwitch()
      }
    }

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      setState(prev => ({ ...prev, isFullscreen }))
      
      if (!isFullscreen && state.session?.isActive && !state.showInstructions) {
        handleFullscreenExit()
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.session?.isActive && !state.showInstructions) {
        e.preventDefault()
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.'
        return e.returnValue
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (state.session?.proctoring.copyPasteDisabled) {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 's'].includes(e.key.toLowerCase())) {
          e.preventDefault()
        }
      }
      
      // Prevent F12, Ctrl+Shift+I (Developer Tools)
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault()
      }
    }

    const handleRightClick = (e: MouseEvent) => {
      if (state.session?.proctoring.rightClickDisabled && state.session?.isActive && !state.showInstructions) {
        e.preventDefault()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleRightClick)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleRightClick)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [state.session?.isActive, state.showInstructions])

  const handleTabSwitch = useCallback(() => {
    setState(prev => {
      const newTabSwitchCount = prev.tabSwitchCount + 1
      
      if (newTabSwitchCount >= (prev.quiz?.proctoring.tabSwitchLimit || 2)) {
        // Auto-submit exam
        setTimeout(() => {
          handleAutoSubmit('Tab switch limit exceeded')
        }, 1000)
      }
      
      return { ...prev, tabSwitchCount: newTabSwitchCount }
    })
  }, [])

  const handleFullscreenExit = useCallback(() => {
    setState(prev => {
      if (prev.quiz?.proctoring.fullscreenRequired) {
        setTimeout(() => {
          handleAutoSubmit('Exited fullscreen mode')
        }, 2000)
      }
      return prev
    })
  }, [])

  const handleTimeExpiry = useCallback(() => {
    handleAutoSubmit('Time limit exceeded')
  }, [])

  const handleAutoSubmit = useCallback((reason: string) => {
    setState(prev => ({ ...prev, isSubmitting: true }))
    
    // Show warning message
    alert(`Quiz will be auto-submitted: ${reason}`)
    
    // Submit the quiz
    setTimeout(() => {
      submitQuiz(true)
    }, 2000)
  }, [])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setState(prev => ({ ...prev, isFullscreen: true, showInstructions: false }))
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      setState(prev => ({ ...prev, showInstructions: false }))
    }
  }

  const startQuiz = () => {
    const quiz = state.quiz
    if (quiz?.proctoring.fullscreenRequired) {
      enterFullscreen()
    } else {
      setState(prev => ({ ...prev, showInstructions: false }))
    }
  }

  const navigateToQuestion = (index: number) => {
    if (!state.quiz) return
    
    setState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      visitedQuestions: new Set([...prev.visitedQuestions, index.toString()])
    }))
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }))
  }

  const handleOptionToggle = (questionId: string, option: any) => {
    setState(prev => {
      const current = prev.answers[questionId]
      let updated: any[] = []
      if (Array.isArray(current)) {
        if (current.includes(option)) {
          updated = current.filter((o: any) => o !== option)
        } else {
          updated = [...current, option]
        }
      } else {
        // start a new multi-select array
        updated = [option]
      }

      return { ...prev, answers: { ...prev.answers, [questionId]: updated } }
    })
  }

  const handleWorkspaceChange = (questionId: string, value: string) => {
    setState(prev => ({ ...prev, answers: { ...prev.answers, [`${questionId}_workspace`]: value } }))
  }

  const toggleMarkForReview = (questionId: string) => {
    setState(prev => {
      const newMarked = new Set(prev.markedForReview)
      if (newMarked.has(questionId)) {
        newMarked.delete(questionId)
      } else {
        newMarked.add(questionId)
      }
      return { ...prev, markedForReview: newMarked }
    })
  }

  const submitQuiz = async (isAutoSubmit = false) => {
    if (!state.quiz || !state.attempt) return

    setState(prev => ({ ...prev, isSubmitting: true }))
    
    try {
      // Calculate time spent
      const timeSpent = (Date.now() - new Date(state.attempt.startTime).getTime()) / 1000
      
      // Submit to backend
      const response = await quizzesAPI.submitQuiz(state.quiz.id, state.answers, timeSpent)
      const results = response.data
      
      // Navigate to results page
      navigate(`/quiz/${state.quiz.id}/results`, { 
        state: { results, answers: state.answers, attempt: state.attempt }
      })
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      // Fallback: calculate results locally
      const results = calculateResults()
      navigate(`/quiz/${state.quiz.id}/results`, { 
        state: { results, answers: state.answers, attempt: state.attempt }
      })
    }
  }

  const calculateResults = () => {
    if (!state.quiz) return null
    
    let correctAnswers = 0
    let totalMarks = 0
    let obtainedMarks = 0
    
    state.quiz.questions.forEach(question => {
      const userAnswer = state.answers[question.id]
      totalMarks += question.marks
      
      if (userAnswer === question.correctAnswer) {
        correctAnswers++
        obtainedMarks += question.marks
      }
    })
    
    const percentage = (obtainedMarks / totalMarks) * 100
    const passed = obtainedMarks >= state.quiz.passingMarks
    
    return {
      correctAnswers,
      totalQuestions: state.quiz.questions.length,
      obtainedMarks,
      totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      passed
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (index: number, questionId: string) => {
    const isAnswered = state.answers[questionId] !== undefined
    const isMarkedForReview = state.markedForReview.has(questionId)
    const isVisited = state.visitedQuestions.has(index.toString())
    
    if (isAnswered && isMarkedForReview) return 'answered-marked'
    if (isAnswered) return 'answered'
    if (isMarkedForReview) return 'marked'
    if (isVisited) return 'visited'
    return 'not-visited'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-600 text-white'
      case 'marked': return 'bg-purple-600 text-white'
      case 'answered-marked': return 'bg-blue-600 text-white'
      case 'visited': return 'bg-red-600 text-white'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  if (!state.quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Instructions screen
  if (state.showInstructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{state.quiz.title}</h1>
            <p className="text-gray-600">{state.quiz.description}</p>
          </div>

          {/* Quiz Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{state.quiz.totalQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{state.quiz.maxMarks}</div>
              <div className="text-sm text-gray-600">Max Marks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{state.quiz.duration}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{state.quiz.passingMarks}</div>
              <div className="text-sm text-gray-600">Pass Marks</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <ul className="space-y-2">
              {state.quiz.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warning Messages */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Warnings</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Do not switch tabs or minimize the browser (Max {state.quiz?.proctoring.tabSwitchLimit || 2} switches allowed)</li>
              <li>• Stay in fullscreen mode throughout the exam</li>
              <li>• Right-click and copy-paste are disabled</li>
              <li>• The exam will auto-submit if you violate any rules</li>
              <li>• Your progress is automatically saved</li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startQuiz}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {state.quiz?.proctoring.fullscreenRequired ? 'Start Quiz (Enter Fullscreen)' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = state.quiz.questions[state.currentQuestionIndex]
  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{state.quiz.title}</h1>
            <p className="text-sm text-gray-600">Question {state.currentQuestionIndex + 1} of {state.quiz.totalQuestions}</p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Tab Switch Warning */}
            {state.tabSwitchCount > 0 && (
              <div className="text-red-600 text-sm font-medium">
                ⚠️ Tab switches: {state.tabSwitchCount}/{state.quiz?.proctoring.tabSwitchLimit || 2}
              </div>
            )}
            
            {/* Timer */}
            <div className={`text-lg font-mono font-bold ${
              state.timeRemaining <= 300 ? 'text-red-600' : 'text-gray-900'
            }`}>
              ⏰ {formatTime(state.timeRemaining)}
            </div>
            
            {/* Palette Button */}
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-900">
              📋 Palette
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Question {state.currentQuestionIndex + 1}
              </h2>
              <p className="text-gray-700 leading-relaxed">{currentQuestion.question}</p>
            </div>

            {/* Question Image/Diagram */}
            {currentQuestion.image && (
              <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                  Physics Diagram
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'single-choice') && currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type={currentQuestion.type === 'multiple-choice' ? 'checkbox' : 'radio'}
                    name={`question_${currentQuestion.id}`}
                    value={option}
                    checked={currentQuestion.type === 'multiple-choice'
                      ? Array.isArray(state.answers[currentQuestion.id]) && state.answers[currentQuestion.id].includes(option)
                      : state.answers[currentQuestion.id] === option}
                    onChange={(e) => {
                      if (currentQuestion.type === 'multiple-choice') {
                        handleOptionToggle(currentQuestion.id, option)
                      } else {
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-700 mr-2">{String.fromCharCode(65 + index)}.</span>
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}

              {currentQuestion.type === 'numerical' && (
                <div>
                  <input
                    type="number"
                    value={state.answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, parseFloat(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your numerical answer"
                  />
                </div>
              )}

              {/* Workspace / Scratchpad for solving problems */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-800">Workspace</h4>
                  <button
                    onClick={() => handleWorkspaceChange(currentQuestion.id, '')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={state.answers[`${currentQuestion.id}_workspace`] || ''}
                  onChange={(e) => handleWorkspaceChange(currentQuestion.id, e.target.value)}
                  rows={8}
                  placeholder="Work out your solution here. Notes are saved automatically for this question."
                  className="w-full p-3 border border-gray-300 rounded resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateToQuestion(Math.max(0, state.currentQuestionIndex - 1))}
              disabled={state.currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`px-4 py-2 rounded-md font-medium ${
                  state.markedForReview.has(currentQuestion.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🚩 Mark for Review
              </button>
              
              {state.currentQuestionIndex === state.quiz.questions.length - 1 ? (
                <button
                  onClick={() => submitQuiz()}
                  className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700"
                >
                  ✅ Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => navigateToQuestion(state.currentQuestionIndex + 1)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>
          
          {/* Legend */}
          <div className="mb-6 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {state.quiz.questions.map((question, index) => {
              const status = getQuestionStatus(index, question.id)
              return (
                <button
                  key={question.id}
                  onClick={() => navigateToQuestion(index)}
                  className={`w-10 h-10 rounded text-sm font-medium ${getStatusColor(status)} ${
                    index === state.currentQuestionIndex ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="font-medium text-green-600">
                {Object.keys(state.answers).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Marked for Review:</span>
              <span className="font-medium text-purple-600">
                {state.markedForReview.size}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Not Answered:</span>
              <span className="font-medium text-red-600">
                {state.quiz.questions.length - Object.keys(state.answers).length}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => submitQuiz()}
            disabled={state.isSubmitting}
            className="w-full mt-6 bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isSubmitting ? 'Submitting...' : '🚀 Submit Quiz'}
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {state.showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ Time Warning</h3>
            <p className="text-gray-700 mb-4">
              Only {Math.floor(state.timeRemaining / 60)} minutes remaining! Please submit your answers soon.
            </p>
            <button
              onClick={() => setState(prev => ({ ...prev, showWarning: false }))}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Continue Quiz
            </button>
          </div>
        </div>
      )}

      {/* Submitting Modal */}
      {state.isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting Quiz...</h3>
            <p className="text-gray-600">Please wait while we process your answers.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizExam
