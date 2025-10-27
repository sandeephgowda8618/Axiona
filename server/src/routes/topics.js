const express = require('express');
const { Topic, Video, PDF, TopTutorial } = require('../models');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all topics
router.get('/', optionalAuth, async (req, res) => {
  try {
    const topics = await Topic.find()
      .sort({ isTopFive: -1, displayOrder: 1 })
      .lean();

    return res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch topics' 
    });
  }
});

// Get top 5 topics
router.get('/top-five', optionalAuth, async (req, res) => {
  try {
    const topics = await Topic.find({ isTopFive: true })
      .sort({ displayOrder: 1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch top topics' 
    });
  }
});

// Get topic by ID with related content
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    // Get related videos and PDFs
    const [videos, pdfs] = await Promise.all([
      Video.find({ topicTags: topic.name })
        .sort({ views: -1, uploadedAt: -1 })
        .limit(10)
        .lean(),
      PDF.find({ 
        $or: [
          { domain: { $regex: topic.name, $options: 'i' } },
          { topic: { $regex: topic.name, $options: 'i' } }
        ],
        approved: true
      })
        .sort({ downloadCount: -1, publishedAt: -1 })
        .limit(10)
        .lean()
    ]);

    return res.json({
      success: true,
      data: {
        topic,
        relatedContent: {
          videos,
          pdfs
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch topic details' 
    });
  }
});

// Get videos by topic
router.get('/:id/videos', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    const videos = await Video.find({ topicTags: topic.name })
      .sort({ views: -1, uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Video.countDocuments({ topicTags: topic.name });

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
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch videos for topic' 
    });
  }
});

// Get PDFs by topic
router.get('/:id/pdfs', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    const pdfs = await PDF.find({ 
      $or: [
        { domain: { $regex: topic.name, $options: 'i' } },
        { topic: { $regex: topic.name, $options: 'i' } }
      ],
      approved: true
    })
      .sort({ downloadCount: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'fullName avatarUrl')
      .lean();

    const total = await PDF.countDocuments({ 
      $or: [
        { domain: { $regex: topic.name, $options: 'i' } },
        { topic: { $regex: topic.name, $options: 'i' } }
      ],
      approved: true
    });

    return res.json({
      success: true,
      data: pdfs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch PDFs for topic' 
    });
  }
});

// Get top tutorials (for homepage slider)
router.get('/tutorials/top', optionalAuth, async (req, res) => {
  try {
    const topTutorials = await TopTutorial.find()
      .sort({ sliderOrder: 1 })
      .populate({
        path: 'videoId',
        select: 'title description thumbnailUrl durationSec channelName views likes'
      })
      .lean();

    const tutorials = topTutorials
      .filter(tt => tt.videoId) // Only include if video exists
      .map(tt => tt.videoId);

    return res.json({
      success: true,
      data: tutorials
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch top tutorials' 
    });
  }
});

// Create new topic (admin only)
router.post('/', protect, async (req, res) => {
  try {
    const { name, iconUrl, displayOrder, isTopFive } = req.body;

    // Check if topic already exists
    const existingTopic = await Topic.findOne({ name });
    if (existingTopic) {
      return res.status(400).json({ 
        success: false,
        error: 'Topic already exists' 
      });
    }

    const topic = new Topic({
      name,
      iconUrl,
      displayOrder,
      isTopFive: isTopFive || false
    });

    await topic.save();
    return res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create topic' 
    });
  }
});

// Update topic (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, iconUrl, displayOrder, isTopFive } = req.body;

    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, iconUrl, displayOrder, isTopFive },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    return res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update topic' 
    });
  }
});

// Delete topic (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);

    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    return res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to delete topic' 
    });
  }
});

// Add video to top tutorials
router.post('/tutorials/top', protect, async (req, res) => {
  try {
    const { videoId, sliderOrder } = req.body;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found' 
      });
    }

    // Check if already in top tutorials
    const existing = await TopTutorial.findOne({ videoId });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: 'Video already in top tutorials' 
      });
    }

    const topTutorial = new TopTutorial({
      videoId,
      sliderOrder
    });

    await topTutorial.save();
    await topTutorial.populate('videoId', 'title thumbnailUrl durationSec channelName');

    return res.status(201).json({
      success: true,
      data: topTutorial
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to add video to top tutorials' 
    });
  }
});

// Remove video from top tutorials
router.delete('/tutorials/top/:videoId', protect, async (req, res) => {
  try {
    const topTutorial = await TopTutorial.findOneAndDelete({ 
      videoId: req.params.videoId 
    });

    if (!topTutorial) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found in top tutorials' 
      });
    }

    return res.json({
      success: true,
      message: 'Video removed from top tutorials'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to remove video from top tutorials' 
    });
  }
});

// Update top tutorial order
router.put('/tutorials/top/:videoId/order', protect, async (req, res) => {
  try {
    const { sliderOrder } = req.body;

    const topTutorial = await TopTutorial.findOneAndUpdate(
      { videoId: req.params.videoId },
      { sliderOrder },
      { new: true }
    ).populate('videoId', 'title thumbnailUrl durationSec channelName');

    if (!topTutorial) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found in top tutorials' 
      });
    }

    return res.json({
      success: true,
      data: topTutorial
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update tutorial order' 
    });
  }
});

module.exports = router;
