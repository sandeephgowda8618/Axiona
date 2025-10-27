const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getDailyPlans,
  getDailyPlan,
  createDailyPlan,
  updateDailyPlan,
  deleteDailyPlan,
  toggleTask,
  addTask,
  removeTask
} = require('../controllers/dailyPlans');

const router = express.Router();

// Daily plan routes
router.route('/')
  .get(protect, getDailyPlans)
  .post(protect, createDailyPlan);

router.route('/:id')
  .put(protect, updateDailyPlan)
  .delete(protect, deleteDailyPlan);

// Get plan by date
router.get('/date/:date', protect, getDailyPlan);

// Task management
router.patch('/:id/tasks/:taskId', protect, toggleTask);
router.post('/:id/tasks', protect, addTask);
router.delete('/:id/tasks/:taskId', protect, removeTask);

module.exports = router;
