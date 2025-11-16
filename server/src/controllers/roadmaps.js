const { Roadmap } = require('../models/Roadmap');
const { AppError } = require('../middleware/errorHandler');
const pipelineService = require('../services/pipelineService');

// @desc    Get user's roadmap (check pipeline first, fallback to old system)
// @route   GET /api/roadmaps
// @access  Private
const getRoadmap = async (req, res) => {
  try {
    // First, try to get roadmap from pipeline
    const pipelineRoadmap = await pipelineService.getUserRoadmap(req.user._id.toString());
    
    if (pipelineRoadmap) {
      return res.json({
        success: true,
        data: pipelineRoadmap,
        source: 'pipeline'
      });
    }
    
    // Fallback to old system
    const roadmap = await Roadmap.findOne({ userId: req.user._id });

    if (!roadmap) {
      return res.json({
        success: false,
        message: 'No roadmap found. Please generate a roadmap first.',
        needsGeneration: true
      });
    }

    res.json({
      success: true,
      data: roadmap,
      source: 'legacy'
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    throw new AppError('Failed to fetch roadmap', 500);
  }
};

// @desc    Generate roadmap using pipeline
// @route   POST /api/roadmaps/generate
// @access  Private
const generateRoadmap = async (req, res) => {
  try {
    const { userAnswers } = req.body;
    
    if (!userAnswers) {
      throw new AppError('User answers are required for roadmap generation', 400);
    }
    
    console.log(`🔄 Generating roadmap for user: ${req.user._id}`);
    
    const roadmap = await pipelineService.generateRoadmap(req.user._id.toString(), userAnswers);
    
    res.json({
      success: true,
      data: roadmap,
      message: 'Roadmap generated successfully using AI pipeline'
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    throw new AppError('Failed to generate roadmap', 500);
  }
};

// @desc    Get interview questions for roadmap generation
// @route   GET /api/roadmaps/questions
// @access  Private
const getInterviewQuestions = async (req, res) => {
  try {
    console.log('🔄 Fetching interview questions from pipeline...');
    
    const questions = await pipelineService.getInterviewQuestions();
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    throw new AppError('Failed to fetch interview questions', 500);
  }
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

// @desc    Update milestone progress (pipeline-aware)
// @route   PATCH /api/roadmaps/milestones/:mileId
// @access  Private
const updateMilestoneProgress = async (req, res) => {
  try {
    const { increment = 1 } = req.body;
    
    // Try to update in pipeline first
    try {
      const updatedRoadmap = await pipelineService.updateRoadmapProgress(
        req.user._id.toString(),
        { milestoneId: req.params.mileId, increment }
      );
      
      return res.json({
        success: true,
        data: updatedRoadmap,
        source: 'pipeline'
      });
    } catch (pipelineError) {
      console.warn('Pipeline progress update failed, falling back to legacy:', pipelineError.message);
    }
    
    // Fallback to legacy system
    const roadmap = await Roadmap.findOne({ userId: req.user._id });

    if (!roadmap) {
      throw new AppError('Roadmap not found', 404);
    }

    await roadmap.updateProgress(req.params.mileId, increment);
    res.json({
      success: true,
      data: roadmap,
      source: 'legacy'
    });
  } catch (error) {
    console.error('Error updating milestone progress:', error);
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
  generateRoadmap,
  getInterviewQuestions,
  createOrUpdateRoadmap,
  updateMilestoneProgress,
  deleteRoadmap,
  getRoadmapStats
};
