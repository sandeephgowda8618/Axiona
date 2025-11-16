const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

class PipelineDatabaseService {
  constructor() {
    // Pipeline database URI - connects to the educational content database with GridFS files
    this.pipelineURI = process.env.PIPELINE_MONGODB_URI || 'mongodb://localhost:27017/educational_content';
    this.client = null;
    this.db = null;
    this.gridFSBucket = null;
  }

  async connect() {
    try {
      if (!this.client) {
        this.client = new MongoClient(this.pipelineURI);
        await this.client.connect();
        this.db = this.client.db('educational_content');
        
        // Initialize GridFS bucket for PDF serving
        this.gridFSBucket = new GridFSBucket(this.db, {
          bucketName: 'fs' // Default GridFS bucket name
        });
        
        console.log('✅ Connected to Pipeline Database (educational_content)');
      }
      return true;
    } catch (error) {
      console.error('❌ Pipeline Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.gridFSBucket = null;
      console.log('Pipeline Database disconnected');
    }
  }

  async healthCheck() {
    try {
      await this.connect();
      
      const pesCount = await this.db.collection('pes_materials').countDocuments();
      const booksCount = await this.db.collection('reference_books').countDocuments();
      const roadmapsCount = await this.db.collection('roadmaps').countDocuments();
      
      return {
        status: 'healthy',
        collections: {
          pes_materials: pesCount,
          reference_books: booksCount,
          roadmaps: roadmapsCount
        },
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  // PES Materials Methods
  async getAllPESMaterials(filters = {}) {
    await this.connect();
    
    const query = {};
    
    // Apply filters
    if (filters.subject) {
      query.subject = { $regex: filters.subject, $options: 'i' };
    }
    
    if (filters.unit) {
      query.unit = filters.unit;
    }
    
    const materials = await this.db.collection('pes_materials').find(query).toArray();
    return materials;
  }

  async getPESMaterialsBySubjectAndUnit(subject, unit = null) {
    await this.connect();
    
    const query = {
      subject: { $regex: `^${subject}$`, $options: 'i' }
    };
    
    if (unit !== null) {
      query.unit = { $in: [unit, String(unit)] };
    }
    
    const materials = await this.db.collection('pes_materials').find(query).toArray();
    
    // Enhance with standardized metadata
    return materials.map(material => ({
      ...material,
      content_type: 'pes_material',
      source: 'PES_slides',
      relevance_score: material.relevance_score || 0.9,
      semantic_score: material.semantic_score || 0.85,
      snippet: material.snippet || (material.summary || material.content || '').substring(0, 200) + '...'
    }));
  }

  async getPESSubjectsSummary() {
    await this.connect();
    
    const pipeline = [
      {
        $group: {
          _id: '$subject',
          materialCount: { $sum: 1 },
          units: { $addToSet: '$unit' },
          lastUpdated: { $max: '$created_at' }
        }
      },
      {
        $project: {
          subject: '$_id',
          materialCount: 1,
          unitCount: { $size: '$units' },
          units: 1,
          lastUpdated: 1
        }
      },
      { $sort: { materialCount: -1 } }
    ];
    
    return await this.db.collection('pes_materials').aggregate(pipeline).toArray();
  }

  // Reference Books Methods
  async getAllReferenceBooks(filters = {}) {
    await this.connect();
    
    const query = {};
    
    // Apply filters
    if (filters.subject) {
      query.$or = [
        { title: { $regex: filters.subject, $options: 'i' } },
        { summary: { $regex: filters.subject, $options: 'i' } },
        { key_concepts: { $regex: filters.subject, $options: 'i' } }
      ];
    }
    
    if (filters.difficulty) {
      query.difficulty = { $regex: filters.difficulty, $options: 'i' };
    }
    
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { authors: { $regex: filters.search, $options: 'i' } },
        { summary: { $regex: filters.search, $options: 'i' } },
        { key_concepts: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const books = await this.db.collection('reference_books').find(query).toArray();
    
    // Enhance with standardized metadata
    return books.map(book => ({
      ...book,
      content_type: 'reference_book',
      source: 'reference_books',
      relevance_score: book.relevance_score || 0.88,
      semantic_score: book.semantic_score || 0.85,
      snippet: book.snippet || (book.summary || '').substring(0, 200) + '...'
    }));
  }

  async getReferenceBooksBySubjectAndDifficulty(subject, difficulty = null) {
    await this.connect();
    
    const query = {
      $or: [
        { title: { $regex: subject, $options: 'i' } },
        { summary: { $regex: subject, $options: 'i' } },
        { key_concepts: { $regex: subject, $options: 'i' } }
      ]
    };
    
    if (difficulty) {
      query.difficulty = { $regex: `^${difficulty}$`, $options: 'i' };
    }
    
    const books = await this.db.collection('reference_books').find(query).limit(5).toArray();
    return books.map(book => ({
      ...book,
      content_type: 'reference_book',
      source: 'reference_books',
      relevance_score: book.relevance_score || 0.88
    }));
  }

  // GridFS PDF Methods
  async getPDFStream(gridfsId) {
    await this.connect();
    
    try {
      const objectId = new ObjectId(gridfsId);
      const downloadStream = this.gridFSBucket.openDownloadStream(objectId);
      
      return new Promise((resolve, reject) => {
        downloadStream.on('error', (error) => {
          reject(new Error(`GridFS file not found: ${error.message}`));
        });
        
        // Return the stream for piping to response
        resolve(downloadStream);
      });
    } catch (error) {
      throw new Error(`Invalid GridFS ID format: ${gridfsId}`);
    }
  }

  async getPDFMetadata(gridfsId) {
    await this.connect();
    
    try {
      const objectId = new ObjectId(gridfsId);
      const fileInfo = await this.gridFSBucket.find({ _id: objectId }).toArray();
      
      if (fileInfo.length === 0) {
        throw new Error('PDF not found');
      }
      
      return fileInfo[0];
    } catch (error) {
      throw new Error(`Failed to get PDF metadata: ${error.message}`);
    }
  }

  // Roadmap Methods
  async saveRoadmap(roadmapData) {
    await this.connect();
    
    const roadmap = {
      ...roadmapData,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };
    
    const result = await this.db.collection('roadmaps').insertOne(roadmap);
    return result.insertedId;
  }

  async getRoadmapByUserId(userId) {
    await this.connect();
    
    const roadmap = await this.db.collection('roadmaps').findOne({ 
      $or: [
        { userId: userId },
        { user_id: userId },
        { 'user_profile.user_id': userId }
      ]
    }, { sort: { created_at: -1 } }); // Get most recent
    
    return roadmap;
  }

  async updateRoadmap(roadmapId, updateData) {
    await this.connect();
    
    const update = {
      ...updateData,
      last_updated: new Date().toISOString()
    };
    
    const result = await this.db.collection('roadmaps').updateOne(
      { _id: new ObjectId(roadmapId) },
      { $set: update }
    );
    
    return result.modifiedCount > 0;
  }

  async updateRoadmapProgress(userId, progressData) {
    await this.connect();
    
    // Find the user's roadmap
    const roadmap = await this.getRoadmapByUserId(userId);
    if (!roadmap) {
      throw new Error('No roadmap found for user');
    }
    
    // Update the roadmap with progress data
    const update = {
      progress_data: progressData,
      last_updated: new Date().toISOString()
    };
    
    // If progressData contains phase updates, merge them
    if (progressData.phases) {
      update['generated_roadmap.phases'] = progressData.phases;
    }
    
    const result = await this.db.collection('roadmaps').updateOne(
      { 
        $or: [
          { userId: userId },
          { user_id: userId },
          { 'user_profile.user_id': userId }
        ]
      },
      { $set: update }
    );
    
    if (result.modifiedCount > 0) {
      // Return updated roadmap
      return await this.getRoadmapByUserId(userId);
    }
    
    throw new Error('Failed to update roadmap progress');
  }

  async deleteRoadmap(roadmapId) {
    await this.connect();
    
    const result = await this.db.collection('roadmaps').deleteOne({ 
      _id: new ObjectId(roadmapId) 
    });
    
    return result.deletedCount > 0;
  }

  // Statistics and Analytics
  async getDashboardStats() {
    await this.connect();
    
    const stats = await Promise.all([
      this.db.collection('pes_materials').countDocuments(),
      this.db.collection('reference_books').countDocuments(),
      this.db.collection('roadmaps').countDocuments(),
      this.db.collection('pes_materials').distinct('subject'),
      this.db.collection('reference_books').distinct('difficulty')
    ]);
    
    return {
      pes_materials_count: stats[0],
      reference_books_count: stats[1],
      roadmaps_generated: stats[2],
      subjects_available: stats[3].length,
      difficulty_levels: stats[4].length,
      subjects: stats[3],
      difficulties: stats[4]
    };
  }

  // Compatibility methods for pipeline routes
  async getStudyPESMaterials(filters = {}) {
    // Alias for getAllPESMaterials
    return await this.getAllPESMaterials(filters);
  }

  async getStudyPESMaterialsBySubject(subject) {
    // Alias for getPESMaterialsBySubjectAndUnit
    return await this.getPESMaterialsBySubjectAndUnit(subject);
  }

  async getReferenceBooks(filters = {}, pagination = {}) {
    await this.connect();
    
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'desc' } = pagination;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Apply filters
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { authors: { $regex: filters.search, $options: 'i' } },
        { summary: { $regex: filters.search, $options: 'i' } },
        { key_concepts: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.category) {
      query.category = { $regex: filters.category, $options: 'i' };
    }
    
    if (filters.subject) {
      query.$or = query.$or || [];
      query.$or.push(
        { title: { $regex: filters.subject, $options: 'i' } },
        { summary: { $regex: filters.subject, $options: 'i' } },
        { key_concepts: { $regex: filters.subject, $options: 'i' } }
      );
    }
    
    if (filters.author) {
      query.authors = { $regex: filters.author, $options: 'i' };
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = order === 'desc' ? -1 : 1;
    
    const [books, totalBooks] = await Promise.all([
      this.db.collection('reference_books').find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.db.collection('reference_books').countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalBooks / limit);
    
    return {
      books: books.map(book => ({
        ...book,
        content_type: 'reference_book',
        source: 'reference_books',
        relevance_score: book.relevance_score || 0.88,
        semantic_score: book.semantic_score || 0.85,
        snippet: book.snippet || (book.summary || '').substring(0, 200) + '...'
      })),
      totalBooks,
      totalPages,
      currentPage: page
    };
  }

  async getReferenceBookById(bookId) {
    await this.connect();
    
    const book = await this.db.collection('reference_books').findOne({ 
      _id: new ObjectId(bookId) 
    });
    
    return book;
  }

  async getBookCategories() {
    await this.connect();
    
    const categories = await this.db.collection('reference_books').distinct('category');
    return categories.filter(cat => cat && cat.trim() !== '');
  }

  async getBookSubjects() {
    await this.connect();
    
    // Extract subjects from title and summary fields
    const pipeline = [
      {
        $group: {
          _id: null,
          titles: { $push: '$title' },
          summaries: { $push: '$summary' },
          concepts: { $push: '$key_concepts' }
        }
      }
    ];
    
    const result = await this.db.collection('reference_books').aggregate(pipeline).toArray();
    
    if (result.length === 0) return [];
    
    // Extract common subjects from text analysis
    const subjects = new Set();
    const commonSubjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Engineering',
      'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Data Science',
      'Machine Learning', 'Algorithms', 'Programming', 'Software Engineering'
    ];
    
    const allText = [
      ...result[0].titles,
      ...result[0].summaries,
      ...result[0].concepts
    ].join(' ').toLowerCase();
    
    commonSubjects.forEach(subject => {
      if (allText.includes(subject.toLowerCase())) {
        subjects.add(subject);
      }
    });
    
    return Array.from(subjects);
  }

  async getFileStream(gridfsId) {
    return await this.getPDFStream(gridfsId);
  }

  async getDatabaseStatus() {
    return await this.healthCheck();
  }
}

// Export singleton instance
const pipelineDB = new PipelineDatabaseService();

module.exports = pipelineDB;
