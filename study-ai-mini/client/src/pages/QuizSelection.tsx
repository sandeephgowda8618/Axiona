import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Quiz } from '../types/quiz'
import { mockQuizzes } from '../data/mockQuizzes'
import { quizCategories, difficultyLevels } from '../types/quiz'
import { quizzesAPI } from '../api/endpoints'

const QuizSelection: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes)
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>(mockQuizzes)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Topics')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All Levels')
  const [selectedStatus, setSelectedStatus] = useState<string>('All Quizzes')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  // Fetch quizzes dynamically with fallback to mocks
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setIsLoading(true)
        const data = await quizzesAPI.getQuizzes()
        if (!mounted) return
        // Accept either {items: Quiz[]} or direct array
        const items = Array.isArray(data) ? data : (data?.items ?? [])
        if (items && items.length) {
          setQuizzes(items)
          setFilteredQuizzes(items)
        }
      } catch (e) {
        // fallback already set to mocks
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Filter quizzes based on selected filters
  useEffect(() => {
    let filtered = [...quizzes]

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(qz =>
        qz.title.toLowerCase().includes(q) ||
        qz.description.toLowerCase().includes(q) ||
        qz.subject.toLowerCase().includes(q) ||
        qz.category.toLowerCase().includes(q) ||
        (qz.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'All Topics') {
      filtered = filtered.filter(quiz => quiz.category === selectedCategory)
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'All Levels') {
      filtered = filtered.filter(quiz => quiz.difficulty === selectedDifficulty)
    }

    // Apply status filter (mock implementation)
    if (selectedStatus !== 'All Quizzes') {
      // In a real app, this would filter based on user's attempt history
      if (selectedStatus === 'Completed') {
        filtered = filtered.filter(quiz => Math.random() > 0.7) // Mock completed quizzes
      } else if (selectedStatus === 'In Progress') {
        filtered = filtered.filter(quiz => Math.random() > 0.8) // Mock in-progress quizzes
      }
    }

    setFilteredQuizzes(filtered)
  }, [quizzes, searchQuery, selectedCategory, selectedDifficulty, selectedStatus])

  const handleStartQuiz = (quizId: string, isSecure = false) => {
    // Navigate to secure exam for proctored quizzes
    if (isSecure) {
      navigate(`/quiz/${quizId}/secure`)
    } else {
      navigate(`/quiz/${quizId}`)
    }
  }

  const handleRetakeQuiz = (quizId: string, isSecure = false) => {
    // Navigate to secure exam for retake
    if (isSecure) {
      navigate(`/quiz/${quizId}/secure`)
    } else {
      navigate(`/quiz/${quizId}`)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50'
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'Advanced': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = quizCategories.find(c => c.name === category)
    return cat?.icon || '📝'
  }

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white font-bold">🧑‍🎓</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Study-AI Mini</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-xl"><i className="fas fa-bell"></i></span>
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><i className="fas fa-user"></i></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Selection</h1>
          <p className="text-gray-600">Choose from our collection of practice quizzes</p>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Topics">All Topics</option>
                {quizCategories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Levels">All Levels</option>
                {difficultyLevels.map(level => (
                  <option key={level.id} value={level.name}>{level.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Quizzes">All Quizzes</option>
                <option value="Not Attempted">Not Attempted</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </section>

        {/* Quiz Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredQuizzes.map(quiz => {
              // Mock previous attempt data
              const hasAttempted = Math.random() > 0.6
              const previousScore = hasAttempted ? Math.floor(Math.random() * 40) + 60 : null
              const isCompleted = hasAttempted && Math.random() > 0.3

              return (
                <div key={quiz.id} className="bg-white rounded-2xl shadow card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">{quiz.category}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficulty)}`}>{quiz.difficulty}</span>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{quiz.title}</h2>
                    <div className="text-xs text-gray-500 mb-2">{quiz.subject}</div>
                    <div className="text-sm text-gray-600 mb-4">{quiz.description}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div><span className="text-gray-500">Questions:</span> <span className="font-semibold">{quiz.totalQuestions}</span></div>
                      <div><span className="text-gray-500">Max Marks:</span> <span className="font-semibold">{quiz.maxMarks}</span></div>
                      <div><span className="text-gray-500">Duration:</span> <span className="font-semibold">{quiz.duration} min</span></div>
                    </div>
                    {hasAttempted && previousScore && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-800">Previous Score:</span>
                          <span className="font-semibold text-blue-900">{previousScore}/{quiz.maxMarks}</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">{previousScore >= quiz.passingMarks ? '✅ Passed' : '❌ Failed'}</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quiz.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                      ))}
                      {quiz.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">+{quiz.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    {!hasAttempted || !isCompleted ? (
                      <button
                        onClick={() => handleStartQuiz(quiz.id, false)}
                        className="w-full bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                      >
                        {hasAttempted ? 'Continue' : 'Start Now'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRetakeQuiz(quiz.id, false)}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default QuizSelection
