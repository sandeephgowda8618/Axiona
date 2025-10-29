const mongoose = require('mongoose');
const { PDF } = require('../src/models/PDF');
const { User } = require('../src/models/User');
const gridFSService = require('../src/services/gridFSService');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Wait for GridFS to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create or find a default admin user for uploads
    let adminUser = await User.findOne({ email: 'admin@studyai.com' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Study AI Admin',
        email: 'admin@studyai.com',
        passwordHash: '$2b$10$hashedpasswordexample',
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created admin user');
    }

    // Clear existing PDFs and GridFS files
    console.log('Clearing existing PDFs and GridFS files...');
    await PDF.deleteMany({});
    
    // Clear GridFS files
    const bucket = gridFSService.getBucket();
    if (bucket) {
      const files = await bucket.find({}).toArray();
      for (const file of files) {
        await bucket.delete(file._id);
      }
      console.log(`🗑️ Cleared ${files.length} GridFS files`);
    }
    console.log('✅ Existing data cleared');

    // PDF files mapping with actual file paths
    const pdfFiles = [
      // AFLL PDFs
      {
        topic: "Sets - AFLL",
        fileName: "1.Sets.pdf",
        filePath: path.join(__dirname, '../../docs/AFLL/1.Sets.pdf'),
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Introduction to Sets theory, set operations, and mathematical foundations for automata theory.",
        author: "AFLL Course Material",
        downloadCount: 245
      },
      {
        topic: "Functions & Relations - AFLL",
        fileName: "2.Functions&Relations.pdf",
        filePath: path.join(__dirname, '../../docs/AFLL/2.Functions&Relations.pdf'),
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Mathematical functions, relations, and their properties in formal language theory.",
        author: "AFLL Course Material",
        downloadCount: 198
      },
      {
        topic: "Deterministic Finite Automata - AFLL",
        fileName: "3.DFA.pdf",
        filePath: path.join(__dirname, '../../docs/AFLL/3.DFA.pdf'),
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Complete guide to Deterministic Finite Automata, state diagrams, and transition functions.",
        author: "AFLL Course Material",
        downloadCount: 567
      },
      {
        topic: "Non-deterministic Finite Automata - AFLL",
        fileName: "4.NFA.pdf",
        filePath: path.join(__dirname, '../../docs/AFLL/4.NFA.pdf'),
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Non-deterministic Finite Automata, epsilon transitions, and NFA to DFA conversion.",
        author: "AFLL Course Material",
        downloadCount: 423
      },
      {
        topic: "Regular Expressions - AFLL",
        fileName: "RE.pdf",
        filePath: path.join(__dirname, '../../docs/AFLL/RE.pdf'),
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Regular expressions, pattern matching, and their equivalence with finite automata.",
        author: "AFLL Course Material",
        downloadCount: 634
      },
      
      // DSA PDFs
      {
        topic: "DSA Fundamentals - Slide 1",
        fileName: "slide1.pdf",
        filePath: path.join(__dirname, '../../docs/DSA/slide1.pdf'),
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Introduction to Data Structures and Algorithms, complexity analysis.",
        author: "DSA Course Material",
        downloadCount: 892
      },
      {
        topic: "Arrays and Linked Lists - DSA",
        fileName: "slide2.pdf",
        filePath: path.join(__dirname, '../../docs/DSA/slide2.pdf'),
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Arrays, linked lists, implementation and operations.",
        author: "DSA Course Material",
        downloadCount: 756
      },
      {
        topic: "Stacks and Queues - DSA",
        fileName: "slide3.pdf",
        filePath: path.join(__dirname, '../../docs/DSA/slide3.pdf'),
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Stack and queue data structures, applications and implementations.",
        author: "DSA Course Material",
        downloadCount: 678
      },
      {
        topic: "Trees and Graphs - DSA",
        fileName: "slide4.pdf",
        filePath: path.join(__dirname, '../../docs/DSA/slide4.pdf'),
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Binary trees, BST, graph algorithms, traversal techniques.",
        author: "DSA Course Material",
        downloadCount: 834
      },
      
      // Math PDFs  
      {
        topic: "Mathematical Foundations",
        fileName: "slide1.pdf",
        filePath: path.join(__dirname, '../../docs/Math/slide1.pdf'),
        domain: "Math",
        year: 1,
        class: "First Year Engineering",
        description: "Basic mathematical concepts, calculus fundamentals.",
        author: "Mathematics Department",
        downloadCount: 345
      },
      {
        topic: "Linear Algebra",
        fileName: "slide2.pdf",
        filePath: path.join(__dirname, '../../docs/Math/slide2.pdf'),
        domain: "Math",
        year: 1,
        class: "First Year Engineering",
        description: "Matrices, vectors, linear transformations and systems.",
        author: "Mathematics Department",
        downloadCount: 289
      },
      {
        topic: "Differential Equations",
        fileName: "slide3.pdf",
        filePath: path.join(__dirname, '../../docs/Math/slide3.pdf'),
        domain: "Math",
        year: 2,
        class: "Second Year Engineering",
        description: "Ordinary differential equations, solutions and applications.",
        author: "Mathematics Department",
        downloadCount: 412
      }
    ];

    console.log(`📁 Processing ${pdfFiles.length} PDF files...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const pdfData of pdfFiles) {
      try {
        console.log(`📄 Processing: ${pdfData.topic}`);
        
        // Check if file exists
        if (!fs.existsSync(pdfData.filePath)) {
          console.log(`⚠️ File not found: ${pdfData.filePath}, creating placeholder...`);
          
          // Create PDF record without GridFS upload for missing files
          const pdfRecord = await PDF.create({
            topic: pdfData.topic,
            fileName: pdfData.fileName,
            gridFSFileId: new mongoose.Types.ObjectId(), // Placeholder
            fileUrl: `/api/pdfs/file/placeholder`,
            fileSize: 500000, // Estimated
            pages: 20, // Estimated
            author: pdfData.author,
            domain: pdfData.domain,
            year: pdfData.year,
            class: pdfData.class,
            description: pdfData.description + " (File not found - placeholder record)",
            approved: true,
            uploadedBy: adminUser._id,
            downloadCount: pdfData.downloadCount
          });
          
          console.log(`   ✅ Created placeholder record: ${pdfRecord._id}`);
          successCount++;
          continue;
        }
        
        // Get file stats
        const stats = fs.statSync(pdfData.filePath);
        
        // Upload to GridFS
        const uploadResult = await gridFSService.uploadFromPath(
          pdfData.filePath,
          pdfData.fileName,
          {
            domain: pdfData.domain,
            topic: pdfData.topic,
            uploadedBy: adminUser._id
          }
        );
        
        console.log(`   📤 Uploaded to GridFS: ${uploadResult.fileId}`);
        
        // Create PDF record in database
        const pdfRecord = await PDF.create({
          topic: pdfData.topic,
          fileName: pdfData.fileName,
          gridFSFileId: uploadResult.fileId,
          fileUrl: `/api/pdfs/file/${uploadResult.fileId}`,
          fileSize: stats.size,
          pages: estimatePages(stats.size), // Simple estimation
          author: pdfData.author,
          domain: pdfData.domain,
          year: pdfData.year,
          class: pdfData.class,
          description: pdfData.description,
          approved: true,
          uploadedBy: adminUser._id,
          downloadCount: pdfData.downloadCount
        });
        
        console.log(`   ✅ Created PDF record: ${pdfRecord._id}`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${pdfData.topic}:`, error.message);
        errorCount++;
      }
    }

    // Display summary
    console.log('\n=== GRIDFS PDF SEEDING SUMMARY ===');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    const totalPDFs = await PDF.countDocuments();
    console.log(`📚 Total PDFs in database: ${totalPDFs}`);
    
    const approvedPDFs = await PDF.countDocuments({ approved: true });
    console.log(`✅ Approved PDFs: ${approvedPDFs}`);
    
    console.log('\n=== PDFs BY DOMAIN ===');
    const pdfsByDomain = await PDF.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    pdfsByDomain.forEach(domain => {
      console.log(`📖 ${domain._id}: ${domain.count} PDFs`);
    });

    // Check GridFS files
    const gridFSFiles = await gridFSService.listPDFs();
    console.log(`\n📁 GridFS files: ${gridFSFiles.length}`);

    console.log('\n✅ GridFS PDF seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding GridFS PDF database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});

// Simple function to estimate pages based on file size
function estimatePages(fileSize) {
  // Rough estimation: 50KB per page average
  const avgBytesPerPage = 50000;
  const estimated = Math.ceil(fileSize / avgBytesPerPage);
  return Math.max(1, Math.min(estimated, 200)); // Between 1 and 200 pages
}
