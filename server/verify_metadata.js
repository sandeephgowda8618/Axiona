const mongoose = require('mongoose');

// Use the existing Book model from the server
const { Book } = require('./src/models/Book');

// Use the same MongoDB URI as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// List of all expected PDFs that should have been updated
const expectedBooks = [
  'comp(73).pdf', 'comp(79).pdf', 'comp(74).pdf', 'comp(66).pdf', 'comp(64).pdf',
  'comp(59).pdf', 'comp(54).pdf', 'comp(53).pdf', 'comp(51).pdf', 'comp(46).pdf',
  'comp(45).pdf', 'comp(42).pdf', 'comp(40).pdf', 'comp(39).pdf', 'comp(38).pdf',
  'comp(34).pdf', 'comp(24).pdf', 'comp(19).pdf', 'comp(5).pdf', 'comp(14).pdf',
  'comp(15).pdf', 'comp(12).pdf', 'comp(10).pdf', 'comp(7).pdf', 'comp(6).pdf',
  'comp(3).pdf', 'comp(1).pdf'
];

// Required metadata fields
const requiredFields = [
  'title', 'author', 'subject', 'category', 'description', 
  'tags', 'difficulty', 'target_audience', 'key_concepts', 
  'prerequisites', 'summary'
];

async function verifyMetadata() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🔍 Starting metadata verification...\n');
    
    let totalBooks = 0;
    let booksWithCompleteMetadata = 0;
    let booksWithMissingFields = 0;
    let missingBooks = [];
    let incompleteBooks = [];
    
    // Check each expected book
    for (const fileName of expectedBooks) {
      try {
        const book = await Book.findOne({ fileName });
        
        if (!book) {
          console.log(`❌ Book not found in database: ${fileName}`);
          missingBooks.push(fileName);
          continue;
        }
        
        totalBooks++;
        
        // Check if all required fields are present and not empty
        let missingFields = [];
        let hasCompleteMetadata = true;
        
        for (const field of requiredFields) {
          const value = book[field];
          
          if (!value || 
              (typeof value === 'string' && value.trim() === '') ||
              (Array.isArray(value) && value.length === 0)) {
            missingFields.push(field);
            hasCompleteMetadata = false;
          }
        }
        
        if (hasCompleteMetadata) {
          console.log(`✅ ${fileName} → "${book.title}" - Complete metadata`);
          booksWithCompleteMetadata++;
        } else {
          console.log(`⚠️  ${fileName} → "${book.title}" - Missing fields: ${missingFields.join(', ')}`);
          incompleteBooks.push({
            fileName,
            title: book.title,
            missingFields
          });
          booksWithMissingFields++;
        }
        
      } catch (error) {
        console.error(`❌ Error checking ${fileName}:`, error.message);
      }
    }
    
    // Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 METADATA VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📖 Total expected books: ${expectedBooks.length}`);
    console.log(`📚 Books found in database: ${totalBooks}`);
    console.log(`❌ Books missing from database: ${missingBooks.length}`);
    console.log(`✅ Books with complete metadata: ${booksWithCompleteMetadata}`);
    console.log(`⚠️  Books with incomplete metadata: ${booksWithMissingFields}`);
    console.log(`📈 Completion rate: ${((booksWithCompleteMetadata / expectedBooks.length) * 100).toFixed(1)}%`);
    
    // Detailed Missing Books Report
    if (missingBooks.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ MISSING BOOKS:');
      console.log('='.repeat(60));
      missingBooks.forEach(fileName => {
        console.log(`   • ${fileName}`);
      });
    }
    
    // Detailed Incomplete Books Report
    if (incompleteBooks.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  BOOKS WITH INCOMPLETE METADATA:');
      console.log('='.repeat(60));
      incompleteBooks.forEach(book => {
        console.log(`   📄 ${book.fileName} → "${book.title}"`);
        console.log(`      Missing: ${book.missingFields.join(', ')}\n`);
      });
    }
    
    // Sample metadata display
    if (booksWithCompleteMetadata > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('📋 SAMPLE COMPLETE METADATA:');
      console.log('='.repeat(60));
      
      const sampleBook = await Book.findOne({ 
        fileName: { $in: expectedBooks },
        title: { $exists: true, $ne: '' },
        author: { $exists: true, $ne: '' }
      });
      
      if (sampleBook) {
        console.log(`📖 Title: ${sampleBook.title}`);
        console.log(`👤 Author: ${sampleBook.author}`);
        console.log(`📚 Subject: ${sampleBook.subject}`);
        console.log(`🏷️  Category: ${sampleBook.category}`);
        console.log(`🎯 Difficulty: ${sampleBook.difficulty}`);
        console.log(`👥 Target Audience: ${sampleBook.target_audience}`);
        console.log(`🏷️  Tags: ${sampleBook.tags.join(', ')}`);
        console.log(`🔑 Key Concepts: ${sampleBook.key_concepts.join(', ')}`);
        console.log(`📋 Prerequisites: ${sampleBook.prerequisites.join(', ')}`);
        console.log(`📝 Description: ${sampleBook.description.substring(0, 100)}...`);
        console.log(`📄 Summary: ${sampleBook.summary.substring(0, 100)}...`);
      }
    }
    
    // Validation status
    console.log('\n' + '='.repeat(60));
    if (booksWithCompleteMetadata === expectedBooks.length) {
      console.log('🎉 SUCCESS: All books have complete metadata!');
    } else if (totalBooks === expectedBooks.length && booksWithMissingFields === 0) {
      console.log('✅ SUCCESS: All books found with complete metadata!');
    } else {
      console.log('⚠️  WARNING: Some books have missing or incomplete metadata.');
      console.log('   Please run the update script again or check for errors.');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Also check for any books that might not be in our expected list
async function findUnexpectedBooks() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n🔍 Checking for additional books in database...');
    
    const allBooks = await Book.find({}, 'fileName title').lean();
    const unexpectedBooks = allBooks.filter(book => 
      !expectedBooks.includes(book.fileName)
    );
    
    if (unexpectedBooks.length > 0) {
      console.log(`\n📚 Found ${unexpectedBooks.length} additional books in database:`);
      unexpectedBooks.forEach(book => {
        console.log(`   • ${book.fileName} → "${book.title || 'No title'}"`);
      });
    } else {
      console.log('✅ No unexpected books found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking for unexpected books:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the verification
console.log('🚀 Starting comprehensive metadata verification...\n');
verifyMetadata()
  .then(() => findUnexpectedBooks())
  .catch(console.error);
