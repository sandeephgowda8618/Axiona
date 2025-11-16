const mongoose = require('mongoose');
const { Book } = require('../src/models/Book');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔄 Seeding ML Reference Books...');

    // ML Reference books data based on the files in docs/library/
    const mlReferenceBooks = [
      {
        title: "AI for Data Analytics",
        author: "Various Authors",
        subject: "Artificial Intelligence",
        category: "Machine Learning",
        description: "Comprehensive guide to using AI techniques for data analytics, covering machine learning algorithms, data preprocessing, and practical implementations.",
        fileName: "AI for data analytics.pdf",
        fileUrl: "/docs/library/AI for data analytics.pdf",
        pages: 450,
        year: 2023,
        tags: ["AI", "Data Analytics", "Machine Learning", "Algorithms"],
        language: "English",
        rating: 4.5,
        reviewCount: 28,
        downloadCount: 156
      },
      {
        title: "Convex Optimization",
        author: "Stephen Boyd, Lieven Vandenberghe",
        subject: "Mathematics",
        category: "Machine Learning",
        description: "Essential mathematical foundations for machine learning, covering convex optimization theory and applications in ML algorithms.",
        fileName: "Convex Optimization.pdf",
        fileUrl: "/docs/library/Convex Optimization.pdf",
        pages: 716,
        year: 2004,
        tags: ["Optimization", "Mathematics", "Convex Analysis", "ML Theory"],
        language: "English",
        rating: 4.8,
        reviewCount: 142,
        downloadCount: 523
      },
      {
        title: "Data Analytics",
        author: "Various Authors",
        subject: "Data Science",
        category: "Data Science",
        description: "Practical approaches to data analytics, including statistical methods, visualization techniques, and business intelligence applications.",
        fileName: "data analytics.pdf",
        fileUrl: "/docs/library/data analytics.pdf",
        pages: 320,
        year: 2022,
        tags: ["Data Analytics", "Statistics", "Visualization", "Business Intelligence"],
        language: "English",
        rating: 4.2,
        reviewCount: 67,
        downloadCount: 234
      },
      {
        title: "DataPoint - VN",
        author: "VN Analytics Team",
        subject: "Data Science",
        category: "Data Science",
        description: "Vietnamese perspective on data science methodologies, featuring local case studies and practical implementations.",
        fileName: "datapoint - vn.pdf",
        fileUrl: "/docs/library/datapoint - vn.pdf",
        pages: 280,
        year: 2023,
        tags: ["Data Science", "Vietnamese", "Case Studies", "Methodology"],
        language: "Vietnamese",
        rating: 4.0,
        reviewCount: 23,
        downloadCount: 89
      },
      {
        title: "Designing ML Systems",
        author: "Chip Huyen",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Comprehensive guide to designing, building, and deploying machine learning systems in production environments.",
        fileName: "Designing Ml systems.pdf",
        fileUrl: "/docs/library/Designing Ml systems.pdf",
        pages: 394,
        year: 2022,
        tags: ["ML Systems", "Production ML", "System Design", "MLOps"],
        language: "English",
        rating: 4.7,
        reviewCount: 189,
        downloadCount: 678
      },
      {
        title: "Fluent Python",
        author: "Luciano Ramalho",
        subject: "Programming",
        category: "Programming",
        description: "Advanced Python programming techniques for data scientists and ML engineers, covering Pythonic patterns and best practices.",
        fileName: "fluent-python.pdf",
        fileUrl: "/docs/library/fluent-python.pdf",
        pages: 792,
        year: 2022,
        tags: ["Python", "Programming", "Advanced", "Data Science"],
        language: "English",
        rating: 4.6,
        reviewCount: 312,
        downloadCount: 892
      },
      {
        title: "Hands-On Machine Learning",
        author: "Aurélien Géron",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Practical machine learning with Scikit-Learn, Keras, and TensorFlow. Hands-on approach to building ML systems.",
        fileName: "Hands-On.pdf",
        fileUrl: "/docs/library/Hands-On.pdf",
        pages: 851,
        year: 2019,
        tags: ["Hands-On", "Scikit-Learn", "TensorFlow", "Keras", "Practical ML"],
        language: "English",
        rating: 4.8,
        reviewCount: 445,
        downloadCount: 1234
      },
      {
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        subject: "Computer Science",
        category: "Programming",
        description: "Comprehensive introduction to algorithms and data structures, essential for understanding ML algorithm implementations.",
        fileName: "Introduction to algorithm.pdf",
        fileUrl: "/docs/library/Introduction to algorithm.pdf",
        pages: 1312,
        year: 2009,
        tags: ["Algorithms", "Data Structures", "Computer Science", "Fundamentals"],
        language: "English",
        rating: 4.9,
        reviewCount: 678,
        downloadCount: 1567
      },
      {
        title: "Linear Algebra Done Right",
        author: "Sheldon Axler",
        subject: "Mathematics",
        category: "Mathematics",
        description: "Linear algebra fundamentals essential for machine learning, presented with clarity and mathematical rigor.",
        fileName: "linear algebra.pdf",
        fileUrl: "/docs/library/linear algebra.pdf",
        pages: 340,
        year: 2015,
        tags: ["Linear Algebra", "Mathematics", "ML Foundations", "Vector Spaces"],
        language: "English",
        rating: 4.7,
        reviewCount: 234,
        downloadCount: 567
      },
      {
        title: "Machine Learning Yearning",
        author: "Andrew Ng",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Practical advice for structuring machine learning projects, debugging ML systems, and making technical decisions.",
        fileName: "Machine Learning yearning.pdf",
        fileUrl: "/docs/library/Machine Learning yearning.pdf",
        pages: 118,
        year: 2018,
        tags: ["ML Strategy", "Andrew Ng", "Project Management", "Best Practices"],
        language: "English",
        rating: 4.6,
        reviewCount: 892,
        downloadCount: 2134
      },
      {
        title: "Machine Learning - A Comprehensive Guide",
        author: "Various Authors",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Comprehensive coverage of machine learning concepts, from basics to advanced topics including deep learning.",
        fileName: "Machine.Learning.pdf",
        fileUrl: "/docs/library/Machine.Learning.pdf",
        pages: 623,
        year: 2021,
        tags: ["Machine Learning", "Comprehensive", "Theory", "Practice"],
        language: "English",
        rating: 4.4,
        reviewCount: 156,
        downloadCount: 434
      },
      {
        title: "ML Problems and Solutions",
        author: "Various Contributors",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Collection of machine learning problems with detailed solutions, perfect for interview preparation and skill building.",
        fileName: "ML_problems.pdf",
        fileUrl: "/docs/library/ML_problems.pdf",
        pages: 287,
        year: 2023,
        tags: ["Problems", "Solutions", "Interview Prep", "Practice"],
        language: "English",
        rating: 4.3,
        reviewCount: 89,
        downloadCount: 267
      },
      {
        title: "Pattern Recognition and Machine Learning",
        author: "Christopher Bishop",
        subject: "Machine Learning",
        category: "Machine Learning",
        description: "Advanced treatment of pattern recognition and machine learning from a Bayesian perspective.",
        fileName: "Pattern Recognition and Machine Learning.pdf",
        fileUrl: "/docs/library/Pattern Recognition and Machine Learning.pdf",
        pages: 738,
        year: 2006,
        tags: ["Pattern Recognition", "Bayesian", "Advanced ML", "Theory"],
        language: "English",
        rating: 4.8,
        reviewCount: 567,
        downloadCount: 1123
      },
      {
        title: "Power BI Intelligence",
        author: "Microsoft Team",
        subject: "Business Intelligence",
        category: "Data Science",
        description: "Complete guide to Microsoft Power BI for data visualization, analytics, and business intelligence solutions.",
        fileName: "power bi intelligence.pdf",
        fileUrl: "/docs/library/power bi intelligence.pdf",
        pages: 456,
        year: 2023,
        tags: ["Power BI", "Business Intelligence", "Visualization", "Microsoft"],
        language: "English",
        rating: 4.1,
        reviewCount: 78,
        downloadCount: 198
      },
      {
        title: "Python Coding Exercises",
        author: "Various Authors",
        subject: "Programming",
        category: "Programming",
        description: "Collection of Python coding exercises and challenges for data science and machine learning applications.",
        fileName: "python coding.pdf",
        fileUrl: "/docs/library/python coding.pdf",
        pages: 234,
        year: 2023,
        tags: ["Python", "Coding", "Exercises", "Practice"],
        language: "English",
        rating: 4.2,
        reviewCount: 67,
        downloadCount: 234
      },
      {
        title: "Sample EDAV (Exploratory Data Analysis and Visualization)",
        author: "Columbia University",
        subject: "Data Science",
        category: "Data Science",
        description: "Comprehensive guide to exploratory data analysis and visualization techniques using modern tools and methods.",
        fileName: "sample EDAV.pdf",
        fileUrl: "/docs/library/sample EDAV.pdf",
        pages: 345,
        year: 2022,
        tags: ["EDA", "Visualization", "Data Analysis", "Columbia"],
        language: "English",
        rating: 4.4,
        reviewCount: 123,
        downloadCount: 345
      },
      {
        title: "SQL Interview Questions",
        author: "Database Experts",
        subject: "Database",
        category: "Programming",
        description: "Comprehensive collection of SQL interview questions and answers for data analysts and data scientists.",
        fileName: "SQL interview.pdf",
        fileUrl: "/docs/library/SQL interview.pdf",
        pages: 167,
        year: 2023,
        tags: ["SQL", "Interview", "Database", "Questions"],
        language: "English",
        rating: 4.3,
        reviewCount: 234,
        downloadCount: 567
      },
      {
        title: "Statistics - The Elements of Statistical Learning",
        author: "Trevor Hastie, Robert Tibshirani, Jerome Friedman",
        subject: "Statistics",
        category: "Mathematics",
        description: "Advanced statistical learning theory and methods, essential for understanding modern machine learning algorithms.",
        fileName: "statistics - questions.pdf",
        fileUrl: "/docs/library/statistics - questions.pdf",
        pages: 745,
        year: 2009,
        tags: ["Statistics", "Statistical Learning", "Theory", "Advanced"],
        language: "English",
        rating: 4.7,
        reviewCount: 389,
        downloadCount: 987
      },
      {
        title: "The Elements of Statistical Learning",
        author: "Trevor Hastie, Robert Tibshirani, Jerome Friedman",
        subject: "Statistics",
        category: "Machine Learning",
        description: "Classic text on statistical learning theory, covering supervised and unsupervised learning methods.",
        fileName: "The Elements.pdf",
        fileUrl: "/docs/library/The Elements.pdf",
        pages: 745,
        year: 2016,
        tags: ["Statistical Learning", "Classic", "Theory", "Comprehensive"],
        language: "English",
        rating: 4.9,
        reviewCount: 567,
        downloadCount: 1456
      },
      {
        title: "Verilog HDL Primer",
        author: "J. Bhasker",
        subject: "Hardware Design",
        category: "Programming",
        description: "Introduction to Verilog HDL for digital system design, useful for understanding hardware acceleration in ML.",
        fileName: "verilog_project.pdf",
        fileUrl: "/docs/library/verilog_project.pdf",
        pages: 298,
        year: 2017,
        tags: ["Verilog", "HDL", "Hardware", "Digital Design"],
        language: "English",
        rating: 3.8,
        reviewCount: 45,
        downloadCount: 123
      }
    ];

    // Clear existing books (optional - remove this if you want to keep existing books)
    // await Book.deleteMany({});
    // console.log('Cleared existing books');

    // Insert new books
    for (const bookData of mlReferenceBooks) {
      try {
        // Check if book already exists
        const existingBook = await Book.findOne({ 
          title: bookData.title,
          author: bookData.author 
        });

        if (existingBook) {
          console.log(`📖 Book "${bookData.title}" already exists, skipping...`);
          continue;
        }

        // Set file size to a reasonable estimate based on pages
        bookData.fileSize = Math.floor(bookData.pages * 0.1 * 1024 * 1024); // ~0.1MB per page estimate

        const book = new Book(bookData);
        await book.save();
        console.log(`✅ Added book: "${bookData.title}" by ${bookData.author}`);
      } catch (error) {
        console.error(`❌ Error adding book "${bookData.title}":`, error.message);
      }
    }

    console.log('\n📊 Seeding Summary:');
    const totalBooks = await Book.countDocuments();
    console.log(`Total books in database: ${totalBooks}`);
    
    const booksByCategory = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📚 Books by category:');
    booksByCategory.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} books`);
    });

  } catch (error) {
    console.error('❌ Error during book seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
});
