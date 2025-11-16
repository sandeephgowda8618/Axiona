const { Router } = require('express');
const { PDF } = require('../models/PDF');
const { Highlight } = require('../models/Highlight');
const { Comment } = require('../models/Comment');
const { protect, optionalAuth } = require('../middleware/auth');

const router = Router();

// ==========================================
// SUBJECTS ENDPOINT - Dynamic Data Only
// ==========================================

// Get subjects summary with aggregated data from database
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await PDF.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$domain',
          pdfCount: { $sum: 1 },
          totalPages: { $sum: '$pages' },
          totalDownloads: { $sum: '$downloadCount' },
          averagePages: { $avg: '$pages' },
          lastUpdated: { $max: '$publishedAt' },
          topics: { $addToSet: '$topic' }
        }
      },
      { $match: { _id: { $ne: null } } },
      {
        $project: {
          domain: '$_id',
          title: '$_id',
          description: {
            $concat: [
              'Study materials for ',
              '$_id',
              ' with ',
              { $toString: '$pdfCount' },
              ' PDFs covering ',
              { $toString: { $size: '$topics' } },
              ' topics'
            ]
          },
          pdfCount: 1,
          totalPages: 1,
          totalDownloads: 1,
          averagePages: { $round: ['$averagePages', 0] },
          topicCount: { $size: '$topics' },
          lastUpdated: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastUpdated' }
          },
          _id: 0
        }
      },
      { $sort: { pdfCount: -1 } }
    ]);

    // Only return data if subjects exist, otherwise return error
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No approved study materials found in database' 
      });
    }

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error occurred while fetching subjects' 
    });
  }
});

// ==========================================
// HIGHLIGHTS ENDPOINTS - Must come before ALL other routes
// ==========================================

// Get highlights for a PDF and user - Frontend expects this path
router.get('/highlights/pdf/:pdfId', async (req, res) => {
  try {
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

// Popular PDFs route - must come before /:id route
router.get('/popular/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const pdfs = await PDF.find({ approved: true })
      .sort({ downloadCount: -1, publishedAt: -1 })
      .limit(Number(limit))
      .populate('uploadedBy', 'fullName avatarUrl')
      .lean();

    return res.json({
      success: true,
      data: pdfs
    });
  } catch (error) {
    console.error('Get popular PDFs error:', error);
    return res.status(500).json({ error: 'Failed to fetch popular PDFs' });
  }
});

// Domain route - must come before /:id route  
router.get('/domain/:domain', optionalAuth, async (req, res) => {
  try {
    const { domain } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Validate domain parameter
    if (!domain || domain.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Domain parameter is required' 
      });
    }

    const pdfs = await PDF.find({ 
      domain: { $regex: domain, $options: 'i' },
      approved: true 
    })
      .sort({ downloadCount: -1, publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('uploadedBy', 'fullName avatarUrl')
      .lean();

    const total = await PDF.countDocuments({ 
      domain: { $regex: domain, $options: 'i' },
      approved: true 
    });

    // Check if no PDFs found for this domain
    if (!pdfs || pdfs.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No approved PDFs found for domain: ${domain}`,
        data: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      });
    }

    return res.json({
      success: true,
      data: pdfs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get PDFs by domain error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Database error occurred while fetching PDFs by domain' 
    });
  }
});

// User highlights routes - must come before /:id route
router.get('/user/:userId/highlights', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const highlights = await Highlight.find({ userId })
      .populate('pdfId', 'topic fileName domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Highlight.countDocuments({ userId });

    res.json({
      success: true,
      data: highlights,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get user highlights error:', error);
    res.status(500).json({ error: 'Failed to fetch user highlights' });
  }
});

// Get highlights by tags - must come before /:id route
router.get('/user/:userId/highlights/tags/:tag', async (req, res) => {
  try {
    const { userId, tag } = req.params;

    const highlights = await Highlight.find({ 
      userId, 
      tags: { $in: [tag] } 
    })
    .populate('pdfId', 'topic fileName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: highlights
    });
  } catch (error) {
    console.error('Get highlights by tag error:', error);
    res.status(500).json({ error: 'Failed to fetch highlights by tag' });
  }
});

// ==========================================
// PDF CRUD ENDPOINTS
// ==========================================

// Get all PDFs with filtering and pagination - Dynamic Data Only
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      domain, 
      year, 
      class: className,
      search,
      approved = 'true'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter object
    const filter = {};
    
    if (approved === 'true') {
      filter.approved = true;
    }
    
    if (domain) {
      filter.domain = { $regex: domain, $options: 'i' };
    }
    
    if (year) {
      filter.year = Number(year);
    }
    
    if (className) {
      filter.class = { $regex: className, $options: 'i' };
    }

    let query;
    
    if (search) {
      query = PDF.find({
        ...filter,
        $text: { $search: search }
      }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
    } else {
      query = PDF.find(filter).sort({ publishedAt: -1 });
    }

    const pdfs = await query
      .skip(skip)
      .limit(Number(limit))
      .populate('uploadedBy', 'fullName avatarUrl')
      .lean();

    const total = await PDF.countDocuments(filter);

    // Check if no PDFs found
    if (!pdfs || pdfs.length === 0) {
      return res.json({
        success: true,
        message: 'No PDFs found matching the criteria',
        data: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      });
    }

    return res.json({
      success: true,
      data: pdfs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get PDFs error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Database error occurred while fetching PDFs' 
    });
  }
});

// Get PDF by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id)
      .populate('uploadedBy', 'fullName avatarUrl');

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    return res.json({
      success: true,
      data: pdf
    });
  } catch (error) {
    console.error('Get PDF by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Upload new PDF (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    const {
      topic,
      fileName,
      gridFSFileId,
      fileUrl,
      fileSize,
      pages,
      author,
      domain,
      year,
      class: className,
      description
    } = req.body;

    // Validate required fields
    if (!topic || !fileName || !fileUrl || !fileSize || !pages || !domain) {
      return res.status(400).json({ 
        error: 'Missing required fields: topic, fileName, fileUrl, fileSize, pages, domain' 
      });
    }

    const pdf = new PDF({
      topic,
      fileName,
      gridFSFileId,
      fileUrl,
      fileSize,
      pages,
      author,
      domain,
      year,
      class: className,
      description,
      uploadedBy: req.user._id,
      approved: false // Admin approval required
    });

    await pdf.save();

    return res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully. Pending admin approval.',
      data: pdf
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    return res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// Update PDF (only by uploader or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user is the uploader
    if (pdf.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this PDF' });
    }

    const updateData = req.body;
    delete updateData.approved; // Users cannot change approval status

    const updatedPdf = await PDF.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('uploadedBy', 'fullName avatarUrl');

    return res.json({
      success: true,
      message: 'PDF updated successfully',
      data: updatedPdf
    });
  } catch (error) {
    console.error('Update PDF error:', error);
    return res.status(500).json({ error: 'Failed to update PDF' });
  }
});

// Delete PDF (only by uploader or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user is the uploader
    if (pdf.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this PDF' });
    }

    await PDF.findByIdAndDelete(req.params.id);
    
    return res.json({ 
      success: true,
      message: 'PDF deleted successfully' 
    });
  } catch (error) {
    console.error('Delete PDF error:', error);
    return res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

// Increment download count
router.post('/:id/download', optionalAuth, async (req, res) => {
  try {
    const pdf = await PDF.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    ).select('downloadCount');

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    return res.json({ 
      success: true,
      data: { downloadCount: pdf.downloadCount }
    });
  } catch (error) {
    console.error('Download count error:', error);
    return res.status(500).json({ error: 'Failed to update download count' });
  }
});

// Get PDF comments
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const comments = await Comment.find({ pdfId: req.params.id })
      .populate('userId', 'fullName avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Comment.countDocuments({ pdfId: req.params.id });

    return res.json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to PDF
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = new Comment({
      pdfId: req.params.id,
      userId: req.user._id,
      text: text.trim()
    });

    await comment.save();
    await comment.populate('userId', 'fullName avatarUrl');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
