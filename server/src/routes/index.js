const { Router } = require('express');
const mainRoutes = require('./main');

const router = Router();

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Study-AI API',
    version: '1.0.0',
    description: 'Backend API for Study-AI platform (MongoDB)',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      videos: '/api/videos',
      quizzes: '/api/quizzes',
      studyMaterials: '/api/study-materials',
      roadmaps: '/api/roadmaps',
      topics: '/api/topics',
      rooms: '/api/rooms',
      ai: '/api/ai',
      users: '/api/users',
      notes: '/api/notes',
      meetings: '/api/meetings',
      books: '/api/books'
    }
  });
});

// Use the main routes which include all endpoints
router.use('/', mainRoutes);

module.exports = router;
