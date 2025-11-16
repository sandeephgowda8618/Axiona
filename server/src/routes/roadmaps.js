const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getRoadmap,
  generateRoadmap,
  getInterviewQuestions,
  createOrUpdateRoadmap,
  updateMilestoneProgress,
  deleteRoadmap,
  getRoadmapStats
} = require('../controllers/roadmaps');

const router = express.Router();

// Interview questions for roadmap generation
router.get('/questions', protect, getInterviewQuestions);

// Generate new roadmap using pipeline
router.post('/generate', protect, generateRoadmap);

// Roadmap routes
router.route('/')
  .get(protect, getRoadmap)
  .post(protect, createOrUpdateRoadmap)
  .delete(protect, deleteRoadmap);

// Roadmap stats
router.get('/stats', protect, getRoadmapStats);

// Milestone progress
router.patch('/milestones/:mileId', protect, updateMilestoneProgress);

module.exports = router;
