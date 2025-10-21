import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Quiz } from '../types/quiz'
import { quizzesAPI } from '../api/studyAI'

const QuizSelection: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All Topics')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All Levels')
  const [selectedStatus, setSelectedStatus] = useState<string>('All Quizzes')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()

  // Load quizzes and metadata from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [quizzesResponse, categoriesResponse, subjectsResponse] = await Promise.all([
          quizzesAPI.getAllQuizzes(1, 100), // Load first 100 quizzes
          quizzesAPI.getQuizCategories(),
          quizzesAPI.getQuizSubjects()
        ])

        // Transform backend data to frontend format
        const transformedQuizzes: Quiz[] = quizzesResponse.data.map((quiz: any) => ({
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          category: quiz.category,
          difficulty: quiz.difficulty,
          totalQuestions: quiz.totalQuestions,
          maxMarks: quiz.maxMarks,
          duration: quiz.duration,
          passingMarks: quiz.passingMarks,
          instructions: quiz.instructions,
          questions: quiz.questions || [],
          isTimeLimited: quiz.isTimeLimited,
          allowReview: quiz.allowReview,
          shuffleQuestions: quiz.shuffleQuestions,
          shuffleOptions: quiz.shuffleOptions,
          showResults: quiz.showResults,
          retakeAllowed: quiz.retakeAllowed,
          maxAttempts: quiz.maxAttempts,
          createdBy: quiz.createdBy?.fullName || 'Unknown',
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
          tags: quiz.tags || [],
          prerequisites: quiz.prerequisites || []
        }))

        setQuizzes(transformedQuizzes)
        setFilteredQuizzes(transformedQuizzes)
        setCategories(categoriesResponse.data)
        setSubjects(subjectsResponse.data)
      } catch (error) {
        console.error('Failed to load quizzes:', error)
        setError('Failed to load quizzes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter quizzes based on selected filters
  useEffect(() => {
    let filtered = [...quizzes]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(query) ||
        quiz.description.toLowerCase().includes(query) ||
        quiz.subject.toLowerCase().includes(query) ||
        quiz.category.toLowerCase().includes(query) ||
        quiz.tags.some(tag => tag.toLowerCase().includes(query))
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

    // Apply status filter (TODO: implement with user attempt history)
    if (selectedStatus !== 'All Quizzes') {
      // For now, show all quizzes regardless of status
      // In the future, this would filter based on user's attempt history
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
    // Simple mapping for category icons
    const categoryIcons: { [key: string]: string } = {
      'Operating Systems': '🖥️',
      'Database Systems': '💾',
      'Computer Science': '💻',
      'Data Structures': '🔗',
      'Algorithms': '⚡',
      'Machine Learning': '🤖',
      'Web Development': '🌐',
      'Software Engineering': '🛠️'
    }
    return categoryIcons[category] || '📝'
  }

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Header */}
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/tutorial-hub" className="text-gray-600 hover:text-gray-900">Tutorial Hub</Link>
              <Link to="/study-pes" className="text-gray-600 hover:text-gray-900">StudyPES</Link>
              <Link to="/conference" className="text-gray-600 hover:text-gray-900">Conference</Link>
              <Link to="/library" className="text-gray-600 hover:text-gray-900">Library</Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600">👤</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quizzes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Selection</h1>
          <p className="text-gray-600">Choose from our collection of practice quizzes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-1">
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Topic Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All Topics">All Topics</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All Levels">All Levels</option>
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All Quizzes">All Quizzes</option>
                <option value="Not Attempted">Not Attempted</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredQuizzes.length} of {quizzes.length} quizzes
          </div>
        </div>

        {/* Quiz Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map(quiz => {
              // Mock previous attempt data
              const hasAttempted = Math.random() > 0.6
              const previousScore = hasAttempted ? Math.floor(Math.random() * 40) + 60 : null
              const isCompleted = hasAttempted && Math.random() > 0.3

              return (
                <div key={quiz.id} className="quiz-card">
                  {/* Quiz Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCategoryIcon(quiz.category)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {quiz.title}
                          </h3>
                          <p className="text-sm text-gray-600">{quiz.subject}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>

                    {/* Quiz Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Questions:</span>
                        <span className="font-medium ml-1">{quiz.totalQuestions}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Marks:</span>
                        <span className="font-medium ml-1">{quiz.maxMarks}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium ml-1">{quiz.duration} min</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Passing:</span>
                        <span className="font-medium ml-1">{quiz.passingMarks}</span>
                      </div>
                    </div>

                    {/* Previous Score */}
                    {hasAttempted && previousScore && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-800">Previous Score:</span>
                          <span className="font-semibold text-blue-900">
                            {previousScore}/{quiz.maxMarks} ({Math.round((previousScore/quiz.maxMarks) * 100)}%)
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {previousScore >= quiz.passingMarks ? '✅ Passed' : '❌ Failed'}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {quiz.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {quiz.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{quiz.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {!hasAttempted || !isCompleted ? (
                        <button
                          onClick={() => handleStartQuiz(quiz.id, false)}
                          className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-900 transition-colors"
                        >
                          {hasAttempted ? 'Continue' : 'Start Now'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetakeQuiz(quiz.id, false)}
                          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Retake Quiz
                        </button>
                      )}
                    </div>

                    {/* Details Link */}
                    <div className="mt-3">
                      <Link
                        to={`/quiz/${quiz.id}/details`}
                        className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

export default QuizSelection
