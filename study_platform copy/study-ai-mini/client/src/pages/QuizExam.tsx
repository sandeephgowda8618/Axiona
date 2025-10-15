import React, { useState, useEffect, useCallback, useRef } from 'react'
// NOTE: file repaired to fix previous malformed JSX insertion; small comment to
// trigger HMR reparse when saved.
// touch
import { useParams, useNavigate } from 'react-router-dom'
import { Quiz, QuizQuestion, QuizAttempt, QuizSession } from '../types/quiz'
import { getQuizById } from '../data/mockQuizzes'
import { examRestrictions } from '../types/quiz'

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
  const timerRef = useRef<number | null>(null)
  const warningTimeoutRef = useRef<number | null>(null)
  
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

  // Palette pagination state: show a 5x5 matrix (25 tiles) per page
  const [palettePage, setPalettePage] = useState<number>(0)
  const PALETTE_PAGE_SIZE = 25


  // Load quiz and initialize attempt/session/timer
  useEffect(() => {
    if (!quizId) return
    const quiz = getQuizById(quizId)
    if (!quiz) {
      // navigate back to quiz list if not found
      navigate('/quiz')
      return
    }

    setState(prev => ({
      ...prev,
      quiz,
      timeRemaining: quiz.duration * 60,
      answers: {},
      visitedQuestions: new Set(["0"]),
      currentQuestionIndex: 0,
      showInstructions: true
    }))

    // start countdown
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = window.setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          return prev
        }
        const next = { ...prev, timeRemaining: prev.timeRemaining - 1 }
        // auto submit when time runs out
        if (next.timeRemaining <= 0) {
          // trigger submit
          submitQuiz(true)
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [quizId])
 
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

  // Rough sheet (in-page) state
  const [roughOpen, setRoughOpen] = useState(false)
  const [roughContent, setRoughContent] = useState<string>('')
  const [roughFullscreen, setRoughFullscreen] = useState(false)
  const roughRef = useRef<HTMLTextAreaElement | null>(null)

  const startQuiz = () => {
    // Do not force fullscreen programmatically. Instead, if fullscreen is required,
    // keep instructions visible but show a manual prompt so the user can enter fullscreen.
    if (examRestrictions.fullscreenRequired) {
      setState(prev => ({ ...prev, showInstructions: false }))
      // show small notice that fullscreen is recommended/required
      // we don't block starting the quiz, just advise the user
      // (the UI elsewhere will detect isFullscreen if user activates it)
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
    setState(prev => ({ ...prev, answers: { ...prev.answers, [questionId]: answer } }))
  }

  const submitQuiz = (isAutoSubmit = false) => {
    if (!state.quiz || !state.attempt) return

    setState(prev => ({ ...prev, isSubmitting: true }))
    
    // Calculate results
    const results = calculateResults()
    
    // In real app, send to backend
    console.log('Quiz submitted:', { 
      attempt: state.attempt, 
      answers: state.answers, 
      results,
      isAutoSubmit 
    })
    
    // Navigate to results page
    setTimeout(() => {
      navigate(`/quiz/${state.quiz?.id}/results`, { 
        state: { results, answers: state.answers, attempt: state.attempt }
      })
    }, 2000)
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
    // Return Tailwind classes for the palette items. Use colors and borders
    // that match the design: darker filled squares for answered/marked,
    // subtle borders for not-visited, and a clear highlight for the current item.
    switch (status) {
      // Dark square for answered
      case 'answered':
        return 'bg-gray-700 text-white border-gray-700'
      // Highlighted dark for marked for review (use indigo/darker)
      case 'marked':
        return 'bg-indigo-700 text-white border-indigo-700'
      // Combined answered+marked
      case 'answered-marked':
        return 'bg-indigo-800 text-white border-indigo-800'
      // Visited but not answered: subtle fill
      case 'visited':
        return 'bg-gray-100 border-gray-200 text-gray-700'
      // Not visited / default: very light
      default:
        return 'bg-gray-50 border-gray-100 text-gray-700'
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
              <li>• Do not switch tabs or minimize the browser (Max {examRestrictions.tabSwitchLimit} switches allowed)</li>
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
              {examRestrictions.fullscreenRequired ? 'Start Quiz (Enter Fullscreen)' : 'Start Quiz'}
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
      {/* Improved Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{state.quiz.title}</h1>
            <p className="text-sm text-gray-600">Question {state.currentQuestionIndex + 1} of {state.quiz.totalQuestions}</p>
          </div>

          <div className="flex items-center space-x-4">
            {state.tabSwitchCount > 0 && (
              <div className="text-sm text-red-600 font-medium">⚠️ Tab switches: {state.tabSwitchCount}/{examRestrictions.tabSwitchLimit}</div>
            )}

            <div className={`px-3 py-2 rounded-md border ${state.timeRemaining <= 300 ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-900'}`}>
              <div className="text-sm text-gray-500">Time Left</div>
              <div className="text-lg font-mono font-bold">⏰ {formatTime(state.timeRemaining)}</div>
            </div>

            <button className="hidden md:inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">
              📋 Question Palette
            </button>
          </div>
        </div>
      </header>

      {/* Main two-column layout */}
      <main className="flex-1">
  <div className="max-w-7xl mx-auto quiz-layout px-6 py-8">
          {/* Left: Question area (span 3 on large screens) */}
          <section className="w-full quiz-main">
            <div className="bg-white rounded-lg shadow p-10 mb-10 min-h-[420px]">
              <div className="flex items-start space-x-5">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">{state.currentQuestionIndex + 1}</div>
                </div>

                <div className="flex-1">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{currentQuestion.question}</h2>
                  {currentQuestion.image && (
                    <div className="mt-4 mb-6">
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">Diagram / Image</div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => {
                      const selected = state.answers[currentQuestion.id] === option
                      return (
                        <label key={index} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-shadow ${selected ? 'border-indigo-500 shadow-md bg-indigo-50' : 'border-gray-200 hover:shadow-sm hover:bg-gray-50'}`}>
                          <input
                            type="radio"
                            name={`question_${currentQuestion.id}`}
                            value={option}
                            checked={selected}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="mr-4 text-indigo-600 w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-gray-800">{String.fromCharCode(65 + index)}. <span className="font-normal">{option}</span></div>
                              </div>
                              {selected && <div className="ml-4 text-sm text-indigo-700 font-semibold">Selected</div>}
                            </div>
                          </div>
                        </label>
                      )
                    })}

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
                  </div>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateToQuestion(Math.max(0, state.currentQuestionIndex - 1))}
                  disabled={state.currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                  className={`px-4 py-2 rounded-md font-medium ${state.markedForReview.has(currentQuestion.id) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  🚩 Mark for Review
                </button>

                <button
                  onClick={() => { setRoughOpen(r => !r); setTimeout(() => roughRef.current?.focus(), 50) }}
                  className="px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-100"
                >
                  ✏️ Rough Sheet
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {state.currentQuestionIndex === state.quiz.questions.length - 1 ? (
                  <button onClick={() => submitQuiz()} className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700">✅ Submit Quiz</button>
                ) : (
                  <button onClick={() => navigateToQuestion(state.currentQuestionIndex + 1)} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700">Next →</button>
                )}
              </div>
            </div>
          </section>

          {/* In-page Rough Sheet / Solution editor (togglable) */}
          {roughOpen && (
            <div className="w-full md:col-span-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Rough Sheet / Solution</div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setRoughFullscreen(true)} className="px-3 py-1 text-xs rounded border bg-gray-50">Expand</button>
                    <button onClick={() => setRoughOpen(false)} className="px-3 py-1 text-xs rounded border bg-gray-50">Close</button>
                  </div>
                </div>
                <textarea
                  ref={roughRef}
                  value={roughContent}
                  onChange={(e) => setRoughContent(e.target.value)}
                  placeholder="Write your full solution or workings here..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-vertical"
                  style={{ minHeight: 280 }}
                />
              </div>
            </div>
          )}

          {/* Right: Sidebar / Palette */}
          <aside className="quiz-aside">
            <div className="bg-white rounded-lg border-l border-gray-200 p-4 w-full sticky-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Question Palette <span className="ml-2 text-xs text-red-500">(dev update)</span></h3>
                <div className="text-xs text-gray-500">{state.currentQuestionIndex + 1}/{state.quiz.totalQuestions}</div>
              </div>

              {/* Legend */}
              <div className="mb-4 text-xs text-gray-600">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center"><span className="w-3 h-3 bg-gray-700 rounded-sm mr-2 border border-gray-700"></span>Answered</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-indigo-700 rounded-sm mr-2 border border-indigo-700"></span>Marked for Review</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-gray-100 rounded-sm mr-2 border border-gray-200"></span>Not Answered</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-gray-50 rounded-sm mr-2 border border-gray-100"></span>Not Visited</div>
                </div>
              </div>

              {/* Grid: compact square palette like reference */}
              {/* Paginated 5x5 palette matrix */}
              <div className="grid grid-cols-5 gap-2 mb-2 justify-items-center" style={{ gridTemplateColumns: 'repeat(5, 52px)', justifyContent: 'start' }}>
                {state.quiz.questions.slice(palettePage * PALETTE_PAGE_SIZE, (palettePage + 1) * PALETTE_PAGE_SIZE).map((question, i) => {
                  const index = palettePage * PALETTE_PAGE_SIZE + i
                  const status = getQuestionStatus(index, question.id)
                  // Fixed small square tiles to match reference; center each tile so it doesn't stretch
                  const base = 'max-w-[44px] max-h-[44px] flex items-center justify-center text-sm font-medium rounded-md border transition justify-self-center inline-flex'
                  const isCurrent = index === state.currentQuestionIndex
                  return (
                    <button
                      key={question.id}
                      onClick={() => navigateToQuestion(index)}
                      aria-label={`Go to question ${index + 1}`}
                      className={`${base} ${getStatusColor(status)} ${isCurrent ? 'ring-2 ring-indigo-500 transform scale-105' : ''}`}
                      style={{ width: 52, height: 52 }}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              {/* Palette pagination controls */}
              <div className="flex items-center justify-between mt-2">
                {(() => {
                  const total = state.quiz ? state.quiz.questions.length : 0
                  const pageCount = Math.max(1, Math.ceil(total / PALETTE_PAGE_SIZE))
                  return (
                    <>
                      <button
                        onClick={() => setPalettePage(p => Math.max(0, p - 1))}
                        disabled={palettePage === 0}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                      >
                        ← Prev
                      </button>

                      <div className="text-sm text-gray-500">Page {palettePage + 1} / {pageCount}</div>

                      <button
                        onClick={() => setPalettePage(p => Math.min(p + 1, pageCount - 1))}
                        disabled={palettePage >= pageCount - 1}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </>
                  )
                })()}
              </div>

              {/* Summary */}
              <div className="mb-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Answered</span><span className="font-medium text-green-600">{Object.keys(state.answers).length}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Marked</span><span className="font-medium text-purple-600">{state.markedForReview.size}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Not Answered</span><span className="font-medium text-red-600">{state.quiz.questions.length - Object.keys(state.answers).length}</span></div>
              </div>

              <div className="mb-2">
                <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.round((Object.keys(state.answers).length / state.quiz.questions.length) * 100)}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Progress: {Math.round((Object.keys(state.answers).length / state.quiz.questions.length) * 100)}%</div>
              </div>

              <button onClick={() => submitQuiz()} disabled={state.isSubmitting} className="w-full mt-2 bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{state.isSubmitting ? 'Submitting...' : '🚀 Submit Quiz'}</button>
            </div>
          </aside>
        </div>
      </main>

      {/* Warning Modal */}
      {state.showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ Time Warning</h3>
            <p className="text-gray-700 mb-4">Only {Math.floor(state.timeRemaining / 60)} minutes remaining! Please submit your answers soon.</p>
            <button onClick={() => setState(prev => ({ ...prev, showWarning: false }))} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Continue Quiz</button>
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
