import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Quiz, QuizQuestion, QuizAttempt, QuizSession } from '../types/quiz'
import { getQuizById } from '../data/mockQuizzes'
import { examRestrictions } from '../types/quiz'

interface SecurityEvent {
  type: 'tab_switch' | 'fullscreen_exit' | 'right_click' | 'copy_paste' | 'developer_tools' | 'idle' | 'suspicious_key' | 'focus_loss'
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

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
  showCriticalWarning: boolean
  tabSwitchCount: number
  isFullscreen: boolean
  showInstructions: boolean
  securityEvents: SecurityEvent[]
  suspiciousActivityCount: number
  idleTimeCount: number
  lastActivityTime: number
  focusTime: number
  totalElapsedTime: number
  isWindowFocused: boolean
  showSecurityAlert: boolean
  securityAlertMessage: string
  questionStartTime: number
  questionTimeSpent: Record<string, number>
  mouseMovements: number
  keystrokes: number
  showFinalWarning: boolean
  autoSubmitReason: string | null
}

const QuizExamSecure: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const securityCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
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
    showCriticalWarning: false,
    tabSwitchCount: 0,
    isFullscreen: false,
    showInstructions: true,
    securityEvents: [],
    suspiciousActivityCount: 0,
    idleTimeCount: 0,
    lastActivityTime: Date.now(),
    focusTime: 0,
    totalElapsedTime: 0,
    isWindowFocused: true,
    showSecurityAlert: false,
    securityAlertMessage: '',
    questionStartTime: Date.now(),
    questionTimeSpent: {},
    mouseMovements: 0,
    keystrokes: 0,
    showFinalWarning: false,
    autoSubmitReason: null
  })

  // Initialize quiz and session
  useEffect(() => {
    if (!quizId) {
      navigate('/quiz-selection')
      return
    }

    const quiz = getQuizById(quizId)
    if (!quiz) {
      navigate('/quiz-selection')
      return
    }

    // Create new attempt
    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: quiz.id,
      userId: 'current_user',
      startTime: new Date().toISOString(),
      status: 'in-progress',
      answers: {},
      markedForReview: [],
      score: 0,
      percentage: 0,
      passed: false,
      currentQuestionIndex: 0,
      visitedQuestions: [],
      flaggedQuestions: [],
      duration: 0
    }

    // Create enhanced session
    const session: QuizSession = {
      attemptId: attempt.id,
      quizId: quiz.id,
      isActive: true,
      startTime: Date.now(),
      timeLimit: quiz.duration * 60 * 1000,
      warningShown: false,
      tabSwitchCount: 0,
      maxTabSwitches: examRestrictions.tabSwitchLimit,
      fullscreenExited: false,
      allowTabSwitch: false,
      proctoring: {
        enabled: true,
        tabSwitchDetection: examRestrictions.detectTabSwitch,
        fullscreenRequired: examRestrictions.fullscreenRequired,
        timeTrackingEnabled: true,
        copyPasteDisabled: examRestrictions.preventCopyPaste,
        rightClickDisabled: examRestrictions.preventRightClick
      }
    }

    setState(prev => ({
      ...prev,
      quiz,
      attempt,
      session,
      timeRemaining: quiz.duration * 60,
      visitedQuestions: new Set(['0']),
      questionStartTime: Date.now()
    }))
  }, [quizId, navigate])

  // Main timer effect
  useEffect(() => {
    if (!state.quiz || !state.session?.isActive || state.showInstructions) return

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1
        const newTotalElapsed = prev.totalElapsedTime + 1
        
        // Show critical warning at 1 minute
        if (newTimeRemaining === examRestrictions.criticalTimeWarningAt && !prev.showCriticalWarning) {
          return { 
            ...prev, 
            timeRemaining: newTimeRemaining, 
            totalElapsedTime: newTotalElapsed,
            showCriticalWarning: true 
          }
        }
        
        // Show warning at 5 minutes
        if (newTimeRemaining === examRestrictions.timeWarningAt && !prev.showWarning) {
          return { 
            ...prev, 
            timeRemaining: newTimeRemaining, 
            totalElapsedTime: newTotalElapsed,
            showWarning: true 
          }
        }
        
        // Auto-submit when time expires
        if (newTimeRemaining <= 0) {
          handleAutoSubmit('Time limit exceeded')
          return { ...prev, timeRemaining: 0, totalElapsedTime: newTotalElapsed }
        }
        
        return { ...prev, timeRemaining: newTimeRemaining, totalElapsedTime: newTotalElapsed }
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.quiz, state.session?.isActive, state.showInstructions])

  // Idle detection timer
  useEffect(() => {
    if (!state.session?.isActive || state.showInstructions) return

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      
      idleTimerRef.current = setTimeout(() => {
        logSecurityEvent('idle', 'medium', 'User has been idle for extended period')
        setState(prev => ({ 
          ...prev, 
          idleTimeCount: prev.idleTimeCount + 1,
          showSecurityAlert: true,
          securityAlertMessage: 'You have been idle for too long. Please interact with the exam.'
        }))
      }, examRestrictions.maxIdleTime * 1000)
    }

    const handleActivity = () => {
      setState(prev => ({ ...prev, lastActivityTime: Date.now() }))
      resetIdleTimer()
    }

    resetIdleTimer()

    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keydown', handleActivity)
    document.addEventListener('click', handleActivity)

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keydown', handleActivity)
      document.removeEventListener('click', handleActivity)
    }
  }, [state.session?.isActive, state.showInstructions])

  // Enhanced security event handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden
      setState(prev => ({ ...prev, isWindowFocused: !isHidden }))
      
      if (isHidden && state.session?.isActive && !state.showInstructions) {
        logSecurityEvent('tab_switch', 'high', 'User switched away from exam tab')
        handleTabSwitch()
      }
    }

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      setState(prev => ({ ...prev, isFullscreen }))
      
      if (!isFullscreen && state.session?.isActive && !state.showInstructions) {
        logSecurityEvent('fullscreen_exit', 'critical', 'User exited fullscreen mode')
        handleFullscreenExit()
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.session?.isActive && !state.showInstructions) {
        logSecurityEvent('suspicious_key', 'high', 'User attempted to leave exam page')
        e.preventDefault()
        e.returnValue = 'Are you sure you want to leave? Your exam will be auto-submitted.'
        return e.returnValue
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      setState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }))
      
      // Enhanced keyboard shortcut blocking
      const blockedKeys = examRestrictions.keyboardShortcutBlocking
      const keyCombo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' : ''}${e.metaKey ? 'Cmd+' : ''}${e.key}`
      
      if (blockedKeys.some(blocked => keyCombo.includes(blocked)) || 
          e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
          (e.ctrlKey && ['u', 'U', 's', 'S', 'p', 'P'].includes(e.key))) {
        
        e.preventDefault()
        logSecurityEvent('developer_tools', 'critical', `Blocked keyboard shortcut: ${keyCombo}`)
        
        setState(prev => ({ 
          ...prev, 
          suspiciousActivityCount: prev.suspiciousActivityCount + 1,
          showSecurityAlert: true,
          securityAlertMessage: 'Keyboard shortcuts are disabled during the exam.'
        }))
        
        return false
      }

      // Block copy-paste
      if (state.session?.proctoring.copyPasteDisabled) {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
          e.preventDefault()
          logSecurityEvent('copy_paste', 'medium', `Blocked copy/paste action: ${e.key}`)
          
          setState(prev => ({ 
            ...prev,
            showSecurityAlert: true,
            securityAlertMessage: 'Copy-paste is disabled during the exam.'
          }))
        }
      }
    }

    const handleRightClick = (e: MouseEvent) => {
      if (state.session?.proctoring.rightClickDisabled && state.session?.isActive && !state.showInstructions) {
        e.preventDefault()
        logSecurityEvent('right_click', 'low', 'User attempted right-click')
        
        setState(prev => ({ 
          ...prev,
          showSecurityAlert: true,
          securityAlertMessage: 'Right-click is disabled during the exam.'
        }))
      }
    }

    const handleMouseMove = () => {
      setState(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }))
    }

    const handleFocusLoss = () => {
      if (state.session?.isActive && !state.showInstructions) {
        logSecurityEvent('focus_loss', 'medium', 'Window lost focus')
      }
    }

    // Disable text selection and drag
    const handleSelectStart = (e: Event) => {
      if (examRestrictions.preventTextSelection) {
        e.preventDefault()
      }
    }

    // Disable zoom
    const handleWheel = (e: WheelEvent) => {
      if (examRestrictions.disableZoom && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleRightClick)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('blur', handleFocusLoss)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleRightClick)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('wheel', handleWheel)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('blur', handleFocusLoss)
    }
  }, [state.session?.isActive, state.showInstructions])

  // Security monitoring
  useEffect(() => {
    if (!state.session?.isActive || state.showInstructions) return

    securityCheckRef.current = setInterval(() => {
      // Check if user has exceeded suspicious activity threshold
      if (state.suspiciousActivityCount >= examRestrictions.suspiciousActivityThreshold) {
        handleAutoSubmit('Excessive suspicious activity detected')
        return
      }

      // Check minimum focus time
      const focusPercentage = (state.focusTime / state.totalElapsedTime) * 100
      if (state.totalElapsedTime > 60 && focusPercentage < examRestrictions.minimumFocusTime) {
        logSecurityEvent('focus_loss', 'high', `Low focus time: ${focusPercentage.toFixed(1)}%`)
      }

      // Update focus time
      if (state.isWindowFocused) {
        setState(prev => ({ ...prev, focusTime: prev.focusTime + 5 }))
      }
    }, 5000) // Check every 5 seconds

    return () => {
      if (securityCheckRef.current) {
        clearInterval(securityCheckRef.current)
      }
    }
  }, [state.session?.isActive, state.showInstructions, state.suspiciousActivityCount, state.focusTime, state.totalElapsedTime, state.isWindowFocused])

  const logSecurityEvent = useCallback((type: SecurityEvent['type'], severity: SecurityEvent['severity'], description: string) => {
    const event: SecurityEvent = {
      type,
      severity,
      description,
      timestamp: Date.now()
    }

    setState(prev => ({
      ...prev,
      securityEvents: [...prev.securityEvents, event]
    }))

    console.warn('Security Event:', event)
  }, [])

  const handleTabSwitch = useCallback(() => {
    setState(prev => {
      const newTabSwitchCount = prev.tabSwitchCount + 1
      
      if (newTabSwitchCount >= examRestrictions.tabSwitchLimit) {
        setTimeout(() => {
          handleAutoSubmit(`Tab switch limit exceeded (${newTabSwitchCount}/${examRestrictions.tabSwitchLimit})`)
        }, 1000)
      } else {
        // Show warning for first tab switch
        setTimeout(() => {
          setState(p => ({
            ...p,
            showSecurityAlert: true,
            securityAlertMessage: `Warning: Tab switching detected (${newTabSwitchCount}/${examRestrictions.tabSwitchLimit}). Your exam will be auto-submitted if you continue.`
          }))
        }, 500)
      }
      
      return { ...prev, tabSwitchCount: newTabSwitchCount }
    })
  }, [])

  const handleFullscreenExit = useCallback(() => {
    if (examRestrictions.fullscreenRequired) {
      setState(prev => ({
        ...prev,
        showFinalWarning: true,
        autoSubmitReason: 'Exited fullscreen mode'
      }))

      // Give user grace period to return to fullscreen
      setTimeout(() => {
        if (!document.fullscreenElement) {
          handleAutoSubmit('Failed to return to fullscreen mode')
        }
      }, examRestrictions.warningGracePeriod * 1000)
    }
  }, [])

  const handleAutoSubmit = useCallback((reason: string) => {
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true,
      autoSubmitReason: reason
    }))
    
    logSecurityEvent('suspicious_key', 'critical', `Auto-submit triggered: ${reason}`)
    
    // Show final warning
    alert(`Exam is being auto-submitted due to: ${reason}`)
    
    // Submit the quiz
    setTimeout(() => {
      submitQuiz(true, reason)
    }, 2000)
  }, [])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setState(prev => ({ ...prev, isFullscreen: true, showInstructions: false }))
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      alert('Fullscreen mode is required for this exam. Please allow fullscreen access.')
    }
  }

  const startQuiz = () => {
    if (examRestrictions.fullscreenRequired) {
      enterFullscreen()
    } else {
      setState(prev => ({ ...prev, showInstructions: false }))
    }
  }

  const navigateToQuestion = (index: number) => {
    if (!state.quiz) return
    
    // Save time spent on current question
    const timeSpent = Date.now() - state.questionStartTime
    setState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      visitedQuestions: new Set([...prev.visitedQuestions, index.toString()]),
      questionTimeSpent: {
        ...prev.questionTimeSpent,
        [prev.quiz?.questions[prev.currentQuestionIndex]?.id || '']: timeSpent
      },
      questionStartTime: Date.now()
    }))
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }))
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

  const submitQuiz = (isAutoSubmit = false, reason?: string) => {
    if (!state.quiz || !state.attempt) return

    setState(prev => ({ ...prev, isSubmitting: true }))
    
    // Calculate results
    const results = calculateResults()
    
    // Create detailed submission data
    const submissionData = {
      attempt: state.attempt,
      answers: state.answers,
      results,
      isAutoSubmit,
      autoSubmitReason: reason,
      securityEvents: state.securityEvents,
      analytics: {
        totalTimeSpent: state.totalElapsedTime,
        focusTime: state.focusTime,
        focusPercentage: (state.focusTime / state.totalElapsedTime) * 100,
        tabSwitchCount: state.tabSwitchCount,
        suspiciousActivityCount: state.suspiciousActivityCount,
        mouseMovements: state.mouseMovements,
        keystrokes: state.keystrokes,
        questionTimeSpent: state.questionTimeSpent,
        idleTime: state.idleTimeCount
      }
    }
    
    console.log('Enhanced Quiz Submission:', submissionData)
    
    // Navigate to results page
    setTimeout(() => {
      navigate(`/quiz/${state.quiz?.id}/results`, { 
        state: { 
          results, 
          answers: state.answers, 
          attempt: state.attempt,
          securityEvents: state.securityEvents,
          analytics: submissionData.analytics
        }
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
    switch (status) {
      case 'answered': return 'bg-green-600 text-white'
      case 'marked': return 'bg-purple-600 text-white'
      case 'answered-marked': return 'bg-blue-600 text-white'
      case 'visited': return 'bg-red-600 text-white'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const dismissSecurityAlert = () => {
    setState(prev => ({ ...prev, showSecurityAlert: false, securityAlertMessage: '' }))
  }

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setState(prev => ({ 
        ...prev, 
        showFinalWarning: false, 
        autoSubmitReason: null,
        isFullscreen: true 
      }))
    } catch (error) {
      console.error('Failed to return to fullscreen:', error)
      handleAutoSubmit('Failed to return to fullscreen mode')
    }
  }

  if (!state.quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading secure exam environment...</p>
        </div>
      </div>
    )
  }

  // Enhanced instructions screen
  if (state.showInstructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-8">
          <div className="text-center mb-8">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
              <h1 className="text-2xl font-bold text-red-800 mb-2">🔒 SECURE EXAMINATION MODE</h1>
              <p className="text-red-700">This exam is monitored with advanced security measures</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{state.quiz.title}</h2>
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

          {/* Enhanced Security Warnings */}
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 mb-4 text-lg">🚨 STRICT SECURITY PROTOCOLS</h3>
            <div className="grid md:grid-cols-2 gap-4 text-red-700 text-sm">
              <div>
                <h4 className="font-semibold mb-2">PROHIBITED ACTIONS:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Tab switching (Max {examRestrictions.tabSwitchLimit} allowed)</li>
                  <li>Exiting fullscreen mode</li>
                  <li>Right-click or context menu</li>
                  <li>Copy, paste, or text selection</li>
                  <li>Developer tools or inspect element</li>
                  <li>Browser zoom or refresh</li>
                  <li>Idle time over {examRestrictions.maxIdleTime / 60} minutes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">CONSEQUENCES:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Security violations are logged</li>
                  <li>Suspicious activity triggers warnings</li>
                  <li>Exam auto-submits on rule violations</li>
                  <li>All activity is monitored and recorded</li>
                  <li>Focus time must be ≥{examRestrictions.minimumFocusTime}%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Regular Instructions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Exam Instructions</h3>
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

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startQuiz}
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              🚀 BEGIN SECURE EXAM
              {examRestrictions.fullscreenRequired && ' (FULLSCREEN REQUIRED)'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              By clicking this button, you agree to the security monitoring and exam rules
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = state.quiz.questions[state.currentQuestionIndex]
  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      {/* Enhanced Header with Security Status */}
      <header className="bg-white shadow-sm border-b-2 border-red-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{state.quiz.title}</h1>
            <p className="text-sm text-gray-600">Question {state.currentQuestionIndex + 1} of {state.quiz.totalQuestions}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Security Status Indicators */}
            <div className="flex items-center space-x-2">
              {/* Fullscreen Status */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                state.isFullscreen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {state.isFullscreen ? '🔒 Secure' : '⚠️ Insecure'}
              </div>
              
              {/* Focus Status */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                state.isWindowFocused ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {state.isWindowFocused ? '👁️ Focused' : '⚠️ Unfocused'}
              </div>
            </div>
            
            {/* Tab Switch Warning */}
            {state.tabSwitchCount > 0 && (
              <div className="text-red-600 text-sm font-bold bg-red-100 px-3 py-1 rounded-full">
                🚨 {state.tabSwitchCount}/{examRestrictions.tabSwitchLimit} violations
              </div>
            )}
            
            {/* Timer */}
            <div className={`text-lg font-mono font-bold px-3 py-1 rounded-lg ${
              state.timeRemaining <= examRestrictions.criticalTimeWarningAt 
                ? 'text-red-700 bg-red-100 animate-pulse' 
                : state.timeRemaining <= examRestrictions.timeWarningAt
                ? 'text-yellow-700 bg-yellow-100'
                : 'text-gray-900 bg-gray-100'
            }`}>
              ⏰ {formatTime(state.timeRemaining)}
            </div>
          </div>
        </div>
        
        {/* Security Event Bar */}
        {state.securityEvents.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-700 font-medium">
              Security Events: {state.securityEvents.length} | 
              Suspicious Activity: {state.suspiciousActivityCount}/{examRestrictions.suspiciousActivityThreshold}
            </span>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-indigo-500">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Question {state.currentQuestionIndex + 1} 
                <span className="text-sm text-gray-500 ml-2">({currentQuestion.marks} marks)</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">{currentQuestion.question}</p>
            </div>

            {/* Question Image/Diagram */}
            {currentQuestion.image && (
              <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 border-2 border-dashed border-gray-300">
                  📊 {currentQuestion.type === 'multiple-choice' ? 'Diagram' : 'Image'} Content
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name={`question_${currentQuestion.id}`}
                    value={option}
                    checked={state.answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="mr-4 w-4 h-4"
                  />
                  <span className="font-bold text-gray-700 mr-3 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-700 flex-1">{option}</span>
                </label>
              ))}

              {currentQuestion.type === 'numerical' && (
                <div>
                  <input
                    type="number"
                    value={state.answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, parseFloat(e.target.value))}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    placeholder="Enter your numerical answer"
                  />
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option, index) => (
                    <label key={option} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        value={option}
                        checked={state.answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="mr-4 w-4 h-4"
                      />
                      <span className="font-bold text-gray-700 mr-3 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                        {option === 'True' ? 'T' : 'F'}
                      </span>
                      <span className="text-gray-700 flex-1">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateToQuestion(Math.max(0, state.currentQuestionIndex - 1))}
              disabled={state.currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              ← Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  state.markedForReview.has(currentQuestion.id)
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                🚩 {state.markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>
              
              {state.currentQuestionIndex === state.quiz.questions.length - 1 ? (
                <button
                  onClick={() => submitQuiz()}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg"
                >
                  ✅ SUBMIT EXAM
                </button>
              ) : (
                <button
                  onClick={() => navigateToQuestion(state.currentQuestionIndex + 1)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Question Palette Sidebar */}
        <div className="w-80 bg-white border-l-2 border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">📋 Question Palette</h3>
          
          {/* Legend */}
          <div className="mb-6 text-xs bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                  <span>Answered</span>
                </div>
                <span className="font-medium">{Object.keys(state.answers).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                  <span>Marked</span>
                </div>
                <span className="font-medium">{state.markedForReview.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-600 rounded mr-2"></div>
                  <span>Not Answered</span>
                </div>
                <span className="font-medium">{state.quiz.questions.length - Object.keys(state.answers).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                  <span>Not Visited</span>
                </div>
                <span className="font-medium">{state.quiz.questions.length - state.visitedQuestions.size}</span>
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
                  className={`w-12 h-12 rounded-lg text-sm font-bold ${getStatusColor(status)} ${
                    index === state.currentQuestionIndex ? 'ring-4 ring-indigo-300 scale-110' : 'hover:scale-105'
                  } transition-all duration-200`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          {/* Progress Stats */}
          <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between">
              <span>Progress:</span>
              <span className="font-bold text-indigo-600">
                {Math.round((Object.keys(state.answers).length / state.quiz.questions.length) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time Used:</span>
              <span className="font-bold text-gray-700">
                {Math.round(((state.quiz.duration * 60 - state.timeRemaining) / (state.quiz.duration * 60)) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Focus:</span>
              <span className={`font-bold ${
                state.totalElapsedTime > 0 && (state.focusTime / state.totalElapsedTime) * 100 >= examRestrictions.minimumFocusTime
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {state.totalElapsedTime > 0 ? Math.round((state.focusTime / state.totalElapsedTime) * 100) : 100}%
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => submitQuiz()}
            disabled={state.isSubmitting}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {state.isSubmitting ? '⏳ Submitting...' : '🚀 SUBMIT EXAM'}
          </button>
        </div>
      </div>

      {/* Security Alert Modal */}
      {state.showSecurityAlert && (
        <div className="fixed inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 border-4 border-red-500">
            <h3 className="text-xl font-bold text-red-800 mb-4">🚨 Security Violation</h3>
            <p className="text-gray-700 mb-6">{state.securityAlertMessage}</p>
            <button
              onClick={dismissSecurityAlert}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-bold"
            >
              I UNDERSTAND - CONTINUE EXAM
            </button>
          </div>
        </div>
      )}

      {/* Critical Time Warning */}
      {state.showCriticalWarning && (
        <div className="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 border-4 border-red-600 animate-pulse">
            <h3 className="text-2xl font-bold text-red-800 mb-4">⏰ CRITICAL TIME WARNING</h3>
            <p className="text-red-700 mb-6 text-lg">
              Only <strong>{Math.floor(state.timeRemaining / 60)} minute(s) {state.timeRemaining % 60} seconds</strong> remaining!
            </p>
            <p className="text-gray-600 mb-6">
              Your exam will auto-submit when time expires. Please complete your answers quickly.
            </p>
            <button
              onClick={() => setState(prev => ({ ...prev, showCriticalWarning: false }))}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-bold"
            >
              CONTINUE EXAM
            </button>
          </div>
        </div>
      )}

      {/* Final Warning Modal */}
      {state.showFinalWarning && (
        <div className="fixed inset-0 bg-red-900 bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg mx-4 border-4 border-red-600">
            <h3 className="text-2xl font-bold text-red-800 mb-4">🚨 FINAL WARNING</h3>
            <p className="text-red-700 mb-4 text-lg">
              Security violation detected: <strong>{state.autoSubmitReason}</strong>
            </p>
            <p className="text-gray-700 mb-6">
              You have <strong>{examRestrictions.warningGracePeriod} seconds</strong> to return to fullscreen mode 
              or your exam will be automatically submitted.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={returnToFullscreen}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold"
              >
                RETURN TO FULLSCREEN
              </button>
              <button
                onClick={() => handleAutoSubmit(state.autoSubmitReason || 'Security violation')}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-bold"
              >
                SUBMIT NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Time Warning */}
      {state.showWarning && !state.showCriticalWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 border-2 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⏰ Time Warning</h3>
            <p className="text-gray-700 mb-4">
              {Math.floor(state.timeRemaining / 60)} minutes remaining! Please review your answers.
            </p>
            <button
              onClick={() => setState(prev => ({ ...prev, showWarning: false }))}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium"
            >
              Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Submitting Modal */}
      {state.isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {state.autoSubmitReason ? '🚨 Auto-Submitting Exam...' : '📤 Submitting Exam...'}
            </h3>
            {state.autoSubmitReason && (
              <p className="text-red-600 mb-4 font-medium">
                Reason: {state.autoSubmitReason}
              </p>
            )}
            <p className="text-gray-600 mb-4">
              Please wait while we securely process your answers and generate your results.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Calculating scores...</p>
              <p>• Analyzing security events...</p>
              <p>• Generating detailed report...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizExamSecure
