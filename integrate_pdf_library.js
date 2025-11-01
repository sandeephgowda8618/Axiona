const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the Book model
const { Book } = require('./server/src/models/Book');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Function to add file_url field to Book schema if it doesn't exist
async function updateBookSchema() {
  console.log('📋 Checking and updating Book schema...');
  
  try {
    // Check if file_url field exists in existing documents
    const sampleBook = await Book.findOne();
    
    if (sampleBook && !sampleBook.file_url) {
      console.log('🔄 Adding file_url field to existing books...');
      
      // Update all existing books to include file_url field
      const updateResult = await Book.updateMany(
        { file_url: { $exists: false } },
        { $set: { file_url: "N/A" } }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} existing books with file_url: "N/A"`);
    } else {
      console.log('✅ file_url field already exists or no existing books found');
    }
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  }
}

// Function to map metadata to Book schema format
function mapMetadataToBook(metadata) {
  // Extract subject from metadata or determine from file path
  const determineSubject = (metadata) => {
    if (metadata.subject) return metadata.subject;
    
    const filePath = metadata.file_path.toLowerCase();
    if (filePath.includes('math') || filePath.includes('mathematics')) return 'Mathematics';
    if (filePath.includes('cs') || filePath.includes('computer')) return 'Computer Science';
    if (filePath.includes('dsa') || filePath.includes('algorithm')) return 'Data Structures & Algorithms';
    if (filePath.includes('ml') || filePath.includes('machine')) return 'Machine Learning';
    if (filePath.includes('ai') || filePath.includes('artificial')) return 'Artificial Intelligence';
    if (filePath.includes('db') || filePath.includes('database')) return 'Database Systems';
    if (filePath.includes('os') || filePath.includes('operating')) return 'Operating Systems';
    if (filePath.includes('network')) return 'Computer Networks';
    if (filePath.includes('security')) return 'Computer Security';
    if (filePath.includes('web')) return 'Web Development';
    if (filePath.includes('mobile')) return 'Mobile Development';
    if (filePath.includes('afll') || filePath.includes('automata')) return 'Automata Theory';
    
    return metadata.subject || 'Computer Science';
  };

  // Determine category from subject
  const determineCategory = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return 'Mathematics';
    if (subjectLower.includes('computer') || subjectLower.includes('cs')) return 'Computer Science';
    if (subjectLower.includes('engineering')) return 'Engineering';
    if (subjectLower.includes('science')) return 'Science';
    return 'Academic';
  };

  const subject = determineSubject(metadata);
  const category = determineCategory(subject);

  // Create title from filename if not provided
  const title = metadata.title || 
                metadata.filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim() ||
                'Unknown Title';

  // Extract author or use default
  const author = metadata.author || 'Unknown Author';

  // Calculate file size in bytes if provided as string
  const parseFileSize = (sizeStr) => {
    if (typeof sizeStr === 'number') return sizeStr;
    if (!sizeStr) return 0;
    
    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    return Math.round(value * (multipliers[unit] || 1));
  };

  return {
    title: title,
    author: author,
    subject: subject,
    category: category,
    fileName: metadata.filename || 'unknown.pdf',
    fileSize: parseFileSize(metadata.file_size),
    pages: metadata.pages || 0,
    description: metadata.content_preview || metadata.description || 'Reference book from GitHub repository',
    tags: metadata.key_concepts || [],
    language: 'English',
    availability: 'available',
    file_url: metadata.file_url || metadata.source_url || "N/A",
    addedDate: new Date(),
    updatedAt: new Date()
  };
}

// Function to load and process metadata
async function loadMetadata() {
  const metadataPath = path.join(__dirname, 'META_dataretreval/batch_output/final_metadata_20251101_223839.json');
  
  try {
    const data = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(data);
    console.log(`📚 Loaded ${metadata.length} PDF metadata entries`);
    return metadata;
  } catch (error) {
    console.error('❌ Error loading metadata:', error);
    throw error;
  }
}

// Function to insert books into MongoDB
async function insertBooks(metadataArray) {
  console.log('📥 Processing and inserting books...');
  
  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const metadata of metadataArray) {
    try {
      const bookData = mapMetadataToBook(metadata);
      
      // Check if book already exists (by title and author to avoid duplicates)
      const existingBook = await Book.findOne({
        title: bookData.title,
        author: bookData.author
      });

      if (existingBook) {
        // Update existing book with file_url if it doesn't have one
        if (!existingBook.file_url || existingBook.file_url === "N/A") {
          existingBook.file_url = bookData.file_url;
          await existingBook.save();
          console.log(`🔄 Updated existing book: ${bookData.title}`);
        } else {
          console.log(`⏭️  Skipped duplicate: ${bookData.title}`);
          skippedCount++;
        }
        continue;
      }

      // Create new book
      const newBook = new Book(bookData);
      await newBook.save();
      
      insertedCount++;
      console.log(`✅ Inserted: ${bookData.title}`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${metadata.filename}:`, error.message);
    }
  }

  console.log('\n📊 Integration Summary:');
  console.log(`✅ Inserted: ${insertedCount} books`);
  console.log(`⏭️  Skipped: ${skippedCount} duplicates`);
  console.log(`❌ Errors: ${errorCount} books`);
}

// Function to verify the integration
async function verifyIntegration() {
  console.log('\n🔍 Verifying integration...');
  
  try {
    const totalBooks = await Book.countDocuments();
    const booksWithFileUrl = await Book.countDocuments({ file_url: { $ne: "N/A" } });
    const booksWithoutFileUrl = await Book.countDocuments({ file_url: "N/A" });
    
    console.log(`📚 Total books in library: ${totalBooks}`);
    console.log(`🔗 Books with file URLs: ${booksWithFileUrl}`);
    console.log(`📖 Books without file URLs: ${booksWithoutFileUrl}`);
    
    // Sample some books to verify
    const sampleBooks = await Book.find().limit(5);
    console.log('\n📋 Sample books:');
    sampleBooks.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} by ${book.author} (URL: ${book.file_url})`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

// Main integration function
async function main() {
  try {
    console.log('🚀 Starting PDF Library Integration...\n');
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Update schema to include file_url field
    await updateBookSchema();
    
    // Load metadata
    const metadata = await loadMetadata();
    
    // Insert books
    await insertBooks(metadata);
    
    // Verify integration
    await verifyIntegration();
    
    console.log('\n🎉 Integration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Integration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Update the Book schema to include file_url field
const mongoose_1 = require('mongoose');
const BookSchema = Book.schema;

// Add file_url field if it doesn't exist
if (!BookSchema.paths.file_url) {
  BookSchema.add({
    file_url: {
      type: String,
      default: "N/A",
      trim: true
    }
  });
  console.log('📝 Added file_url field to Book schema');
}

// Run the integration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  connectToMongoDB,
  updateBookSchema,
  mapMetadataToBook,
  loadMetadata,
  insertBooks,
  verifyIntegration
};
