const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getRoadmap,
  createOrUpdateRoadmap,
  updateMilestoneProgress,
  deleteRoadmap,
  getRoadmapStats
} = require('../controllers/roadmaps');

const router = express.Router();

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
