#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URI for pipeline database
const PIPELINE_MONGODB_URI = process.env.PIPELINE_MONGODB_URI || 'mongodb://localhost:27017/educational_roadmap_system';

async function importReferenceBooks() {
  let client;
  
  try {
    console.log('🔄 Starting reference books import...');
    
    // Connect to pipeline MongoDB
    client = new MongoClient(PIPELINE_MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to pipeline database');
    
    const db = client.db('educational_roadmap_system');
    const collection = db.collection('reference_books');
    
    // Read the reference books JSON file
    const dataPath = path.join(__dirname, '../../META_dataretreval_libreary_refrences/Refrence_book.json');
    console.log('📂 Reading data from:', dataPath);
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('Reference books data file not found at: ' + dataPath);
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const booksData = JSON.parse(rawData);
    
    console.log(`📚 Found ${booksData.length} books to import`);
    
    // Transform the data for pipeline database schema
    const transformedBooks = booksData.map((book, index) => {
      // Generate unique ID to avoid duplicates
      const uniqueId = `ref_book_${Date.now()}_${index}`;
      
      // Extract GitHub URL from file_url if available
      let githubUrl = null;
      if (book.file_url && book.file_url.includes('github.com')) {
        githubUrl = book.file_url;
      }
      
      return {
        _id: uniqueId,
        title: book.title || book.filename || 'Untitled',
        author: book.author || 'Unknown Author',
        description: book.summary || book.content_preview || '',
        category: book.subject || 'General',
        subject: book.subject || 'Computer Science', 
        isbn: book.isbn || '',
        publication_year: book.publication_year || 2020,
        pages: book.pages || 0,
        language: book.language || 'English',
        rating: book.rating || 4.0,
        review_count: book.review_count || 0,
        download_count: book.download_count || 0,
        tags: book.key_concepts || [],
        file_size: book.file_size || '0 MB',
        file_path: book.file_path || '',
        filename: book.filename || '',
        format: book.format || 'PDF',
        file_url: githubUrl || book.file_url || '',
        github_url: githubUrl, // Store GitHub URL separately
        source: book.source || 'GitHub',
        difficulty: book.difficulty || 'Intermediate',
        target_audience: book.target_audience || 'Students',
        prerequisites: book.prerequisites || [],
        key_concepts: book.key_concepts || [],
        content_preview: book.content_preview || '',
        processed_at: book.processed_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Note: gridfs_id will be populated when PDFs are actually uploaded to GridFS
        gridfs_id: null
      };
    });
    
    // Clear existing books (if any)
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing reference books');
    
    // Insert transformed books
    const result = await collection.insertMany(transformedBooks);
    console.log(`✅ Successfully imported ${result.insertedCount} reference books`);
    
    // Create indexes for better performance
    await collection.createIndex({ title: 1 });
    await collection.createIndex({ author: 1 });
    await collection.createIndex({ subject: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ tags: 1 });
    await collection.createIndex({ difficulty: 1 });
    console.log('📊 Created database indexes');
    
    // Show some sample data
    const sampleBooks = await collection.find({}).limit(3).toArray();
    console.log('\n📖 Sample imported books:');
    sampleBooks.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} by ${book.author} (${book.pages} pages)`);
    });
    
    console.log('\n🎉 Reference books import completed successfully!');
    console.log(`📊 Total books in database: ${await collection.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error importing reference books:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the import
if (require.main === module) {
  importReferenceBooks();
}

module.exports = { importReferenceBooks };
