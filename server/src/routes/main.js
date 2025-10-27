const { Router } = require('express');
const dataService = require('../services/dataService');
const { Video } = require('../models/Video');
const aiService = require('../services/aiService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const videoCount = await Video.countDocuments();
    res.json({ 
      status: 'OK', 
      message: 'Study-AI API is running',
      timestamp: new Date().toISOString(),
      dataStats: {
        users: dataService.users.length,
        videos: videoCount,
        quizzes: dataService.quizzes.length,
        studyMaterials: dataService.studyMaterials.length
      }
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'Study-AI API is running',
      timestamp: new Date().toISOString(),
      dataStats: {
        users: dataService.users.length,
        videos: 0, // fallback if database is not available
        quizzes: dataService.quizzes.length,
        studyMaterials: dataService.studyMaterials.length
      }
    });
  }
});

// AUTH ROUTES
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await dataService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    
    const existingUser = await dataService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await dataService.createUser({
      email,
      fullName,
      password: hashedPassword,
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
      stats: {
        coursesCompleted: 0,
        streakDays: 0,
        totalNotes: 0,
        weeklyActivity: '0h'
      },
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      },
      isVerified: false
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// USER ROUTES
router.get('/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dataService.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    const stats = await dataService.getUserStats(user._id);
    
    res.json({
      success: true,
      user: { ...userWithoutPassword, stats }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// VIDEO ROUTES
router.get('/videos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const topic = req.query.topic;
    const sortBy = req.query.sortBy || 'uploadedAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build query
    let query = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Topic filter
    if (topic) {
      query.topicTags = { $in: [topic.toLowerCase()] };
    }

    // Build sort object
    let sortObj = {};
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

    res.json({
      success: true,
      data: videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVideos: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Videos fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch videos' 
    });
  }
});

router.get('/videos/stats/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const videos = await Video.findPopular(limit);
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Popular videos fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch popular videos' 
    });
  }
});

router.get('/videos/stats/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const videos = await Video.findRecent(limit);
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Recent videos fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent videos' 
    });
  }
});

router.get('/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch video' 
    });
  }
});

// PLAYLIST ROUTES
router.get('/videos/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    
    // Get all videos in the playlist, sorted by episode number
    const playlistVideos = await Video.find({ playlistId })
      .sort({ episodeNumber: 1 })
      .lean();
    
    if (playlistVideos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found or empty' 
      });
    }
    
    // Get playlist metadata from the first video
    const playlistInfo = {
      playlistId: playlistVideos[0].playlistId,
      playlistTitle: playlistVideos[0].playlistTitle,
      totalEpisodes: playlistVideos.length,
      totalDuration: playlistVideos.reduce((sum, video) => sum + (video.durationSec || 0), 0)
    };
    
    res.json({
      success: true,
      data: {
        playlist: playlistInfo,
        videos: playlistVideos
      }
    });
  } catch (error) {
    console.error('Playlist fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch playlist' 
    });
  }
});

router.get('/videos/:id/related', async (req, res) => {
  try {
    const { Video } = require('../models/Video');
    
    const videoId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get the current video
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // If video is part of a playlist, return other videos from the same playlist
    if (currentVideo.playlistId) {
      const playlistVideos = await Video.find({ 
        playlistId: currentVideo.playlistId,
        _id: { $ne: videoId } // Exclude current video
      })
      .sort({ episodeNumber: 1 })
      .limit(limit)
      .lean();
      
      return res.json({
        success: true,
        data: playlistVideos,
        type: 'playlist'
      });
    }
    
    // For standalone videos, find related videos by topic tags
    const topicTags = currentVideo.topicTags || [];
    let query = {};
    
    if (topicTags.length > 0) {
      query.topicTags = { $in: topicTags };
    }
    
    // Exclude current video and playlist videos
    query._id = { $ne: videoId };
    query.playlistId = { $exists: false };
    
    const relatedVideos = await Video.find(query)
      .sort({ views: -1, uploadedAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      data: relatedVideos,
      type: 'related'
    });
  } catch (error) {
    console.error('Related videos fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch related videos' 
    });
  }
});

router.get('/playlists', async (req, res) => {
  try {
    const { Video } = require('../models/Video');
    
    // Get all unique playlists with metadata
    const playlists = await Video.aggregate([
      {
        $match: { 
          playlistId: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$playlistId',
          playlistTitle: { $first: '$playlistTitle' },
          totalEpisodes: { $sum: 1 },
          totalDuration: { $sum: '$durationSec' },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          firstVideoThumbnail: { $first: '$thumbnailUrl' },
          firstVideoId: { $first: '$_id' },
          lastUpdated: { $max: '$uploadedAt' },
          topicTags: { $addToSet: { $arrayElemAt: ['$topicTags', 0] } }
        }
      },
      {
        $sort: { lastUpdated: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: playlists.map(playlist => ({
        playlistId: playlist._id,
        playlistTitle: playlist.playlistTitle,
        totalEpisodes: playlist.totalEpisodes,
        totalDuration: playlist.totalDuration,
        totalViews: playlist.totalViews,
        totalLikes: playlist.totalLikes,
        thumbnailUrl: playlist.firstVideoThumbnail,
        firstVideoId: playlist.firstVideoId,
        lastUpdated: playlist.lastUpdated,
        mainTopic: playlist.topicTags[0]
      }))
    });
  } catch (error) {
    console.error('Playlists fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch playlists' 
    });
  }
});

// QUIZ ROUTES
router.get('/quizzes', async (req, res) => {
  try {
    const { limit = 20, skip = 0, category } = req.query;
    
    let quizzes;
    if (category) {
      quizzes = await dataService.getQuizzesByCategory(category, parseInt(limit));
    } else {
      quizzes = await dataService.getAllQuizzes(parseInt(limit), parseInt(skip));
    }
    
    res.json({
      success: true,
      quizzes,
      total: quizzes.length
    });
  } catch (error) {
    console.error('Quizzes fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch quizzes' 
    });
  }
});

router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await dataService.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz not found' 
      });
    }
    
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch quiz' 
    });
  }
});

// STUDY MATERIALS ROUTES
router.get('/study-materials', async (req, res) => {
  try {
    const { limit = 20, skip = 0, search } = req.query;
    
    let materials;
    if (search) {
      materials = await dataService.searchStudyMaterials(search, parseInt(limit));
    } else {
      materials = await dataService.getAllStudyMaterials(parseInt(limit), parseInt(skip));
    }
    
    res.json({
      success: true,
      materials,
      total: materials.length
    });
  } catch (error) {
    console.error('Study materials fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch study materials' 
    });
  }
});

// ROADMAP ROUTES
router.get('/roadmaps', authenticateToken, async (req, res) => {
  try {
    const roadmaps = await dataService.getRoadmapsByUserId(req.user.userId);
    
    res.json({
      success: true,
      roadmaps,
      total: roadmaps.length
    });
  } catch (error) {
    console.error('Roadmaps fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch roadmaps' 
    });
  }
});

// TOPICS ROUTES
router.get('/topics', async (req, res) => {
  try {
    const { topFive } = req.query;
    
    let topics;
    if (topFive === 'true') {
      topics = await dataService.getTopFiveTopics();
    } else {
      topics = await dataService.getAllTopics();
    }
    
    res.json({
      success: true,
      topics,
      total: topics.length
    });
  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch topics' 
    });
  }
});

// CONFERENCE ROOM ROUTES
router.get('/rooms', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const rooms = await dataService.getAllRooms(parseInt(limit));
    
    res.json({
      success: true,
      rooms,
      total: rooms.length
    });
  } catch (error) {
    console.error('Rooms fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch rooms' 
    });
  }
});

router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { title, description, startAt, maxParticipants = 10 } = req.body;
    
    const newRoom = await dataService.createRoom({
      title,
      description,
      startAt: new Date(startAt),
      scheduledEnd: new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      maxParticipants,
      studentId: req.user.userId,
      hasPassword: false,
      isPublic: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: newRoom
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create room' 
    });
  }
});

// AI ROUTES
router.post('/ai/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    const response = await aiService.generateResponse(message, conversationHistory);
    
    res.json({
      success: true,
      response: response.message,
      metadata: response.metadata
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI response' 
    });
  }
});

router.post('/ai/study-plan', async (req, res) => {
  try {
    const { subject, duration, level } = req.body;
    
    const response = await aiService.generateStudyPlan(subject, duration, level);
    
    res.json({
      success: true,
      studyPlan: response.studyPlan,
      metadata: { subject, duration, level }
    });
  } catch (error) {
    console.error('AI study plan error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate study plan' 
    });
  }
});

router.post('/ai/quiz-questions', async (req, res) => {
  try {
    const { topic, difficulty = 'medium', questionCount = 5 } = req.body;
    
    const response = await aiService.generateQuizQuestions(topic, difficulty, questionCount);
    
    res.json({
      success: true,
      questions: response.questions,
      metadata: { topic, difficulty, questionCount }
    });
  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate quiz questions' 
    });
  }
});

router.get('/ai/health', async (req, res) => {
  try {
    const healthCheck = await aiService.healthCheck();
    
    res.json({
      success: true,
      aiService: healthCheck
    });
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI service health check failed' 
    });
  }
});

// Middleware for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
