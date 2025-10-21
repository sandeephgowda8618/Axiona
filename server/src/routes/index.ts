import { Router } from 'express'
import authRoutes from './auth'
import userRoutes from './users'
import videoRoutes from './videos'
import pdfRoutes from './pdfs'
import roadmapRoutes from './roadmaps'
import topicRoutes from './topics'
import studySessionRoutes from './studySessions'
import dailyPlanRoutes from './dailyPlans'
import quizRoutes from './quizzes'
import studyMaterialRoutes from './studyMaterials'

const router = Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Study-AI API is running',
    timestamp: new Date().toISOString()
  })
})

// API routes
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/videos', videoRoutes)
router.use('/pdfs', pdfRoutes)
router.use('/roadmaps', roadmapRoutes)
router.use('/topics', topicRoutes)
router.use('/study-sessions', studySessionRoutes)
router.use('/daily-plans', dailyPlanRoutes)
router.use('/quizzes', quizRoutes)
router.use('/study-materials', studyMaterialRoutes)

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Study-AI API',
    version: '1.0.0',
    description: 'Backend API for Study-AI platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      videos: '/api/videos',
      pdfs: '/api/pdfs',
      roadmaps: '/api/roadmaps',
      topics: '/api/topics',
      studySessions: '/api/study-sessions',
      dailyPlans: '/api/daily-plans',
      quizzes: '/api/quizzes',
      studyMaterials: '/api/study-materials'
    }
  })
})

export default router