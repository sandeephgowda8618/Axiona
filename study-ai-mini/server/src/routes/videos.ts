import express from 'express';
import { Video } from '../models/Video';
import { AppError } from '../middleware/errorHandler';
import { protect, optionalAuth } from '../middleware/auth';

const router = express.Router();

// @desc    Get all videos with search and filters
// @route   GET /api/videos
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const topic = req.query.topic as string;
    const sortBy = req.query.sortBy as string || 'uploadedAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build query
    let query: any = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Topic filter
    if (topic) {
      query.topicTags = { $in: [topic] };
    }

    // Build sort object
    let sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Add text score for search queries
    if (search) {
      sortObj.score = { $meta: 'textScore' };
    }

    const skip = (page - 1) * limit;

    // Execute query
    const videos = await Video.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Video.countDocuments(query);

    return res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Get video by ID
// @route   GET /api/videos/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    // Increment view count (could be moved to a separate endpoint for better UX)
    video.views += 1;
    await video.save();

    return res.json({
      success: true,
      data: video
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Get popular videos
// @route   GET /api/videos/popular
// @access  Public
router.get('/stats/popular', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const videos = await Video.find()
      .sort({ views: -1, likes: -1 })
      .limit(limit)
      .select('title thumbnailUrl views likes durationSec channelName')
      .lean();

    return res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Get video topics/tags
// @route   GET /api/videos/topics
// @access  Public
router.get('/stats/topics', async (req, res, next) => {
  try {
    const topics = await Video.aggregate([
      { $unwind: '$topicTags' },
      { $group: { _id: '$topicTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    return res.json({
      success: true,
      data: topics.map(topic => ({
        name: topic._id,
        count: topic.count
      }))
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Like a video
// @route   POST /api/videos/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    // Increment like count
    video.likes += 1;
    await video.save();

    // TODO: Create/update user's liked videos record

    return res.json({
      success: true,
      message: 'Video liked successfully',
      likes: video.likes
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Save a video
// @route   POST /api/videos/:id/save
// @access  Private
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    // Increment save count
    video.saves += 1;
    await video.save();

    // TODO: Create user's saved videos record

    return res.json({
      success: true,
      message: 'Video saved successfully',
      saves: video.saves
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
