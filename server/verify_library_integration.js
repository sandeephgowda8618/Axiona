const mongoose = require('mongoose');
const { Book } = require('./src/models/Book');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function verifyLibraryIntegration() {
  try {
    console.log('🔍 Verifying Library Integration...\n');
    
    // Get total counts
    const totalBooks = await Book.countDocuments();
    const booksWithGitHubUrl = await Book.countDocuments({ 
      file_url: { $regex: 'github.com', $options: 'i' } 
    });
    const booksWithoutUrl = await Book.countDocuments({ file_url: "N/A" });
    
    console.log('📊 Integration Statistics:');
    console.log(`📚 Total books in library: ${totalBooks}`);
    console.log(`🔗 Books with GitHub URLs: ${booksWithGitHubUrl}`);
    console.log(`📖 Books without URLs (original): ${booksWithoutUrl}`);
    
    // Sample books with GitHub URLs (new ones)
    console.log('\n🆕 Sample GitHub Reference Books:');
    const gitHubBooks = await Book.find({ 
      file_url: { $regex: 'github.com', $options: 'i' } 
    }).limit(10);
    
    gitHubBooks.forEach((book, index) => {
      console.log(`${index + 1}. 📘 ${book.title}`);
      console.log(`   👤 Author: ${book.author}`);
      console.log(`   📂 Subject: ${book.subject}`);
      console.log(`   🔗 URL: ${book.file_url}`);
      console.log(`   📄 Pages: ${book.pages}`);
      console.log('');
    });
    
    // Sample original books
    console.log('📚 Sample Original Library Books:');
    const originalBooks = await Book.find({ file_url: "N/A" }).limit(5);
    
    originalBooks.forEach((book, index) => {
      console.log(`${index + 1}. 📕 ${book.title}`);
      console.log(`   👤 Author: ${book.author}`);
      console.log(`   📂 Subject: ${book.subject}`);
      console.log(`   📄 Pages: ${book.pages}`);
      console.log('');
    });
    
    // Check for different subjects
    console.log('📊 Books by Subject:');
    const subjectCounts = await Book.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    subjectCounts.forEach(subject => {
      console.log(`   ${subject._id}: ${subject.count} books`);
    });
    
    // Search functionality test
    console.log('\n🔍 Testing Search Functionality:');
    const searchResults = await Book.find({
      $or: [
        { title: { $regex: 'python', $options: 'i' } },
        { author: { $regex: 'python', $options: 'i' } },
        { tags: { $in: [/python/i] } }
      ]
    });
    
    console.log(`🐍 Found ${searchResults.length} Python-related books`);
    searchResults.slice(0, 3).forEach((book, index) => {
      console.log(`   ${index + 1}. ${book.title} by ${book.author}`);
    });
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToMongoDB();
    await verifyLibraryIntegration();
    console.log('\n✅ Verification completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Check the frontend library section displays all books');
    console.log('   2. Verify title is used as rendering key');
    console.log('   3. Confirm file_path can be used as candidate key');
    console.log('   4. Test search and filter functionality');
    
  } catch (error) {
    console.error('\n💥 Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyLibraryIntegration };
