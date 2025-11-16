const express = require('express');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const router = express.Router();

// MongoDB connection for direct access (since we need GridFS)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/axiona';

// Helper function to get database connection
async function getDBConnection() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db('axiona') };
}

// Get all StudyPES subjects with materials grouped by units
router.get('/subjects', async (req, res) => {
  let client;
  try {
    const { client: dbClient, db } = await getDBConnection();
    client = dbClient;
    
    const materialsCollection = db.collection('studypes_materials');
    
    // Get all materials
    const allMaterials = await materialsCollection.find({ source: 'StudyPES' }).toArray();
    
    if (allMaterials.length === 0) {
      return res.json({ success: true, subjects: {} });
    }
    
    // Group materials by subject and unit
    const subjectsData = {};
    
    allMaterials.forEach(material => {
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
      
      // Transform material for frontend
      const transformedMaterial = {
        id: material._id.toString(),
        title: material.title || 'Untitled',
        description: material.description || '',
        url: material.gridfs_id ? `/api/files/${material.gridfs_id}` : null,
        pdfUrl: material.gridfs_id ? `/api/files/${material.gridfs_id}` : null,
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
    
    console.log(`📚 StudyPES API: Returning ${Object.keys(subjectsData).length} subjects with ${allMaterials.length} total materials`);
    
    res.json({
      success: true,
      subjects: subjectsData
    });
    
  } catch (error) {
    console.error('❌ Error fetching StudyPES subjects:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch StudyPES subjects',
      message: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get materials for a specific subject
router.get('/studypes/subjects/:subjectName', async (req, res) => {
  let client;
  try {
    const { subjectName } = req.params;
    const { client: dbClient, db } = await getDBConnection();
    client = dbClient;
    
    const materialsCollection = db.collection('studypes_materials');
    
    // Get materials for the specific subject
    const materials = await materialsCollection.find({ 
      source: 'StudyPES',
      subject: subjectName 
    }).toArray();
    
    // Transform materials
    const transformedMaterials = materials.map(material => ({
      id: material._id.toString(),
      title: material.title || 'Untitled',
      description: material.description || '',
      url: material.gridfs_id ? `/api/files/${material.gridfs_id}` : null,
      pdfUrl: material.gridfs_id ? `/api/files/${material.gridfs_id}` : null,
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
    }));
    
    res.json({
      success: true,
      subject: subjectName,
      materials: transformedMaterials,
      totalMaterials: transformedMaterials.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching subject materials:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subject materials',
      message: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Serve files from GridFS
router.get('/files/:fileId', async (req, res) => {
  let client;
  try {
    const { fileId } = req.params;
    const { client: dbClient, db } = await getDBConnection();
    client = dbClient;
    
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Get file info
    const fileInfo = await bucket.find({ _id: new ObjectId(fileId) }).next();
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': getContentType(fileInfo.filename),
      'Content-Length': fileInfo.length,
      'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
    // Stream file to response
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      console.error('❌ GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error serving file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve file' });
    }
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Download file (force download instead of inline view)
router.get('/files/:fileId/download', async (req, res) => {
  let client;
  try {
    const { fileId } = req.params;
    const { client: dbClient, db } = await getDBConnection();
    client = dbClient;
    
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Get file info
    const fileInfo = await bucket.find({ _id: new ObjectId(fileId) }).next();
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set headers for download
    res.set({
      'Content-Type': getContentType(fileInfo.filename),
      'Content-Length': fileInfo.length,
      'Content-Disposition': `attachment; filename="${fileInfo.filename}"`
    });
    
    // Stream file to response
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      console.error('❌ GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
    
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get file metadata
router.get('/files/:fileId/info', async (req, res) => {
  let client;
  try {
    const { fileId } = req.params;
    const { client: dbClient, db } = await getDBConnection();
    client = dbClient;
    
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Get file info
    const fileInfo = await bucket.find({ _id: new ObjectId(fileId) }).next();
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Also get material metadata
    const materialsCollection = db.collection('studypes_materials');
    const material = await materialsCollection.findOne({ gridfs_id: new ObjectId(fileId) });
    
    res.json({
      success: true,
      file: {
        id: fileInfo._id.toString(),
        filename: fileInfo.filename,
        length: fileInfo.length,
        uploadDate: fileInfo.uploadDate,
        contentType: getContentType(fileInfo.filename),
        metadata: fileInfo.metadata
      },
      material: material ? {
        title: material.title,
        subject: material.subject,
        unit: material.unit,
        pages: material.pages,
        file_type: material.file_type
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error getting file info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get file info',
      message: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Helper function to determine content type
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const contentTypes = {
    'pdf': 'application/pdf',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pps': 'application/vnd.ms-powerpoint',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'json': 'application/json'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

module.exports = router;
