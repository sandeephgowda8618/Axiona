const express = require('express');
const { StudyMaterial } = require('../models/StudyMaterial');

const router = express.Router();

// Get all study materials with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { approved: true, isActive: true };

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    if (req.query.class) {
      filter.class = req.query.class;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filter.tags = { $in: tags };
    }

    // Build sort query
    let sort = { uploadDate: -1 }; // Default: newest first

    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'popular':
          sort = { downloadCount: -1 };
          break;
        case 'title':
          sort = { title: 1 };
          break;
        case 'recent':
          sort = { uploadDate: -1 };
          break;
        case 'oldest':
          sort = { uploadDate: 1 };
          break;
      }
    }

    const materials = await StudyMaterial.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .select('-__v');

    const total = await StudyMaterial.countDocuments(filter);

    res.json({
      materials,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching study materials:', error);
    res.status(500).json({ error: 'Failed to fetch study materials' });
  }
});

// Get study material by ID
router.get('/:id', async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .select('-__v');

    if (!material || !material.approved || !material.isActive) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    return res.json(material);
  } catch (error) {
    console.error('Error fetching study material:', error);
    return res.status(500).json({ error: 'Failed to fetch study material' });
  }
});

// Download study material (increment download count)
router.post('/:id/download', async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material || !material.approved || !material.isActive) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    await material.incrementDownloadCount();

    return res.json({
      message: 'Download count updated',
      downloadUrl: material.downloadUrl,
      downloadCount: material.downloadCount
    });
  } catch (error) {
    console.error('Error processing download:', error);
    return res.status(500).json({ error: 'Failed to process download' });
  }
});

// Get subjects
router.get('/meta/subjects', async (req, res) => {
  try {
    const subjects = await StudyMaterial.distinct('subject', { approved: true, isActive: true });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get classes
router.get('/meta/classes', async (req, res) => {
  try {
    const classes = await StudyMaterial.distinct('class', { approved: true, isActive: true });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await StudyMaterial.distinct('category', { approved: true, isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get popular materials
router.get('/stats/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const materials = await StudyMaterial.find({ approved: true, isActive: true })
      .sort({ downloadCount: -1 })
      .limit(limit)
      .populate('uploadedBy', 'name')
      .select('title subject class downloadCount thumbnail');

    res.json(materials);
  } catch (error) {
    console.error('Error fetching popular materials:', error);
    res.status(500).json({ error: 'Failed to fetch popular materials' });
  }
});

// Get recent materials
router.get('/stats/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const materials = await StudyMaterial.find({ approved: true, isActive: true })
      .sort({ uploadDate: -1 })
      .limit(limit)
      .populate('uploadedBy', 'name')
      .select('title subject class uploadDate thumbnail');

    res.json(materials);
  } catch (error) {
    console.error('Error fetching recent materials:', error);
    res.status(500).json({ error: 'Failed to fetch recent materials' });
  }
});

// Create new study material (authenticated users only)
router.post('/', async (req, res) => {
  try {
    // In production, you'd validate user authentication here
    const userId = req.body.userId || '507f1f77bcf86cd799439011'; // Mock user ID
    
    const materialData = {
      ...req.body,
      uploadedBy: userId,
      approved: false // New materials need approval
    };

    const material = new StudyMaterial(materialData);
    await material.save();

    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating study material:', error);
    res.status(500).json({ error: 'Failed to create study material' });
  }
});

// Update study material (admin or uploader only)
router.put('/:id', async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    Object.assign(material, req.body);
    await material.save();

    return res.json(material);
  } catch (error) {
    console.error('Error updating study material:', error);
    return res.status(500).json({ error: 'Failed to update study material' });
  }
});

// Delete study material (admin or uploader only)
router.delete('/:id', async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    await material.deactivate();

    return res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Error deleting study material:', error);
    return res.status(500).json({ error: 'Failed to delete study material' });
  }
});

// Get StudyPES materials organized by subject and unit
router.get('/studypes/subjects', async (req, res) => {
  try {
    console.log('📚 Fetching StudyPES materials from MongoDB...');
    
    // Query for StudyPES materials from the books collection
    const db = require('mongoose').connection.db;
    const booksCollection = db.collection('books');
    
    // Find StudyPES materials using multiple criteria
    const studypesFilter = {
      $or: [
        { source: { $regex: 'StudyPES', $options: 'i' } },
        { category: { $regex: 'StudyPES', $options: 'i' } },
        { type: { $regex: 'StudyPES', $options: 'i' } },
        { title: { $regex: 'StudyPES', $options: 'i' } },
        { fileName: { $regex: 'StudyPES', $options: 'i' } }
      ]
    };
    
    const books = await booksCollection.find(studypesFilter).toArray();
    console.log(`📊 Found ${books.length} StudyPES materials in MongoDB`);
    
    if (books.length === 0) {
      return res.json({
        subjects: {},
        totalSubjects: 0,
        totalMaterials: 0,
        success: true,
        message: 'No StudyPES materials found in MongoDB'
      });
    }
    
    // Organize by subject and unit
    const subjectsData = {};
    
    books.forEach(book => {
      // Extract subject and unit
      const subject = extractSubject(book);
      const unit = extractUnit(book);
      
      if (!subjectsData[subject]) {
        subjectsData[subject] = {};
      }
      
      if (!subjectsData[subject][unit]) {
        subjectsData[subject][unit] = [];
      }
      
      // Add material info
      const materialInfo = {
        id: book._id.toString(),
        title: book.title || 'Untitled',
        description: book.description || '',
        url: book.url || '',
        pdfUrl: book.pdfUrl || book.url || '',
        fileSize: book.fileSize || 'N/A',
        pages: book.pages || 0,
        author: book.author || 'Unknown',
        semester: book.semester || 0,
        year: book.year || '',
        type: book.type || 'PDF',
        difficulty: book.difficulty || 'Medium'
      };
      
      subjectsData[subject][unit].push(materialInfo);
    });
    
    // Sort materials within each unit
    Object.keys(subjectsData).forEach(subject => {
      Object.keys(subjectsData[subject]).forEach(unit => {
        subjectsData[subject][unit].sort((a, b) => a.title.localeCompare(b.title));
      });
    });
    
    // Format response
    const formattedSubjects = {};
    let totalMaterials = 0;
    
    Object.keys(subjectsData).forEach(subjectName => {
      const units = subjectsData[subjectName];
      const subjectMaterialCount = Object.values(units).reduce((sum, materials) => sum + materials.length, 0);
      totalMaterials += subjectMaterialCount;
      
      formattedSubjects[subjectName] = {
        name: subjectName,
        units: units,
        totalMaterials: subjectMaterialCount
      };
    });
    
    console.log(`✅ Organized ${Object.keys(formattedSubjects).length} subjects with ${totalMaterials} total materials`);
    
    res.json({
      subjects: formattedSubjects,
      totalSubjects: Object.keys(formattedSubjects).length,
      totalMaterials: totalMaterials,
      success: true,
      message: `Retrieved ${Object.keys(formattedSubjects).length} subjects with ${totalMaterials} materials`
    });
    
  } catch (error) {
    console.error('❌ Error fetching StudyPES subjects:', error);
    res.status(500).json({ 
      subjects: {},
      totalSubjects: 0,
      totalMaterials: 0,
      success: false,
      error: 'Failed to fetch StudyPES materials from MongoDB',
      message: error.message 
    });
  }
});

// Helper function to extract subject from book metadata
function extractSubject(book) {
  // Try different fields that might contain subject info
  const subjectFields = ['subject', 'category', 'course', 'domain'];
  
  for (const field of subjectFields) {
    if (book[field] && book[field].trim()) {
      return book[field].trim();
    }
  }
  
  // Try to extract from title or description
  const title = (book.title || '').toLowerCase();
  const description = (book.description || '').toLowerCase();
  
  // Common subject patterns
  const subjectPatterns = {
    'data structures': 'Data Structures & Algorithms',
    'algorithms': 'Data Structures & Algorithms',
    'database': 'Database Management Systems',
    'networks': 'Computer Networks',
    'operating system': 'Operating Systems',
    'software engineering': 'Software Engineering',
    'machine learning': 'Machine Learning',
    'web technology': 'Web Technology',
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'electronics': 'Electronics',
    'mechanical': 'Mechanical Engineering'
  };
  
  for (const [pattern, subject] of Object.entries(subjectPatterns)) {
    if (title.includes(pattern) || description.includes(pattern)) {
      return subject;
    }
  }
  
  return 'General';
}

// Helper function to extract unit from book metadata
function extractUnit(book) {
  // Try different fields that might contain unit info
  const unitFields = ['unit', 'chapter', 'module', 'section'];
  
  for (const field of unitFields) {
    if (book[field] && book[field].toString().trim()) {
      return `Unit ${book[field].toString().trim()}`;
    }
  }
  
  // Try to extract from title
  const title = book.title || '';
  
  // Look for unit patterns in title
  const unitPatterns = [
    /unit\s*(\d+)/i,
    /chapter\s*(\d+)/i,
    /module\s*(\d+)/i,
    /part\s*(\d+)/i
  ];
  
  for (const pattern of unitPatterns) {
    const match = title.match(pattern);
    if (match) {
      return `Unit ${match[1]}`;
    }
  }
  
  // Default unit based on semester or other criteria
  if (book.semester) {
    return `Semester ${book.semester}`;
  }
  
  return 'General Materials';
}

module.exports = router;
