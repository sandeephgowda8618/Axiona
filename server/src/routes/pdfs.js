const { Router } = require('express');
const { PDF, Comment } = require('../models');
const { protect, optionalAuth } = require('../middleware/auth');

const router = Router();

// Get all PDFs with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
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
      // Text search across topic and author
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

    return res.json({
      pdfs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch PDFs' });
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

    return res.json(pdf);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Upload new PDF (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    const {
      topic,
      fileName,
      fileUrl,
      fileSize,
      pages,
      author,
      domain,
      year,
      class: className,
      description
    } = req.body;

    const pdf = new PDF({
      topic,
      fileName,
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
      message: 'PDF uploaded successfully. Pending admin approval.',
      pdf
    });
  } catch (error) {
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

    return res.json(updatedPdf);
  } catch (error) {
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
    
    return res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
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

    return res.json({ downloadCount: pdf.downloadCount });
  } catch (error) {
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
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
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

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get PDFs by domain
router.get('/domain/:domain', optionalAuth, async (req, res) => {
  try {
    const { domain } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

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

    return res.json({
      pdfs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch PDFs by domain' });
  }
});

// Get popular PDFs
router.get('/popular/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const pdfs = await PDF.find({ approved: true })
      .sort({ downloadCount: -1, publishedAt: -1 })
      .limit(Number(limit))
      .populate('uploadedBy', 'fullName avatarUrl')
      .lean();

    return res.json(pdfs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch popular PDFs' });
  }
});

module.exports = router;
