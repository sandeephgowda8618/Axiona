const mongoose = require('mongoose');

// Import models
const { Book } = require('./src/models/Book');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Function to show detailed metadata for StudyPES AFLL, DSA and Mathematics materials
async function showStudyPESDetails() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🎓 Fetching detailed StudyPES AFLL, DSA, and Mathematics materials...\n');
    
    // Get all books from database
    const allBooks = await Book.find({});
    
    // Filter for AFLL materials
    const afllMaterials = allBooks.filter(book => {
      const title = (book.title || '').toLowerCase();
      const subject = (book.subject || '').toLowerCase();
      const fileName = (book.fileName || '').toLowerCase();
      const description = (book.description || '').toLowerCase();
      
      return (title.includes('automata') || title.includes('formal') || title.includes('language theory') ||
              subject.includes('automata') || subject.includes('formal language') ||
              fileName.includes('automata') || fileName.includes('formal') ||
              description.includes('automata') || description.includes('formal language')) &&
             !title.includes('reference') && !title.includes('handbook');
    });
    
    // Filter for DSA materials
    const dsaMaterials = allBooks.filter(book => {
      const title = (book.title || '').toLowerCase();
      const subject = (book.subject || '').toLowerCase();
      const fileName = (book.fileName || '').toLowerCase();
      
      return (title.includes('algorithm') || title.includes('introduction to algorithms') ||
              subject.includes('computer science') && (title.includes('algorithm') || fileName.includes('algorithm'))) &&
             !title.includes('reference') && !title.includes('handbook');
    });
    
    // Filter for Mathematics materials
    const mathMaterials = allBooks.filter(book => {
      const title = (book.title || '').toLowerCase();
      const subject = (book.subject || '').toLowerCase();
      const fileName = (book.fileName || '').toLowerCase();
      
      return subject.includes('mathematics') || 
             (title.includes('probability') || title.includes('linear algebra')) &&
             !title.includes('reference') && !title.includes('handbook');
    });
    
    console.log('🔍 AFLL (Automata & Formal Language Theory) MATERIALS:');
    console.log('='.repeat(80));
    
    if (afllMaterials.length === 0) {
      console.log('❌ No AFLL materials found');
    } else {
      afllMaterials.forEach((book, index) => {
        console.log(`\n📙 AFLL Material #${index + 1}:`);
        console.log(`   Title: ${book.title || 'N/A'}`);
        console.log(`   Subject: ${book.subject || 'N/A'}`);
        console.log(`   Category: ${book.category || 'N/A'}`);
        console.log(`   Author: ${book.author || 'N/A'}`);
        console.log(`   File Name: ${book.fileName || 'N/A'}`);
        console.log(`   Pages: ${book.pages || 'N/A'}`);
        console.log(`   Language: ${book.language || 'N/A'}`);
        console.log(`   Publisher: ${book.publisher || 'N/A'}`);
        console.log(`   Publication Year: ${book.publication_year || 'N/A'}`);
        console.log(`   ISBN: ${book.isbn || 'N/A'}`);
        console.log(`   File URL: ${book.file_url ? 'Available' : 'N/A'}`);
        console.log(`   Tags: ${book.tags && book.tags.length > 0 ? book.tags.join(', ') : 'N/A'}`);
        console.log(`   Description: ${book.description || 'N/A'}`);
        console.log(`   Book ID: ${book._id}`);
        console.log(`   Added Date: ${book.createdAt || 'N/A'}`);
      });
    }
    
    console.log('\n\n🔍 DSA (Data Structures & Algorithms) MATERIALS:');
    console.log('='.repeat(80));
    
    if (dsaMaterials.length === 0) {
      console.log('❌ No DSA materials found');
    } else {
      dsaMaterials.forEach((book, index) => {
        console.log(`\n📘 DSA Material #${index + 1}:`);
        console.log(`   Title: ${book.title || 'N/A'}`);
        console.log(`   Subject: ${book.subject || 'N/A'}`);
        console.log(`   Category: ${book.category || 'N/A'}`);
        console.log(`   Author: ${book.author || 'N/A'}`);
        console.log(`   File Name: ${book.fileName || 'N/A'}`);
        console.log(`   Pages: ${book.pages || 'N/A'}`);
        console.log(`   Language: ${book.language || 'N/A'}`);
        console.log(`   Publisher: ${book.publisher || 'N/A'}`);
        console.log(`   Publication Year: ${book.publication_year || 'N/A'}`);
        console.log(`   ISBN: ${book.isbn || 'N/A'}`);
        console.log(`   File URL: ${book.file_url ? 'Available' : 'N/A'}`);
        console.log(`   Tags: ${book.tags && book.tags.length > 0 ? book.tags.join(', ') : 'N/A'}`);
        console.log(`   Description: ${book.description || 'N/A'}`);
        console.log(`   Book ID: ${book._id}`);
        console.log(`   Added Date: ${book.createdAt || 'N/A'}`);
      });
    }
    
    console.log('\n\n🔢 MATHEMATICS MATERIALS:');
    console.log('='.repeat(80));
    
    if (mathMaterials.length === 0) {
      console.log('❌ No Mathematics materials found');
    } else {
      mathMaterials.forEach((book, index) => {
        console.log(`\n📗 Mathematics Material #${index + 1}:`);
        console.log(`   Title: ${book.title || 'N/A'}`);
        console.log(`   Subject: ${book.subject || 'N/A'}`);
        console.log(`   Category: ${book.category || 'N/A'}`);
        console.log(`   Author: ${book.author || 'N/A'}`);
        console.log(`   File Name: ${book.fileName || 'N/A'}`);
        console.log(`   Pages: ${book.pages || 'N/A'}`);
        console.log(`   Language: ${book.language || 'N/A'}`);
        console.log(`   Publisher: ${book.publisher || 'N/A'}`);
        console.log(`   Publication Year: ${book.publication_year || 'N/A'}`);
        console.log(`   ISBN: ${book.isbn || 'N/A'}`);
        console.log(`   File URL: ${book.file_url ? 'Available' : 'N/A'}`);
        console.log(`   Tags: ${book.tags && book.tags.length > 0 ? book.tags.join(', ') : 'N/A'}`);
        console.log(`   Description: ${book.description || 'N/A'}`);
        console.log(`   Book ID: ${book._id}`);
        console.log(`   Added Date: ${book.createdAt || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 SUMMARY:`);
    console.log(`   AFLL Materials: ${afllMaterials.length}`);
    console.log(`   DSA Materials: ${dsaMaterials.length}`);
    console.log(`   Mathematics Materials: ${mathMaterials.length}`);
    console.log(`   Total StudyPES Core Materials: ${afllMaterials.length + dsaMaterials.length + mathMaterials.length}`);
    console.log('✅ Detailed analysis completed!');
    
  } catch (error) {
    console.error('❌ Error fetching materials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the detailed check
console.log('🚀 Starting detailed StudyPES materials analysis...\n');
showStudyPESDetails().catch(console.error);