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

// Get interview questions for roadmap generation
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
    const { userId, userAnswers } = req.body;
    
    if (!userId || !userAnswers) {
      return res.status(400).json({
        success: false,
        message: 'User ID and answers are required'
      });
    }
    
    console.log(`🔄 Generating roadmap for user: ${userId}`);
    
    const roadmap = await pipelineService.generateRoadmapFromAnswers(userId, userAnswers);
    
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

module.exports = router;
