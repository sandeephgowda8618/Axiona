import { Router } from 'express'
import { Quiz, User } from '../models'
import { protect, optionalAuth } from '../middleware/auth'

const router = Router()

// Get all quizzes with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    
    const {
      subject,
      category,
      difficulty,
      search,
      tags,
      isActive = 'true'
    } = req.query

    // Build filter object
    const filter: any = { isActive: isActive === 'true' }
    
    if (subject) filter.subject = { $regex: subject, $options: 'i' }
    if (category) filter.category = { $regex: category, $options: 'i' }
    if (difficulty) filter.difficulty = difficulty
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags]
      filter.tags = { $in: tagArray }
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }

    // Add scheduled quiz filter (only show quizzes that are available now)
    const now = new Date()
    filter.$or = [
      { scheduledStart: { $exists: false } },
      { scheduledStart: { $lte: now } }
    ]

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'fullName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Quiz.countDocuments(filter)
    const pages = Math.ceil(total / limit)

    return res.json({
      success: true,
      data: quizzes,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return res.status(500).json({ error: 'Failed to fetch quizzes' })
  }
})

// Get quiz by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'fullName email avatarUrl')

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    if (!quiz.isActive) {
      return res.status(403).json({ error: 'Quiz is not available' })
    }

    // Check if quiz is scheduled and available
    const now = new Date()
    if (quiz.scheduledStart && quiz.scheduledStart > now) {
      return res.status(403).json({ 
        error: 'Quiz is not yet available',
        availableAt: quiz.scheduledStart 
      })
    }

    if (quiz.scheduledEnd && quiz.scheduledEnd < now) {
      return res.status(403).json({ 
        error: 'Quiz has ended',
        endedAt: quiz.scheduledEnd 
      })
    }

    return res.json({
      success: true,
      data: quiz
    })
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return res.status(500).json({ error: 'Failed to fetch quiz' })
  }
})

// Create new quiz
router.post('/', protect, async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdBy: req.user!._id
    }

    const quiz = await Quiz.create(quizData)
    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('createdBy', 'fullName email avatarUrl')

    return res.status(201).json({
      success: true,
      data: populatedQuiz
    })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return res.status(500).json({ error: 'Failed to create quiz' })
  }
})

// Update quiz
router.put('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this quiz' })
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email avatarUrl')

    return res.json({
      success: true,
      data: updatedQuiz
    })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return res.status(500).json({ error: 'Failed to update quiz' })
  }
})

// Delete quiz
router.delete('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' })
    }

    await Quiz.findByIdAndDelete(req.params.id)

    return res.json({
      success: true,
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return res.status(500).json({ error: 'Failed to delete quiz' })
  }
})

// Get quiz questions (for taking the quiz)
router.get('/:id/questions', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    if (!quiz.isActive) {
      return res.status(403).json({ error: 'Quiz is not available' })
    }

    // Check scheduling
    const now = new Date()
    if (quiz.scheduledStart && quiz.scheduledStart > now) {
      return res.status(403).json({ 
        error: 'Quiz is not yet available',
        availableAt: quiz.scheduledStart 
      })
    }

    if (quiz.scheduledEnd && quiz.scheduledEnd < now) {
      return res.status(403).json({ 
        error: 'Quiz has ended',
        endedAt: quiz.scheduledEnd 
      })
    }

    // Return questions without correct answers for security
    const questions = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      marks: q.marks,
      timeLimit: q.timeLimit,
      difficulty: q.difficulty,
      topics: q.topics
    }))

    return res.json({
      success: true,
      data: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration,
        totalQuestions: quiz.totalQuestions,
        maxMarks: quiz.maxMarks,
        passingMarks: quiz.passingMarks,
        instructions: quiz.instructions,
        isTimeLimited: quiz.isTimeLimited,
        allowReview: quiz.allowReview,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
        questions: quiz.shuffleQuestions ? questions.sort(() => Math.random() - 0.5) : questions
      }
    })
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return res.status(500).json({ error: 'Failed to fetch quiz questions' })
  }
})

// Submit quiz answers
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body
    
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    // Calculate score
    let score = 0
    let correctAnswers = 0
    
    const results = quiz.questions.map(question => {
      const userAnswer = answers[question.id]
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
      
      if (isCorrect) {
        score += question.marks
        correctAnswers++
      }
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        marks: isCorrect ? question.marks : 0,
        explanation: quiz.showResults ? question.explanation : undefined
      }
    })

    const percentage = (score / quiz.maxMarks) * 100
    const passed = score >= quiz.passingMarks

    const result = {
      quizId: quiz._id,
      userId: req.user!._id,
      score,
      maxMarks: quiz.maxMarks,
      percentage: Math.round(percentage * 100) / 100,
      correctAnswers,
      totalQuestions: quiz.totalQuestions,
      passed,
      timeSpent,
      submittedAt: new Date(),
      results: quiz.showResults ? results : undefined
    }

    // TODO: Save quiz attempt to database (create QuizAttempt model)
    
    return res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return res.status(500).json({ error: 'Failed to submit quiz' })
  }
})

// Get quiz categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Quiz.distinct('category', { isActive: true })
    return res.json({
      success: true,
      data: categories.sort()
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get quiz subjects
router.get('/meta/subjects', async (req, res) => {
  try {
    const subjects = await Quiz.distinct('subject', { isActive: true })
    return res.json({
      success: true,
      data: subjects.sort()
    })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return res.status(500).json({ error: 'Failed to fetch subjects' })
  }
})

// Get quiz tags
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await Quiz.distinct('tags', { isActive: true })
    return res.json({
      success: true,
      data: tags.sort()
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

export default router
