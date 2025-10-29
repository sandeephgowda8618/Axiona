const mongoose = require('mongoose');
const { PDF } = require('../src/models/PDF');
const { User } = require('../src/models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Create or find a default admin user for uploads
    let adminUser = await User.findOne({ email: 'admin@studyai.com' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Study AI Admin',
        email: 'admin@studyai.com',
        passwordHash: '$2b$10$hashedpasswordexample', // In real app, this would be properly hashed
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created admin user');
    }

    // Clear existing PDFs
    console.log('Clearing existing PDFs...');
    await PDF.deleteMany({});
    console.log('✅ Existing PDFs cleared');

    // PDF data based on actual files in docs directory
    const pdfData = [
      // AFLL PDFs
      {
        topic: "Sets - AFLL",
        fileName: "1.Sets.pdf",
        fileUrl: "/docs/AFLL/1.Sets.pdf",
        fileSize: 850000, // Estimated
        pages: 25,
        author: "AFLL Course Material",
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Introduction to Sets theory, set operations, and mathematical foundations for automata theory.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 245
      },
      {
        topic: "Functions & Relations - AFLL",
        fileName: "2.Functions&Relations.pdf",
        fileUrl: "/docs/AFLL/2.Functions&Relations.pdf",
        fileSize: 920000,
        pages: 30,
        author: "AFLL Course Material",
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Mathematical functions, relations, and their properties in formal language theory.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 198
      },
      {
        topic: "Deterministic Finite Automata - AFLL",
        fileName: "3.DFA.pdf",
        fileUrl: "/docs/AFLL/3.DFA.pdf",
        fileSize: 1200000,
        pages: 35,
        author: "AFLL Course Material",
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Complete guide to Deterministic Finite Automata, state diagrams, and transition functions.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 567
      },
      {
        topic: "Non-deterministic Finite Automata - AFLL",
        fileName: "4.NFA.pdf",
        fileUrl: "/docs/AFLL/4.NFA.pdf",
        fileSize: 1100000,
        pages: 32,
        author: "AFLL Course Material",
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Non-deterministic Finite Automata, epsilon transitions, and NFA to DFA conversion.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 423
      },
      {
        topic: "Regular Expressions - AFLL",
        fileName: "RE.pdf",
        fileUrl: "/docs/AFLL/RE.pdf",
        fileSize: 980000,
        pages: 28,
        author: "AFLL Course Material",
        domain: "AFLL",
        year: 3,
        class: "Third Year CSE",
        description: "Regular expressions, pattern matching, and their equivalence with finite automata.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 634
      },
      
      // DSA PDFs
      {
        topic: "DSA Fundamentals - Slide 1",
        fileName: "slide1.pdf",
        fileUrl: "/docs/DSA/slide1.pdf",
        fileSize: 750000,
        pages: 20,
        author: "DSA Course Material",
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Introduction to Data Structures and Algorithms, complexity analysis.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 892
      },
      {
        topic: "Arrays and Linked Lists - DSA",
        fileName: "slide2.pdf",
        fileUrl: "/docs/DSA/slide2.pdf",
        fileSize: 820000,
        pages: 24,
        author: "DSA Course Material",
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Arrays, linked lists, implementation and operations.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 756
      },
      {
        topic: "Stacks and Queues - DSA",
        fileName: "slide3.pdf",
        fileUrl: "/docs/DSA/slide3.pdf",
        fileSize: 780000,
        pages: 22,
        author: "DSA Course Material",
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Stack and queue data structures, applications and implementations.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 678
      },
      {
        topic: "Trees and Graphs - DSA",
        fileName: "slide4.pdf",
        fileUrl: "/docs/DSA/slide4.pdf",
        fileSize: 950000,
        pages: 28,
        author: "DSA Course Material",
        domain: "DSA",
        year: 2,
        class: "Second Year CSE",
        description: "Binary trees, BST, graph algorithms, traversal techniques.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 834
      },
      
      // Math PDFs  
      {
        topic: "Mathematical Foundations",
        fileName: "slide1.pdf",
        fileUrl: "/docs/Math/slide1.pdf",
        fileSize: 680000,
        pages: 18,
        author: "Mathematics Department",
        domain: "Math",
        year: 1,
        class: "First Year Engineering",
        description: "Basic mathematical concepts, calculus fundamentals.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 345
      },
      {
        topic: "Linear Algebra",
        fileName: "slide2.pdf",
        fileUrl: "/docs/Math/slide2.pdf",
        fileSize: 720000,
        pages: 22,
        author: "Mathematics Department",
        domain: "Math",
        year: 1,
        class: "First Year Engineering",
        description: "Matrices, vectors, linear transformations and systems.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 289
      },
      {
        topic: "Differential Equations",
        fileName: "slide3.pdf",
        fileUrl: "/docs/Math/slide3.pdf",
        fileSize: 840000,
        pages: 26,
        author: "Mathematics Department",
        domain: "Math",
        year: 2,
        class: "Second Year Engineering",
        description: "Ordinary differential equations, solutions and applications.",
        approved: true,
        uploadedBy: adminUser._id,
        downloadCount: 412
      }
    ];

    console.log(`Inserting ${pdfData.length} PDFs...`);
    
    // Insert all PDFs
    const insertedPDFs = await PDF.insertMany(pdfData);
    console.log(`✅ Successfully inserted ${insertedPDFs.length} PDFs`);

    // Display summary
    console.log('\n=== PDF DATABASE SUMMARY ===');
    
    const totalPDFs = await PDF.countDocuments();
    console.log(`📚 Total PDFs: ${totalPDFs}`);
    
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

    console.log('\n=== INSERTED PDFs ===');
    const allPDFs = await PDF.find({}, { topic: 1, domain: 1, pages: 1, downloadCount: 1 }).sort({ topic: 1 });
    allPDFs.forEach(pdf => {
      console.log(`📄 ${pdf.topic} [${pdf.domain}] - ${pdf.pages} pages, ${pdf.downloadCount} downloads`);
    });

    console.log('\n✅ PDF database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding PDF database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});
