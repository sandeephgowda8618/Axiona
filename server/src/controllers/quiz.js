const { Quiz } = require('../models/Quiz');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public (with optional auth)
const getQuizzes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search;
  const subject = req.query.subject;
  const difficulty = req.query.difficulty;
  const category = req.query.category;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder || 'desc';

  // Build query
  let query = { isActive: true };

  // Text search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Filters
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;

  // Build sort object
  let sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  // Execute query
  const quizzes = await Quiz.find(query)
    .select('-questions') // Don't send questions in list view
    .populate('createdBy', 'fullName avatarUrl')
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count for pagination
  const total = await Quiz.countDocuments(query);

  res.json({
    success: true,
    data: quizzes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public
const getQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('createdBy', 'fullName avatarUrl');

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // If not authenticated or not the creator, hide correct answers
  if (!req.user || req.user._id.toString() !== quiz.createdBy._id.toString()) {
    quiz.questions = quiz.questions.map(question => ({
      ...question.toObject(),
      correctAnswer: undefined,
      explanation: undefined
    }));
  }

  res.json({
    success: true,
    data: quiz
  });
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private
const createQuiz = async (req, res) => {
  const quiz = await Quiz.create({
    ...req.body,
    createdBy: req.user._id
  });

  await quiz.populate('createdBy', 'fullName avatarUrl');

  res.status(201).json({
    success: true,
    data: quiz
  });
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private
const updateQuiz = async (req, res) => {
  let quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // Check if user is the creator
  if (quiz.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this quiz', 403);
  }

  quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'fullName avatarUrl');

  res.json({
    success: true,
    data: quiz
  });
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
const deleteQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // Check if user is the creator
  if (quiz.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this quiz', 403);
  }

  await Quiz.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Quiz deleted successfully'
  });
};

// @desc    Get quiz questions (for taking quiz)
// @route   GET /api/quizzes/:id/questions
// @access  Private
const getQuizQuestions = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // Return questions without correct answers
  const questions = quiz.questions.map(question => ({
    id: question.id,
    question: question.question,
    type: question.type,
    options: question.options,
    marks: question.marks,
    timeLimit: question.timeLimit,
    difficulty: question.difficulty,
    topics: question.topics
  }));

  res.json({
    success: true,
    data: {
      quiz: {
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration,
        totalQuestions: quiz.totalQuestions,
        maxMarks: quiz.maxMarks,
        instructions: quiz.instructions,
        proctoring: quiz.proctoring
      },
      questions
    }
  });
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
const submitQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const { answers, startTime, endTime } = req.body;

  // Calculate score
  let score = 0;
  let totalMarks = 0;
  const results = [];

  quiz.questions.forEach(question => {
    totalMarks += question.marks;
    const userAnswer = answers.find(a => a.questionId === question.id);
    
    if (userAnswer) {
      let isCorrect = false;
      
      // Check answer based on question type
      if (question.type === 'multiple-choice') {
        isCorrect = Array.isArray(question.correctAnswer) && 
                   Array.isArray(userAnswer.answer) &&
                   question.correctAnswer.sort().join(',') === userAnswer.answer.sort().join(',');
      } else {
        isCorrect = question.correctAnswer.toString() === userAnswer.answer.toString();
      }
      
      if (isCorrect) {
        score += question.marks;
      }
      
      results.push({
        questionId: question.id,
        userAnswer: userAnswer.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        marks: isCorrect ? question.marks : 0,
        explanation: question.explanation
      });
    }
  });

  const percentage = Math.round((score / totalMarks) * 100);
  const passed = score >= quiz.passingMarks;

  // TODO: Save attempt to database

  res.json({
    success: true,
    data: {
      score,
      totalMarks,
      percentage,
      passed,
      timeTaken: endTime - startTime,
      results: quiz.showResults ? results : undefined
    }
  });
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  submitQuiz
};
