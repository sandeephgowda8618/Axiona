const { Router } = require('express');
const mainRoutes = require('./main');
const studypesRoutes = require('./studypesRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const videosRoutes = require('./videos');

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
      videoActions: '/api/videos/:id/(like|save|download|watch)',
      userVideos: '/api/videos/(history|saved|liked|downloaded)',
      quizzes: '/api/quizzes',
      studyMaterials: '/api/study-materials',
      studypesMaterials: '/api/studypes',
      pipelineMaterials: '/api/pipeline/studypes',
      pipelineBooks: '/api/pipeline/books',
      pipelineFiles: '/api/pipeline/files',
      pipelineRoadmaps: '/api/pipeline/roadmap',
      roadmaps: '/api/roadmaps',
      topics: '/api/topics',
      rooms: '/api/rooms',
      ai: '/api/ai',
      users: '/api/users',
      notes: '/api/notes',
      meetings: '/api/meetings',
      books: '/api/books',
      files: '/api/files'
    }
  });
});

// Use StudyPES routes
router.use('/studypes', studypesRoutes);

// Use Pipeline routes
router.use('/pipeline', pipelineRoutes);

// Use video interaction routes (put before main routes to avoid conflicts)
router.use('/videos', videosRoutes);

// Use the main routes which include all endpoints
router.use('/', mainRoutes);

module.exports = router;
