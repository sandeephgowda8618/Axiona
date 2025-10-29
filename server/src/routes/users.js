const { Router } = require('express');
const { User, Streak, WatchHistory, SavedVideo, LikedVideo } = require('../models');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = Router();

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -security.tfaSecret')
      .populate('currentRoadmapId', 'title milestones');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/me', protect, async (req, res) => {
  try {
    const { fullName, avatarUrl, preferences } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (preferences) updateData.preferences = { ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-passwordHash -security.tfaSecret');

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update password
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    user.passwordHash = passwordHash;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get user statistics
router.get('/me/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get streak information
    const streak = await Streak.findOne({ userId });

    // Get watch statistics
    const watchStats = await WatchHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalWatchTime: { $sum: '$progressSec' },
          avgWatchTime: { $avg: '$progressSec' }
        }
      }
    ]);

    // Get saved and liked counts
    const [savedCount, likedCount] = await Promise.all([
      SavedVideo.countDocuments({ userId }),
      LikedVideo.countDocuments({ userId })
    ]);

    const stats = {
      streak: streak || { current: 0, longest: 0, freezeLeft: 0 },
      watchStats: watchStats[0] || { totalVideos: 0, totalWatchTime: 0, avgWatchTime: 0 },
      savedVideos: savedCount,
      likedVideos: likedCount
    };

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user's watch history
router.get('/me/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const history = await WatchHistory.find({ userId: req.user._id })
      .populate('videoId', 'title thumbnailUrl durationSec channelName')
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await WatchHistory.countDocuments({ userId: req.user._id });

    return res.json({
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

// Get user's saved videos
router.get('/me/saved', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const savedVideos = await SavedVideo.find({ userId: req.user._id })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views likes')
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await SavedVideo.countDocuments({ userId: req.user._id });

    return res.json({
      videos: savedVideos.map(sv => sv.videoId),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch saved videos' });
  }
});

// Get user's liked videos
router.get('/me/liked', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const likedVideos = await LikedVideo.find({ userId: req.user._id })
      .populate('videoId', 'title thumbnailUrl durationSec channelName views likes')
      .sort({ likedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await LikedVideo.countDocuments({ userId: req.user._id });

    return res.json({
      videos: likedVideos.map(lv => lv.videoId),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch liked videos' });
  }
});

// Update user preferences
router.put('/me/preferences', protect, async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences } },
      { new: true }
    ).select('preferences');

    return res.json(user.preferences);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get public user profile (for social features)
router.get('/:userId/profile', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('fullName avatarUrl createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add public stats if needed
    const stats = await WatchHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalWatchTime: { $sum: '$progressSec' }
        }
      }
    ]);

    return res.json({
      ...user,
      stats: stats[0] || { totalVideos: 0, totalWatchTime: 0 }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
