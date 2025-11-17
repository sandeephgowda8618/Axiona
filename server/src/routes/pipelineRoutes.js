const express = require('express');
const router = express.Router();
const pipelineDatabase = require('../services/pipelineDatabase');
const pipelineService = require('../services/pipelineService');

// ===== STUDYPES MATERIALS ENDPOINTS =====

// Get all StudyPES subjects with materials grouped by units (using pipeline DB)
router.get('/studypes/subjects', async (req, res) => {
  try {
    console.log('🔄 Fetching StudyPES subjects from pipeline database...');
    
    const materials = await pipelineDatabase.getStudyPESMaterials();
    
    if (materials.length === 0) {
      return res.json({ success: true, subjects: {} });
    }
    
    // Group materials by subject and unit
    const subjectsData = {};
    
    materials.forEach(material => {
      const subject = material.subject || 'Unknown Subject';
      const unit = material.unit ? `Unit ${material.unit}` : 'General';
      
      if (!subjectsData[subject]) {
        subjectsData[subject] = {
          name: subject,
          units: {},
          totalMaterials: 0
        };
      }
      
      if (!subjectsData[subject].units[unit]) {
        subjectsData[subject].units[unit] = [];
      }
      
      // Transform material for frontend compatibility
      const transformedMaterial = {
        id: material._id.toString(),
        title: material.title || 'Untitled',
        description: material.description || '',
        url: material.gridfs_id ? `/api/pipeline/files/${material.gridfs_id}` : null,
        pdfUrl: material.gridfs_id ? `/api/pipeline/files/${material.gridfs_id}` : null,
        gridFSFileId: material.gridfs_id ? material.gridfs_id.toString() : null,
        fileSize: material.file_size ? material.file_size.toString() : '0',
        pages: material.pages || 0,
        author: material.author || 'StudyPES Materials',
        semester: material.semester || null,
        year: material.publication_year ? material.publication_year.toString() : '2024',
        type: material.file_type || 'Document',
        difficulty: material.level || 'Intermediate',
        subject: material.subject || '',
        unit: material.unit ? material.unit.toString() : null,
        fileName: material.fileName || ''
      };
      
      subjectsData[subject].units[unit].push(transformedMaterial);
      subjectsData[subject].totalMaterials++;
    });
    
    console.log(`📚 Pipeline StudyPES API: Returning ${Object.keys(subjectsData).length} subjects with ${materials.length} total materials`);
    
    res.json({
      success: true,
      subjects: subjectsData
    });
    
  } catch (error) {
    console.error('❌ Error fetching StudyPES subjects from pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch StudyPES subjects',
      message: error.message 
    });
  }
});

// Get materials for a specific subject
router.get('/studypes/subjects/:subjectName', async (req, res) => {
  try {
    const { subjectName } = req.params;
    console.log(`🔄 Fetching materials for subject: ${subjectName}`);
    
    const materials = await pipelineDatabase.getStudyPESMaterialsBySubject(decodeURIComponent(subjectName));
    
    // Group by unit and transform for frontend
    const unitsData = {};
    materials.forEach(material => {
      const unit = material.unit ? `Unit ${material.unit}` : 'General';
      
      if (!unitsData[unit]) {
        unitsData[unit] = [];
      }
      
      const transformedMaterial = {
        id: material._id.toString(),
        title: material.title || 'Untitled',
        description: material.description || '',
        url: material.gridfs_id ? `/api/pipeline/files/${material.gridfs_id}` : null,
        pdfUrl: material.gridfs_id ? `/api/pipeline/files/${material.gridfs_id}` : null,
        gridFSFileId: material.gridfs_id ? material.gridfs_id.toString() : null,
        fileSize: material.file_size ? material.file_size.toString() : '0',
        pages: material.pages || 0,
        author: material.author || 'StudyPES Materials',
        semester: material.semester || null,
        year: material.publication_year ? material.publication_year.toString() : '2024',
        type: material.file_type || 'Document',
        difficulty: material.level || 'Intermediate',
        subject: material.subject || '',
        unit: material.unit ? material.unit.toString() : null,
        fileName: material.fileName || ''
      };
      
      unitsData[unit].push(transformedMaterial);
    });
    
    res.json({
      success: true,
      subject: decodeURIComponent(subjectName),
      units: unitsData,
      totalMaterials: materials.length
    });
    
  } catch (error) {
    console.error(`❌ Error fetching materials for subject ${req.params.subjectName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subject materials',
      message: error.message 
    });
  }
});

// ===== REFERENCE BOOKS ENDPOINTS =====

// Get all reference books with filtering and pagination
router.get('/books', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      subject,
      author,
      sortBy = 'recent',
      order = 'desc'
    } = req.query;
    
    console.log('🔄 Fetching reference books from pipeline database...');
    
    // Build filter object
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (category) {
      filters.category = category;
    }
    if (subject) {
      filters.subject = subject;
    }
    if (author) {
      filters.author = author;
    }
    
    // Get books with pagination
    const result = await pipelineDatabase.getReferenceBooks(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      order
    });
    
    // Transform books for frontend compatibility
    const transformedBooks = result.books.map(book => ({
      _id: book._id.toString(),
      title: book.title || 'Untitled',
      author: book.author || 'Unknown Author',
      description: book.description || '',
      category: book.category || 'General',
      subject: book.subject || '',
      isbn: book.isbn || '',
      year: book.publication_year || new Date().getFullYear(),
      pages: book.pages || 0,
      language: book.language || 'English',
      rating: book.rating || 0,
      reviewCount: book.review_count || 0,
      downloadCount: book.download_count || 0,
      tags: book.tags || [],
      pdfUrl: book.gridfs_id 
        ? `/api/pipeline/files/${book.gridfs_id}` 
        : (book.github_url || book.file_url),
      gridFSFileId: book.gridfs_id ? book.gridfs_id.toString() : null,
      fileSize: book.file_size ? book.file_size.toString() : '0',
      addedDate: book.created_at || new Date(),
      fileName: book.fileName || ''
    }));
    
    console.log(`📖 Pipeline Books API: Returning ${transformedBooks.length} books (page ${page})`);
    
    res.json({
      success: true,
      data: transformedBooks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: result.totalPages,
        totalBooks: result.totalBooks,
        limit: parseInt(limit),
        hasNext: parseInt(page) < result.totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching reference books from pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
});

// Get a specific book by ID
router.get('/books/:id', async (req, res) => {
  try {
    const book = await pipelineDatabase.getReferenceBookById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Transform book for frontend compatibility
    const transformedBook = {
      _id: book._id.toString(),
      title: book.title || 'Untitled',
      author: book.author || 'Unknown Author',
      description: book.description || '',
      category: book.category || 'General',
      subject: book.subject || '',
      isbn: book.isbn || '',
      year: book.publication_year || new Date().getFullYear(),
      pages: book.pages || 0,
      language: book.language || 'English',
      rating: book.rating || 0,
      reviewCount: book.review_count || 0,
      downloadCount: book.download_count || 0,
      tags: book.tags || [],
      pdfUrl: book.gridfs_id 
        ? `/api/pipeline/files/${book.gridfs_id}` 
        : (book.github_url || book.file_url),
      gridFSFileId: book.gridfs_id ? book.gridfs_id.toString() : null,
      fileSize: book.file_size ? book.file_size.toString() : '0',
      addedDate: book.created_at || new Date(),
      fileName: book.fileName || ''
    };
    
    res.json({
      success: true,
      data: transformedBook
    });
    
  } catch (error) {
    console.error('❌ Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
});

// Get all book categories
router.get('/books/categories/list', async (req, res) => {
  try {
    const categories = await pipelineDatabase.getBookCategories();
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('❌ Error fetching book categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get all book subjects
router.get('/books/subjects/list', async (req, res) => {
  try {
    const subjects = await pipelineDatabase.getBookSubjects();
    res.json({
      success: true,
      data: subjects.sort()
    });
  } catch (error) {
    console.error('❌ Error fetching book subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// ===== PDF FILE STREAMING ENDPOINT =====

// Serve PDF files from GridFS
router.get('/files/:gridfsId', async (req, res) => {
  try {
    const { gridfsId } = req.params;
    console.log(`🔄 Serving file from GridFS: ${gridfsId}`);
    
    // Get file metadata first
    const metadata = await pipelineDatabase.getPDFMetadata(gridfsId);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    console.log(`📄 Serving PDF: ${metadata.filename} (${metadata.length} bytes)`);
    
    // Set comprehensive headers for PDF streaming
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': metadata.length.toString(),
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    // Handle range requests for efficient PDF loading
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : metadata.length - 1;
      const chunkSize = (end - start) + 1;
      
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${metadata.length}`,
        'Content-Length': chunkSize.toString()
      });
    }
    
    const stream = await pipelineDatabase.getFileStream(gridfsId);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'File stream not available'
      });
    }
    
    // Handle stream errors
    stream.on('error', (error) => {
      console.error('❌ GridFS stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });
    
    // Pipe the GridFS stream to response
    stream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error serving file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to serve file',
        error: error.message
      });
    }
  }
});

// ===== ROADMAP AND INTERVIEW ENDPOINTS =====

// Generate dynamic interview questions based on domain and experience level
router.post('/generate-interview-questions', async (req, res) => {
  try {
    const { domain, experience_level } = req.body;
    
    if (!domain || !experience_level) {
      return res.status(400).json({
        success: false,
        message: 'Domain and experience level are required',
        error: 'Missing required parameters'
      });
    }
    
    console.log(`🔄 Generating interview questions for: ${domain} (${experience_level})`);
    
    const questions = await pipelineService.generateInterviewQuestions(domain, experience_level);
    
    res.json({
      success: true,
      questions: questions,
      domain: domain,
      experience_level: experience_level,
      total_questions: questions.length
    });
    
  } catch (error) {
    console.error('❌ Error generating interview questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: error.message,
      questions: []
    });
  }
});

// Generate interview questions based on domain and experience level
router.post('/generate-interview-questions', async (req, res) => {
  try {
    const { domain, experience_level } = req.body;
    
    console.log(`🎯 Generating interview questions for: ${domain} (${experience_level})`);
    
    if (!domain || !experience_level) {
      return res.status(400).json({
        success: false,
        message: 'Domain and experience level are required'
      });
    }
    
    const questions = await pipelineService.generateInterviewQuestions(domain, experience_level);
    
    res.json({
      success: true,
      data: questions
    });
    
  } catch (error) {
    console.error('❌ Error generating interview questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: error.message
    });
  }
});

// Get interview questions for roadmap generation (legacy endpoint)
router.get('/roadmap/questions', async (req, res) => {
  try {
    console.log('🔄 Fetching interview questions from pipeline...');
    
    const questions = await pipelineService.getInterviewQuestions();
    
    res.json({
      success: true,
      data: questions
    });
    
  } catch (error) {
    console.error('❌ Error fetching interview questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview questions',
      error: error.message
    });
  }
});

// Generate roadmap based on user answers
router.post('/roadmap/generate', async (req, res) => {
  try {
    const { userId, userAnswers, domain, experience_level } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log(`🔄 Generating roadmap for user: ${userId}`);
    console.log(`📝 Domain: ${domain}, Experience: ${experience_level}`);
    console.log(`📊 User answers:`, userAnswers);
    
    // Use the enhanced generateRoadmapFromAnswers function
    const roadmap = await pipelineService.generateRoadmapFromAnswers(
      userId,
      userAnswers || [], 
      domain,
      experience_level
    );
    
    res.json({
      success: true,
      data: roadmap,
      message: 'Roadmap generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error generating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap',
      error: error.message
    });
  }
});

// Get user's roadmap
router.get('/roadmap/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 Fetching roadmap for user: ${userId}`);
    
    const roadmap = await pipelineService.getUserRoadmap(userId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No roadmap found for this user'
      });
    }
    
    res.json({
      success: true,
      data: roadmap
    });
    
  } catch (error) {
    console.error('❌ Error fetching user roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap',
      error: error.message
    });
  }
});

// Update roadmap progress
router.put('/roadmap/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { progress } = req.body;
    
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'Progress data is required'
      });
    }
    
    console.log(`🔄 Updating roadmap progress for user: ${userId}`);
    
    const updatedRoadmap = await pipelineService.updateRoadmapProgress(userId, progress);
    
    res.json({
      success: true,
      data: updatedRoadmap,
      message: 'Progress updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating roadmap progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
});

// ===== HEALTH AND STATUS ENDPOINTS =====

// Pipeline health check
router.get('/health', async (req, res) => {
  try {
    const health = await pipelineService.getStatus();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking pipeline health:', error);
    res.status(500).json({
      success: false,
      message: 'Pipeline health check failed',
      error: error.message
    });
  }
});

// Database status
router.get('/database/status', async (req, res) => {
  try {
    const status = await pipelineDatabase.getDatabaseStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking database status:', error);
    res.status(500).json({
      success: false,
      message: 'Database status check failed',
      error: error.message
    });
  }
});

// ===== NOTES ENDPOINTS =====

// Get notes for a user
router.get('/notes/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      context, // 'pes_material', 'workspace', 'general'
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`📋 Fetching notes for user: ${userId}, context: ${context || 'all'}`);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      context,
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    const result = await pipelineDatabase.getNotesByUserId(userId, options);
    
    console.log(`✅ Found ${result.notes.length} notes for user ${userId}`);
    
    res.json({
      success: true,
      data: result.notes,
      pagination: result.pagination
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

// Create a new note
router.post('/notes', async (req, res) => {
  try {
    const {
      userId,
      title,
      content,
      context = 'general', // 'pes_material', 'workspace', 'general'
      referenceId = null, // ID of PES material, PDF, etc.
      referenceType = null, // 'pes_material', 'pdf', 'document'
      referenceTitle = null,
      pageNumber = null,
      tags = []
    } = req.body;

    // Validation
    if (!userId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, title, content'
      });
    }

    const noteData = {
      userId,
      title: title.trim(),
      content: content.trim(),
      context,
      referenceId,
      referenceType,
      referenceTitle,
      pageNumber,
      tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : []
    };

    console.log(`📝 Creating note for user ${userId}: ${title}`);

    const noteId = await pipelineDatabase.saveNote(noteData);
    
    const savedNote = await pipelineDatabase.getNoteById(noteId);

    res.status(201).json({
      success: true,
      data: savedNote,
      message: 'Note created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
});

// Update a note
router.put('/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const {
      title,
      content,
      tags,
      pageNumber
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [];
    if (pageNumber !== undefined) updateData.pageNumber = pageNumber;

    console.log(`✏️ Updating note ${noteId}`);

    const updated = await pipelineDatabase.updateNote(noteId, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const updatedNote = await pipelineDatabase.getNoteById(noteId);

    res.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
});

// Delete a note
router.delete('/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;

    console.log(`🗑️ Deleting note ${noteId}`);

    const deleted = await pipelineDatabase.deleteNote(noteId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
});

// Get notes for a specific reference (PES material, PDF, etc.)
router.get('/notes/reference/:referenceType/:referenceId', async (req, res) => {
  try {
    const { referenceType, referenceId } = req.params;
    const { userId } = req.query;

    console.log(`📋 Fetching notes for ${referenceType}: ${referenceId}`);

    const notes = await pipelineDatabase.getNotesByReference(referenceId, referenceType, userId);

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('❌ Error fetching reference notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

// Get user notes statistics
router.get('/notes/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 Fetching notes stats for user: ${userId}`);

    const stats = await pipelineDatabase.getNotesStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching notes stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes statistics',
      error: error.message
    });
  }
});

// ===== RAG CHAT ENDPOINTS =====

// RAG-based chat for workspace - answers questions about specific PDFs
router.post('/workspace/chat', async (req, res) => {
  try {
    const { 
      question, 
      pdfId, 
      currentPage, 
      context 
    } = req.body;

    console.log('🤖 RAG Chat Request:', { question, pdfId, currentPage, context });

    // Validate required fields
    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Call RAG service through pipeline integration
    const chatResponse = await pipelineService.generateRAGResponse(
      question,
      pdfId,
      currentPage,
      context
    );

    res.json({
      success: true,
      data: {
        response: chatResponse.answer,
        context: chatResponse.context || context,
        sources: chatResponse.sources || [],
        relevantPage: chatResponse.relevantPage || currentPage,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in RAG chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
    });
  }
});

// Get conversation history for a specific PDF context
router.get('/workspace/chat/history/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { userId } = req.query;

    console.log('📚 Fetching chat history for PDF:', pdfId);

    const history = await pipelineDatabase.getChatHistory(pdfId, userId);
    
    res.json({
      success: true,
      data: history || []
    });

  } catch (error) {
    console.error('❌ Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// Save chat conversation to database
router.post('/workspace/chat/save', async (req, res) => {
  try {
    const { 
      pdfId, 
      userId, 
      question, 
      answer, 
      currentPage, 
      context 
    } = req.body;

    console.log('💾 Saving chat conversation for PDF:', pdfId);

    const savedChat = await pipelineDatabase.saveChatHistory({
      pdfId,
      userId,
      question,
      answer,
      currentPage,
      context,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: savedChat
    });

  } catch (error) {
    console.error('❌ Error saving chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save chat history',
      error: error.message
    });
  }
});

// ===== SAVED MATERIALS ENDPOINTS =====

// Save a material (PES or reference book)
router.post('/saved-materials', async (req, res) => {
  try {
    const {
      userId,
      materialId,
      materialType,
      title,
      subject,
      unit,
      fileName,
      gridFSFileId,
      description,
      author,
      pages
    } = req.body;

    console.log('💾 Saving material for user:', userId, 'Material:', title);

    if (!userId || !materialId || !materialType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, materialId, materialType, title'
      });
    }

    const savedMaterial = await pipelineDatabase.saveMaterial({
      userId,
      materialId,
      materialType, // 'pes_material' or 'reference_book'
      title,
      subject,
      unit,
      fileName,
      gridFSFileId,
      description,
      author,
      pages,
      savedAt: new Date()
    });

    res.json({
      success: true,
      data: savedMaterial,
      message: 'Material saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save material',
      error: error.message
    });
  }
});

// Remove saved material
router.delete('/saved-materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const { userId } = req.query;

    console.log('🗑️ Removing saved material:', materialId, 'for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId parameter'
      });
    }

    await pipelineDatabase.unsaveMaterial(materialId, userId);

    res.json({
      success: true,
      message: 'Material removed from saved files'
    });

  } catch (error) {
    console.error('❌ Error removing saved material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved material',
      error: error.message
    });
  }
});

// Get saved materials for a user
router.get('/saved-materials/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, materialType } = req.query;

    console.log('📋 Fetching saved materials for user:', userId);

    const savedMaterials = await pipelineDatabase.getSavedMaterials(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      materialType
    });

    res.json({
      success: true,
      data: savedMaterials,
      message: `Found ${savedMaterials.length} saved materials`
    });

  } catch (error) {
    console.error('❌ Error fetching saved materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved materials',
      error: error.message
    });
  }
});

// ===== EXISTING ENDPOINTS =====

module.exports = router;
