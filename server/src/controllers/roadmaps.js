const { Roadmap } = require('../models/Roadmap');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get user's roadmap
// @route   GET /api/roadmaps
// @access  Private
const getRoadmap = async (req, res) => {
  const roadmap = await Roadmap.findOne({ userId: req.user._id });

  if (!roadmap) {
    throw new AppError('Roadmap not found', 404);
  }

  res.json({
    success: true,
    data: roadmap
  });
};

// @desc    Create or update roadmap
// @route   POST /api/roadmaps
// @access  Private
const createOrUpdateRoadmap = async (req, res) => {
  let roadmap = await Roadmap.findOne({ userId: req.user._id });

  if (roadmap) {
    // Update existing roadmap
    roadmap = await Roadmap.findByIdAndUpdate(
      roadmap._id,
      req.body,
      { new: true, runValidators: true }
    );
  } else {
    // Create new roadmap
    roadmap = await Roadmap.create({
      ...req.body,
      userId: req.user._id
    });
  }

  res.json({
    success: true,
    data: roadmap
  });
};

// @desc    Update milestone progress
// @route   PATCH /api/roadmaps/milestones/:mileId
// @access  Private
const updateMilestoneProgress = async (req, res) => {
  const roadmap = await Roadmap.findOne({ userId: req.user._id });

  if (!roadmap) {
    throw new AppError('Roadmap not found', 404);
  }

  const { increment = 1 } = req.body;

  try {
    await roadmap.updateProgress(req.params.mileId, increment);
    res.json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
};

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps
// @access  Private
const deleteRoadmap = async (req, res) => {
  const roadmap = await Roadmap.findOne({ userId: req.user._id });

  if (!roadmap) {
    throw new AppError('Roadmap not found', 404);
  }

  await Roadmap.findByIdAndDelete(roadmap._id);

  res.json({
    success: true,
    message: 'Roadmap deleted successfully'
  });
};

// @desc    Get roadmap stats
// @route   GET /api/roadmaps/stats
// @access  Private
const getRoadmapStats = async (req, res) => {
  const roadmap = await Roadmap.findOne({ userId: req.user._id });

  if (!roadmap) {
    throw new AppError('Roadmap not found', 404);
  }

  const stats = {
    totalMilestones: roadmap.milestones.length,
    completedMilestones: roadmap.milestones.filter(m => m.finished >= m.subLessons).length,
    totalSubLessons: roadmap.milestones.reduce((sum, m) => sum + m.subLessons, 0),
    completedSubLessons: roadmap.milestones.reduce((sum, m) => sum + m.finished, 0),
    completionPercentage: roadmap.completionPercentage,
    currentMilestone: roadmap.currentMilestone
  };

  res.json({
    success: true,
    data: stats
  });
};

module.exports = {
  getRoadmap,
  createOrUpdateRoadmap,
  updateMilestoneProgress,
  deleteRoadmap,
  getRoadmapStats
};
