const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  submitQuiz
} = require('../controllers/quiz');

const router = express.Router();

// Quiz routes
router.route('/')
  .get(optionalAuth, getQuizzes)
  .post(protect, createQuiz);

router.route('/:id')
  .get(optionalAuth, getQuiz)
  .put(protect, updateQuiz)
  .delete(protect, deleteQuiz);

// Quiz taking routes
router.get('/:id/questions', protect, getQuizQuestions);
router.post('/:id/submit', protect, submitQuiz);

module.exports = router;
