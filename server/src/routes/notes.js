const express = require('express');
const { Note } = require('../models/Note');
const { PDF } = require('../models/PDF');
const FirebaseUserService = require('../services/firebaseUserService');
const router = express.Router();

// Get all notes for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, search } = req.query;
    
    console.log('📋 Fetching notes for user:', userId);
    
    // Validate Firebase UID format
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      console.log('❌ Invalid Firebase UID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    let query = { userId };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { pdfTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean() // Use lean() for better performance
      .exec();
    
    const total = await Note.countDocuments(query);
    
    console.log(`✅ Found ${notes.length} notes for user ${userId}`);
    
    res.json({
      success: true,
      data: notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

// Get notes for a specific PDF
router.get('/pdf/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { userId } = req.query;
    
    let query = { pdfId };
    if (userId) {
      query.userId = userId;
    }
    
    const notes = await Note.find(query)
      .populate('userId', 'fullName email')
      // Removed PDF population since we store pdfTitle in note
      .sort({ updatedAt: -1 })
      .exec();
    
    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching PDF notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes for PDF',
      error: error.message
    });
  }
});

// Get a specific note
router.get('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const note = await Note.findById(noteId)
      // Only populate fileUrl from PDF if needed for download link
      .populate('pdfId', 'fileUrl')
      .populate('userId', 'fullName email')
      .exec();
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Update last viewed timestamp
    note.lastViewedAt = new Date();
    await note.save();
    
    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
      error: error.message
    });
  }
});

// Create a new note
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating note with request body:', req.body);
    const { title, content, pdfId, userId, pageNumber, tags } = req.body;
    
    // Validate required fields
    if (!title || !content || !pdfId || !userId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Title, content, pdfId, and userId are required'
      });
    }
    
    // Validate Firebase UID format
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      console.log('❌ Invalid Firebase UID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Create or update user if needed (auto-registration for Firebase users)
    console.log('👤 Ensuring user exists for Firebase UID:', userId);
    try {
      let user = await FirebaseUserService.getUserByUID(userId);
      if (!user) {
        console.log('🆕 User not found, creating from Firebase UID');
        // Create basic user record for Firebase UID
        user = await FirebaseUserService.createOrUpdateUser({
          uid: userId,
          email: `${userId}@firebase.temp`,
          displayName: 'Firebase User'
        });
      }
    } catch (userError) {
      console.error('❌ Error handling user:', userError);
      // Continue anyway, as the note creation might still work
    }
    
    console.log('🔍 Looking for PDF with ID:', pdfId);
    // Get PDF information
    const pdf = await PDF.findById(pdfId);
    if (!pdf) {
      console.log('❌ PDF not found');
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }
    
    console.log('✅ PDF found:', pdf.topic);
    
    // Create the note object
    const noteData = {
      title,
      content,
      pdfId,
      userId, // This is now a Firebase UID string
      pdfTitle: pdf.topic, // Store PDF title for reference
      pageNumber: pageNumber || undefined, // Store page number if provided
      tags: tags || []
    };
    
    console.log('📝 Creating note with data:', noteData);
    
    // Create the note
    const note = new Note(noteData);
    
    console.log('💾 Saving note...');
    await note.save();
    console.log('✅ Note saved successfully');
    
    // Return the note data
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        _id: note._id,
        title: note.title,
        content: note.content,
        pdfId: note.pdfId,
        userId: note.userId,
        pdfTitle: note.pdfTitle,
        pageNumber: note.pageNumber,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating note:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
});

// Update a note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, tags } = req.body;
    
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    
    await note.save();
    
    // Populate the response
    const populatedNote = await Note.findById(note._id)
      // Minimal population for performance
      .populate('userId', 'fullName email')
      .exec();
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      data: populatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
});

// Delete a note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    await Note.findByIdAndDelete(noteId);
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
});

// Get note statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await Note.aggregate([
      { $match: { userId } }, // Remove ObjectId casting since userId is now a string
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          avgContentLength: { $avg: { $strLenCP: '$content' } },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalNotes: 0,
      avgContentLength: 0,
      lastUpdated: null
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching note stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note statistics',
      error: error.message
    });
  }
});

module.exports = router;
