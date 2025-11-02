const mongoose = require('mongoose');

// Define a simple schema for testing
const bookSchema = new mongoose.Schema({}, { strict: false });
const Book = mongoose.model('Book', bookSchema);

async function testBookModel() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/study-ai');
    
    console.log('📊 Counting books...');
    const count = await Book.countDocuments();
    console.log(`📚 Total books in database: ${count}`);
    
    if (count > 0) {
      console.log('📖 Getting first book...');
      const firstBook = await Book.findOne();
      console.log('First book title:', firstBook?.title || 'No title');
      console.log('First book keys:', Object.keys(firstBook?.toObject() || {}));
    }
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBookModel();
