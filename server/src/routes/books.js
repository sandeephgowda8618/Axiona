const express = require('express');
const router = express.Router();
const { Book } = require('../models/Book');
const axios = require('axios');

// GET /api/books - Get all books with filtering and pagination
router.get('/', async (req, res) => {
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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = {};

    // Build search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    // Build sort query
    const sortOrder = order === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'title':
        sort = { title: sortOrder };
        break;
      case 'author':
        sort = { author: sortOrder };
        break;
      case 'rating':
        sort = { rating: -1, reviewCount: -1 };
        break;
      case 'downloads':
        sort = { downloadCount: -1 };
        break;
      case 'pages':
        sort = { pages: sortOrder };
        break;
      case 'year':
        sort = { year: -1 };
        break;
      case 'recent':
      default:
        sort = { addedDate: -1 };
        break;
    }

    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / parseInt(limit));

    res.json({
      success: true,
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBooks,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
});

// GET /api/books/:id - Get a specific book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
});

// GET /api/books/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Book.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/books/subjects/list - Get all subjects
router.get('/subjects/list', async (req, res) => {
  try {
    const subjects = await Book.distinct('subject');
    res.json({
      success: true,
      data: subjects.sort()
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// GET /api/books/stats/popular - Get popular books
router.get('/stats/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularBooks = await Book.find()
      .sort({ downloadCount: -1, rating: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: popularBooks
    });
  } catch (error) {
    console.error('Error fetching popular books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular books',
      error: error.message
    });
  }
});

// GET /api/books/stats/recent - Get recently added books
router.get('/stats/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentBooks = await Book.find()
      .sort({ addedDate: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: recentBooks
    });
  } catch (error) {
    console.error('Error fetching recent books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent books',
      error: error.message
    });
  }
});

// GET /api/books/stats/top-rated - Get top rated books
router.get('/stats/top-rated', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topRatedBooks = await Book.find({ reviewCount: { $gte: 5 } })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: topRatedBooks
    });
  } catch (error) {
    console.error('Error fetching top rated books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top rated books',
      error: error.message
    });
  }
});

// POST /api/books/:id/download - Increment download count
router.post('/:id/download', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await book.incrementDownloadCount();

    res.json({
      success: true,
      message: 'Download count updated',
      data: { downloadCount: book.downloadCount }
    });
  } catch (error) {
    console.error('Error updating download count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update download count',
      error: error.message
    });
  }
});

// GET /api/books/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await Book.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      },
      {
        $project: {
          title: 1,
          author: 1,
          category: 1,
          type: { $literal: 'book' }
        }
      },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions',
      error: error.message
    });
  }
});

// GET /api/books/category/:category - Get books by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let sort = {};

    switch (sortBy) {
      case 'rating':
        sort = { rating: -1, reviewCount: -1 };
        break;
      case 'downloads':
        sort = { downloadCount: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      default:
        sort = { addedDate: -1 };
    }

    const books = await Book.find({ 
      category: { $regex: category, $options: 'i' }
    })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalBooks = await Book.countDocuments({ 
      category: { $regex: category, $options: 'i' }
    });

    res.json({
      success: true,
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBooks / parseInt(limit)),
        totalBooks,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching books by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books by category',
      error: error.message
    });
  }
});

// GET /api/books/pdf-proxy/:bookId - Proxy PDF files from GitHub with proper CORS headers
router.get('/pdf-proxy/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Find the book to get the GitHub URL
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    if (!book.file_url || book.file_url === 'N/A') {
      return res.status(404).json({ success: false, message: 'PDF not available' });
    }
    
    // Stream the PDF from GitHub
    const response = await axios({
      method: 'GET',
      url: book.file_url,
      responseType: 'stream',
      timeout: 30000
    });
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Disposition', `inline; filename="${book.fileName || book.title}.pdf"`);
    
    // Pipe the PDF stream to response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('PDF proxy error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load PDF',
      error: error.message 
    });
  }
});

module.exports = router;
