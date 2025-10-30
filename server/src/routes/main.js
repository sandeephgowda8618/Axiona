const { Router } = require('express');
const dataService = require('../services/dataService');
const { Video } = require('../models/Video');
const { PDF } = require('../models/PDF');
const { User } = require('../models/User');
const aiService = require('../services/aiService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const notesRouter = require('./notes'); // Add notes router
const meetingsRouter = require('./meetings'); // Add meetings router

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

// PDF/STUDY MATERIALS ROUTES

// Get all subjects (domains) with PDF counts and metadata
router.get('/pdfs/subjects', async (req, res) => {
  try {
    const subjects = await PDF.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
          totalPages: { $sum: '$pages' },
          totalDownloads: { $sum: '$downloadCount' },
          averagePages: { $avg: '$pages' },
          subjects: { $addToSet: '$topic' },
          sampleThumbnail: { $first: '$thumbnailUrl' },
          latestUpload: { $max: '$publishedAt' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const subjectCards = subjects.map(subject => ({
      domain: subject._id,
      title: subject._id === 'DSA' ? 'Data Structures & Algorithms' : 
             subject._id === 'AFLL' ? 'Automata & Formal Language Theory' :
             subject._id === 'Math' ? 'Mathematics' : subject._id,
      pdfCount: subject.count,
      totalPages: subject.totalPages,
      totalDownloads: subject.totalDownloads,
      averagePages: Math.round(subject.averagePages),
      topicCount: subject.subjects.length,
      thumbnailUrl: subject.sampleThumbnail || '/api/placeholder-subject.jpg',
      lastUpdated: subject.latestUpload,
      description: getSubjectDescription(subject._id)
    }));

    res.json({
      success: true,
      data: subjectCards
    });
  } catch (error) {
    console.error('Subjects fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subjects' 
    });
  }
});

// Get PDFs for a specific subject/domain
router.get('/pdfs/subject/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { page = 1, limit = 20, search } = req.query;
    
    let query = { domain: domain, approved: true };
    
    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const pdfs = await PDF.find(query)
      .sort({ downloadCount: -1, publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'fullName email')
      .lean();

    const total = await PDF.countDocuments(query);

    res.json({
      success: true,
      data: pdfs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Subject PDFs fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch PDFs for subject' 
    });
  }
});

// Get specific PDF details
router.get('/pdfs/:id', async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id)
      .populate('uploadedBy', 'fullName email')
      .lean();
      
    if (!pdf) {
      return res.status(404).json({ 
        success: false, 
        message: 'PDF not found' 
      });
    }

    // Increment view count (optional)
    await PDF.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      data: pdf
    });
  } catch (error) {
    console.error('PDF fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch PDF' 
    });
  }
});

// Download PDF endpoint
router.post('/pdfs/:id/download', async (req, res) => {
  try {
    // Increment download count
    await PDF.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    
    res.json({
      success: true,
      message: 'Download count updated'
    });
  } catch (error) {
    console.error('Download tracking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to track download' 
    });
  }
});

// Search PDFs across all subjects
router.get('/pdfs/search', async (req, res) => {
  try {
    const { q, domain, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let query = {
      approved: true,
      $or: [
        { topic: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } }
      ]
    };

    if (domain) {
      query.domain = domain.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const pdfs = await PDF.find(query)
      .sort({ downloadCount: -1, publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'fullName email')
      .lean();

    const total = await PDF.countDocuments(query);

    res.json({
      success: true,
      data: pdfs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      searchQuery: q
    });
  } catch (error) {
    console.error('PDF search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search PDFs' 
    });
  }
});

// GridFS PDF serving endpoint
router.get('/pdfs/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const gridFSService = require('../services/gridFSService');
    
    // Check if file exists
    const fileInfo = await gridFSService.getPDFInfo(fileId);
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
      'Content-Length': fileInfo.length
    });

    // Stream the file
    const downloadStream = await gridFSService.downloadPDF(fileId);
    
    downloadStream.on('error', (error) => {
      console.error('PDF stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming PDF'
        });
      }
    });

    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('PDF serve error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF'
    });
  }
});

// Upload new PDF endpoint (for admin use)
router.post('/pdfs/upload', authenticateToken, async (req, res) => {
  try {
    const multer = require('multer');
    const gridFSService = require('../services/gridFSService');
    
    // Configure multer for memory storage
    const storage = multer.memoryStorage();
    const upload = multer({ 
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'));
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
      }
    });

    upload.single('pdf')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      // Upload to GridFS
      const uploadResult = await gridFSService.uploadPDF(
        req.file.buffer,
        req.file.originalname,
        {
          uploadedBy: req.user.userId,
          originalName: req.file.originalname,
          domain: req.body.domain || 'Other'
        }
      );

      // Create PDF record
      const pdfRecord = await PDF.create({
        topic: req.body.topic || req.file.originalname.replace('.pdf', ''),
        fileName: req.file.originalname,
        gridFSFileId: uploadResult.fileId,
        fileUrl: `/api/pdfs/file/${uploadResult.fileId}`,
        fileSize: req.file.size,
        pages: req.body.pages || estimatePages(req.file.size),
        author: req.body.author || 'Unknown',
        domain: req.body.domain || 'Other',
        year: req.body.year,
        class: req.body.class,
        description: req.body.description || '',
        approved: false, // Requires approval
        uploadedBy: req.user.userId,
        downloadCount: 0
      });

      res.json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          pdfId: pdfRecord._id,
          fileId: uploadResult.fileId,
          filename: uploadResult.filename
        }
      });
    });

  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PDF'
    });
  }
});

// Helper function for page estimation
function estimatePages(fileSize) {
  const avgBytesPerPage = 50000;
  const estimated = Math.ceil(fileSize / avgBytesPerPage);
  return Math.max(1, Math.min(estimated, 200));
}

// HIGHLIGHT/ANNOTATION ROUTES

// Get highlights for a PDF - Frontend expects this path
router.get('/highlights/pdf/:pdfId', async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { pdfId } = req.params;
    const { userId } = req.query;
    
    console.log('🔍 Highlights route hit with pdfId:', pdfId, 'userId:', userId);

    // If no userId provided, return empty highlights (not an error)
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        message: 'No user ID provided, returning empty highlights'
      });
    }

    const highlights = await Highlight.find({ 
      pdfId, 
      userId 
    }).sort({ pageNumber: 1, createdAt: 1 });

    console.log('📝 Found highlights:', highlights.length);
    
    res.json({
      success: true,
      data: highlights || [],
      count: highlights ? highlights.length : 0
    });
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error occurred while fetching highlights',
      data: []
    });
  }
});

// Get highlights for a PDF
router.get('/pdfs/:pdfId/highlights', async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { pdfId } = req.params;
    const userId = req.user?.userId; // Optional authentication
    
    const highlights = await Highlight.getHighlightsForPDF(pdfId, userId);
    
    res.json({
      success: true,
      data: highlights
    });
  } catch (error) {
    console.error('Highlights fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch highlights'
    });
  }
});

// Create new highlight
router.post('/pdfs/:pdfId/highlights', authenticateToken, async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { pdfId } = req.params;
    
    const highlight = await Highlight.create({
      pdfId,
      userId: req.user.userId,
      content: req.body.content,
      position: req.body.position,
      style: req.body.style,
      comment: req.body.comment,
      type: req.body.type || 'highlight',
      tags: req.body.tags || []
      // Removed isPublic - highlights are private to user
    });
    
    await highlight.populate('userId', 'fullName email avatarUrl');
    
    res.status(201).json({
      success: true,
      data: highlight
    });
  } catch (error) {
    console.error('Highlight creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create highlight'
    });
  }
});

// Update highlight
router.put('/highlights/:highlightId', authenticateToken, async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { highlightId } = req.params;
    
    const highlight = await Highlight.findOneAndUpdate(
      { _id: highlightId, userId: req.user.userId },
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'fullName email avatarUrl');
    
    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      data: highlight
    });
  } catch (error) {
    console.error('Highlight update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update highlight'
    });
  }
});

// Delete highlight
router.delete('/highlights/:highlightId', authenticateToken, async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { highlightId } = req.params;
    
    const highlight = await Highlight.findOneAndDelete({
      _id: highlightId,
      userId: req.user.userId
    });
    
    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Highlight deleted successfully'
    });
  } catch (error) {
    console.error('Highlight deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete highlight'
    });
  }
});

// Get user's highlights across all PDFs (for My Rack)
router.get('/highlights/my-highlights', authenticateToken, async (req, res) => {
  try {
    const { Highlight } = require('../models/Highlight');
    const { page = 1, limit = 20, tags } = req.query;
    
    let query = { userId: req.user.userId };
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    const highlights = await Highlight.find(query)
      .populate('pdfId', 'topic domain fileName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Highlight.countDocuments(query);
    
    res.json({
      success: true,
      data: highlights,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('User highlights fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user highlights'
    });
  }
});

// Helper function to get subject descriptions
function getSubjectDescription(domain) {
  const descriptions = {
    'DSA': 'Master data structures and algorithms with comprehensive study materials, examples, and practice problems.',
    'AFLL': 'Learn Automata and Formal Language Theory, including finite automata, regular expressions, and context-free grammars.',
    'Math': 'Essential mathematics for computer science including linear algebra, calculus, and discrete mathematics.',
    'CS': 'Core computer science concepts and fundamentals.',
    'ML': 'Machine learning algorithms, models, and applications.',
    'DBMS': 'Database management systems, SQL, and data modeling.',
    'OS': 'Operating systems concepts, processes, and memory management.',
    'Networks': 'Computer networks, protocols, and distributed systems.',
    'Security': 'Cybersecurity, cryptography, and security protocols.',
    'AI': 'Artificial intelligence concepts and techniques.',
    'Web Dev': 'Web development technologies and frameworks.',
    'Mobile Dev': 'Mobile application development.'
  };
  
  return descriptions[domain] || `Comprehensive study materials for ${domain}`;
}

// Authentication middleware function
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

// Mount notes routes
// Mount the notes router
router.use('/notes', notesRouter);

// Mount the meetings router
router.use('/meetings', meetingsRouter);

module.exports = router;
