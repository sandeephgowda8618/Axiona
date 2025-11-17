const express = require('express');
const router = express.Router();
const { Video, SavedVideo, LikedVideo, WatchHistory, DownloadedVideo } = require('../models');
const { protect, optionalAuth } = require('../middleware/auth');

// Like/Unlike a video
router.post('/:videoId/like', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if already liked
    const existingLike = await LikedVideo.findOne({ userId, videoId });

    if (existingLike) {
      // Unlike the video
      await LikedVideo.deleteOne({ userId, videoId });
      await Video.findByIdAndUpdate(videoId, { $inc: { likes: -1 } });

      res.json({
        success: true,
        message: 'Video unliked successfully',
        isLiked: false
      });
    } else {
      // Like the video
      await LikedVideo.create({ userId, videoId });
      await Video.findByIdAndUpdate(videoId, { $inc: { likes: 1 } });

      res.json({
        success: true,
        message: 'Video liked successfully',
        isLiked: true
      });
    }
  } catch (error) {
    console.error('Error liking/unliking video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike video',
      error: error.message
    });
  }
});

// Save/Unsave a video
router.post('/:videoId/save', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to save videos'
      });
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if already saved
    const existingSave = await SavedVideo.findOne({ userId, videoId });

    if (existingSave) {
      // Unsave the video
      await SavedVideo.deleteOne({ userId, videoId });
      await Video.findByIdAndUpdate(videoId, { $inc: { saves: -1 } });

      res.json({
        success: true,
        message: 'Video unsaved successfully',
        isSaved: false
      });
    } else {
      // Save the video
      await SavedVideo.create({ userId, videoId });
      await Video.findByIdAndUpdate(videoId, { $inc: { saves: 1 } });

      res.json({
        success: true,
        message: 'Video saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Error saving/unsaving video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save/unsave video',
      error: error.message
    });
  }
});

// Download/Mark as downloaded a video
router.post('/:videoId/download', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to download videos'
      });
    }
    const { quality = '720p', format = 'mp4' } = req.body;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if already downloaded
    const existingDownload = await DownloadedVideo.findOne({ userId, videoId });

    if (existingDownload) {
      res.json({
        success: true,
        message: 'Video already downloaded',
        isDownloaded: true,
        download: existingDownload
      });
    } else {
      // Mark as downloaded (in a real implementation, this would trigger actual download)
      const downloadRecord = await DownloadedVideo.create({ 
        userId, 
        videoId,
        quality,
        format,
        fileName: `${video.title}.${format}`,
        downloadStatus: 'completed' // For demo purposes
      });

      await Video.findByIdAndUpdate(videoId, { $inc: { downloads: 1 } });

      res.json({
        success: true,
        message: 'Video download initiated',
        isDownloaded: true,
        download: downloadRecord
      });
    }
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download video',
      error: error.message
    });
  }
});

// Record watch history
router.post('/:videoId/watch', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(200).json({
        success: true,
        message: 'Video view counted (guest user)'
      });
    }
    const { watchProgress = 0, watchDuration = 0 } = req.body;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Update or create watch history
    const watchData = {
      userId,
      videoId,
      watchedAt: new Date(),
      watchProgress: Math.min(100, Math.max(0, watchProgress)), // Clamp between 0 and 100
      watchDuration: Math.max(0, watchDuration),
      completed: watchProgress >= 90 // Consider 90% as completed
    };

    await WatchHistory.findOneAndUpdate(
      { userId, videoId },
      watchData,
      { upsert: true, new: true }
    );

    // Increment view count if this is a new view or significant progress
    const existingHistory = await WatchHistory.findOne({ userId, videoId });
    if (!existingHistory || existingHistory.watchProgress < 10) {
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }

    res.json({
      success: true,
      message: 'Watch progress recorded',
      watchData
    });
  } catch (error) {
    console.error('Error recording watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record watch history',
      error: error.message
    });
  }
});

// Get user's watch history
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
        message: 'No history available for guest users'
      });
    }
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const history = await WatchHistory.find({ userId })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views topicTags')
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await WatchHistory.countDocuments({ userId });

    const formattedHistory = history
      .filter(h => h.videoId) // Filter out any broken references
      .map(h => ({
        ...h.videoId,
        lastWatched: h.watchedAt,
        watchProgress: h.watchProgress,
        watchDuration: h.watchDuration,
        completed: h.completed
      }));

    res.json({
      success: true,
      data: formattedHistory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watch history',
      error: error.message
    });
  }
});

// Get user's saved videos
router.get('/saved', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
        message: 'No saved videos available for guest users'
      });
    }
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const savedVideos = await SavedVideo.find({ userId })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views topicTags')
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await SavedVideo.countDocuments({ userId });

    const formattedSaved = savedVideos
      .filter(s => s.videoId) // Filter out any broken references
      .map(s => ({
        ...s.videoId,
        savedAt: s.savedAt,
        isSaved: true
      }));

    res.json({
      success: true,
      data: formattedSaved,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved videos',
      error: error.message
    });
  }
});

// Get user's liked videos
router.get('/liked', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
        message: 'No liked videos available for guest users'
      });
    }
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const likedVideos = await LikedVideo.find({ userId })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views topicTags')
      .sort({ likedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await LikedVideo.countDocuments({ userId });

    const formattedLiked = likedVideos
      .filter(l => l.videoId) // Filter out any broken references
      .map(l => ({
        ...l.videoId,
        likedAt: l.likedAt,
        isLiked: true
      }));

    res.json({
      success: true,
      data: formattedLiked,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch liked videos',
      error: error.message
    });
  }
});

// Get user's downloaded videos
router.get('/downloaded', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
        message: 'No downloaded videos available for guest users'
      });
    }
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const downloadedVideos = await DownloadedVideo.find({ userId })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views topicTags')
      .sort({ downloadedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await DownloadedVideo.countDocuments({ userId });

    const formattedDownloaded = downloadedVideos
      .filter(d => d.videoId) // Filter out any broken references
      .map(d => ({
        ...d.videoId,
        downloadedAt: d.downloadedAt,
        downloadInfo: {
          quality: d.quality,
          format: d.format,
          fileName: d.fileName,
          fileSize: d.fileSize,
          downloadStatus: d.downloadStatus
        },
        isDownloaded: true
      }));

    res.json({
      success: true,
      data: formattedDownloaded,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching downloaded videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch downloaded videos',
      error: error.message
    });
  }
});

// Get user's interaction status for a video
router.get('/:videoId/status', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.json({
        success: true,
        data: {
          isLiked: false,
          isSaved: false,
          isDownloaded: false,
          watchProgress: 0,
          lastWatched: null,
          completed: false
        }
      });
    }

    const [liked, saved, downloaded, watchHistory] = await Promise.all([
      LikedVideo.findOne({ userId, videoId }),
      SavedVideo.findOne({ userId, videoId }),
      DownloadedVideo.findOne({ userId, videoId }),
      WatchHistory.findOne({ userId, videoId })
    ]);

    res.json({
      success: true,
      data: {
        isLiked: !!liked,
        isSaved: !!saved,
        isDownloaded: !!downloaded,
        watchProgress: watchHistory?.watchProgress || 0,
        lastWatched: watchHistory?.watchedAt || null,
        completed: watchHistory?.completed || false
      }
    });
  } catch (error) {
    console.error('Error fetching video status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video status',
      error: error.message
    });
  }
});

module.exports = router;