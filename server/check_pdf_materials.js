const mongoose = require('mongoose');

// Import models - check for StudyPES materials
const { Book } = require('./src/models/Book');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Function to check StudyPES PDF materials in the database
async function checkStudyPESMaterials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🎓 Checking StudyPES study materials in database...\n');
    
    // Get all books from database
    const allBooks = await Book.find({});
    
    // Filter for StudyPES materials specifically (AFLL, DSA, Math - not reference books)
    const studyPESMaterials = allBooks.filter(book => {
      const title = (book.title || '').toLowerCase();
      const subject = (book.subject || '').toLowerCase();
      const fileName = (book.fileName || '').toLowerCase();
      const category = (book.category || '').toLowerCase();
      const tags = book.tags ? book.tags.map(tag => tag.toLowerCase()) : [];
      
      // Check for StudyPES subjects: AFLL, DSA, Mathematics
      const isAFLL = title.includes('automata') || title.includes('formal language') || title.includes('theory of computation') ||
                     subject.includes('afll') || subject.includes('automata') || subject.includes('formal language') ||
                     fileName.includes('afll') || fileName.includes('automata') || fileName.includes('toc') ||
                     tags.some(tag => tag.includes('afll') || tag.includes('automata') || tag.includes('formal'));
      
      const isDSA = title.includes('data structure') || title.includes('algorithm') || title.includes('programming') ||
                    subject.includes('dsa') || subject.includes('data structure') || subject.includes('algorithm') ||
                    fileName.includes('dsa') || fileName.includes('data_structure') || fileName.includes('algorithm') ||
                    fileName.includes('programming') ||
                    tags.some(tag => tag.includes('dsa') || tag.includes('data structure') || tag.includes('algorithm'));
      
      const isMath = (title.includes('mathematics') || title.includes('linear algebra') || title.includes('calculus') || 
                      title.includes('discrete') || title.includes('probability') || title.includes('statistics')) &&
                     !title.includes('reference') && !title.includes('handbook') &&
                     (subject.includes('math') || subject.includes('mathematics') ||
                      fileName.includes('math') || fileName.includes('mathematics') ||
                      tags.some(tag => tag.includes('math') || tag.includes('mathematics')));
      
      // Look for study material patterns (but exclude obvious reference books)
      const isStudyMaterial = (fileName.includes('study') || fileName.includes('material') || fileName.includes('course') ||
                              title.includes('study material') || title.includes('course material') ||
                              title.includes('lecture') || title.includes('notes')) &&
                              !title.includes('reference') && !title.includes('handbook') && !title.includes('encyclopedia');
      
      // Exclude obvious reference/library books
      const isReferenceBook = title.includes('handbook') || title.includes('reference') ||
                             title.includes('encyclopedia') || title.includes('guide to') || title.includes('manual') ||
                             category.includes('reference') || category.includes('library') ||
                             title.includes('complete guide') || title.includes('comprehensive');
      
      return (isAFLL || isDSA || isMath || isStudyMaterial) && !isReferenceBook;
    });
    
    console.log(`📊 Total books in database: ${allBooks.length}`);
    console.log(`🎓 StudyPES materials found: ${studyPESMaterials.length}`);
    console.log('='.repeat(80));
    
    if (studyPESMaterials.length === 0) {
      console.log('❌ No StudyPES materials found in the database');
      console.log('🔍 Looking for any materials that might be StudyPES-related...\n');
      
      // Show some sample titles to help identify StudyPES materials
      console.log('📋 Sample titles from database (first 10):');
      allBooks.slice(0, 10).forEach((book, index) => {
        console.log(`${index + 1}. ${book.title || book.fileName || 'Unknown'}`);
      });
      
      // Show subjects
      const subjects = [...new Set(allBooks.map(book => book.subject).filter(Boolean))];
      console.log('\n📚 Available subjects:');
      subjects.forEach(subject => console.log(`  - ${subject}`));
      
      return;
    }
    
    // Group StudyPES materials by subject
    const bySubject = {};
    studyPESMaterials.forEach(book => {
      const subject = book.subject || 'Unknown';
      if (!bySubject[subject]) bySubject[subject] = [];
      bySubject[subject].push(book);
    });
    
    // Display StudyPES materials by subject
    console.log('🎓 STUDYPES MATERIALS BY SUBJECT:');
    console.log('-'.repeat(50));
    Object.keys(bySubject).sort().forEach(subject => {
      const materials = bySubject[subject];
      console.log(`\n� ${subject}: ${materials.length} materials`);
      materials.forEach((book, index) => {
        console.log(`  ${index + 1}. ${book.title || book.fileName || 'Unknown'}`);
        console.log(`     📄 File: ${book.fileName || 'Unknown'}`);
        console.log(`     📊 Pages: ${book.pages || 'Unknown'}`);
        if (book.file_url && book.file_url !== 'N/A') {
          console.log(`     🔗 URL: Available`);
        }
      });
    });
    
    // Check for specific StudyPES subjects mentioned in your screenshot
    console.log('\n� STUDYPES SUBJECT ANALYSIS:');
    console.log('-'.repeat(50));
    
    const afllMaterials = studyPESMaterials.filter(book => 
      (book.subject && book.subject.toLowerCase().includes('afll')) ||
      (book.subject && book.subject.toLowerCase().includes('automata')) ||
      (book.subject && book.subject.toLowerCase().includes('formal language')) ||
      (book.title && book.title.toLowerCase().includes('automata')) ||
      (book.title && book.title.toLowerCase().includes('formal language'))
    );
    console.log(`📚 AFLL (Automata & Formal Language Theory): ${afllMaterials.length} materials`);
    
    const dsaMaterials = studyPESMaterials.filter(book => 
      (book.subject && book.subject.toLowerCase().includes('dsa')) ||
      (book.subject && book.subject.toLowerCase().includes('data structures')) ||
      (book.subject && book.subject.toLowerCase().includes('algorithms')) ||
      (book.title && book.title.toLowerCase().includes('data structures')) ||
      (book.title && book.title.toLowerCase().includes('algorithms'))
    );
    console.log(`� DSA (Data Structures & Algorithms): ${dsaMaterials.length} materials`);
    
    const mathMaterials = studyPESMaterials.filter(book => 
      (book.subject && book.subject.toLowerCase().includes('math')) ||
      (book.title && book.title.toLowerCase().includes('math')) ||
      (book.category && book.category.toLowerCase().includes('math'))
    );
    console.log(`🔢 Mathematics: ${mathMaterials.length} materials`);
    
    // Check file accessibility
    const accessibleMaterials = studyPESMaterials.filter(book => 
      book.file_url && book.file_url !== 'N/A'
    );
    console.log(`🔗 Materials with file access: ${accessibleMaterials.length}/${studyPESMaterials.length}`);
    
    console.log('\n='.repeat(80));
    console.log('✅ StudyPES materials analysis completed!');
    
  } catch (error) {
    console.error('❌ Error checking PDF materials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the check
console.log('🚀 Starting StudyPES materials check...\n');
checkStudyPESMaterials().catch(console.error);
