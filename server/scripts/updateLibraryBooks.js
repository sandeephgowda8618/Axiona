#!/usr/bin/env node

require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { Book } = require('../src/models/Book');

// Map of actual filenames to book details
const fileToBookMapping = {
  // AI and ML Books
  "AI for data science.pdf": {
    title: "AI for Data Science – Artificial-Intelligence Frameworks and Functionality for Deep Learning, Optimization and Beyond",
    author: "Zacharias Yunus, Emrah Bul",
    subject: "Artificial Intelligence",
    category: "Machine Learning",
    language: "English",
    description: "Hands-on guide to AI frameworks for deep-learning, optimisation and data-science workflows.",
    tags: ["AI", "deep-learning", "optimisation", "data-science", "frameworks"],
    availability: "available",
    downloadCount: 0,
    rating: 4.2,
    reviewCount: 89
  },

  "Convex Optimization – Stephen Boyd & Lieven Vandenberghe.pdf": {
    title: "Convex Optimization",
    author: "Stephen Boyd, Lieven Vandenberghe",
    isbn: "978-0-521-83378-3",
    publisher: "Cambridge University Press",
    edition: "1st",
    subject: "Mathematics",
    category: "Machine Learning",
    year: 2004,
    pages: 716,
    language: "English",
    description: "Comprehensive graduate-level text on convex optimisation theory, algorithms and applications.",
    tags: ["convex-optimisation", "math", "stanford", "cambridge"],
    availability: "available",
    downloadCount: 523,
    rating: 4.8,
    reviewCount: 142
  },

  "Designing Machine Learning Systems- An Iterative Process for Production-Ready Applications – Chip Huyen.pdf": {
    title: "Designing Machine Learning Systems",
    author: "Chip Huyen",
    publisher: "O'Reilly Media",
    edition: "Early Release",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2022,
    pages: 394,
    language: "English",
    description: "Comprehensive guide to designing, building, and deploying machine learning systems in production environments.",
    tags: ["ML Systems", "Production ML", "System Design", "MLOps"],
    availability: "available",
    downloadCount: 678,
    rating: 4.7,
    reviewCount: 189
  },

  "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow.pdf": {
    title: "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow",
    author: "Aurélien Géron",
    isbn: "978-1-492-03264-9",
    publisher: "O'Reilly Media",
    edition: "2nd",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2019,
    pages: 851,
    language: "English",
    description: "Practical machine learning with Scikit-Learn, Keras, and TensorFlow. Hands-on approach to building ML systems.",
    tags: ["Hands-On", "Scikit-Learn", "TensorFlow", "Keras", "Practical ML"],
    availability: "available",
    downloadCount: 1234,
    rating: 4.8,
    reviewCount: 445
  },

  "Introducing MLOps- How to Scale Machine Learning in the Enterprise.pdf": {
    title: "Introducing MLOps",
    author: "Mark Treveil",
    publisher: "O'Reilly Media",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2020,
    pages: 180,
    language: "English",
    description: "How to scale machine learning in the enterprise; compliments of Dataiku.",
    tags: ["mlops", "enterprise", "dataiku", "scaling-ml"],
    availability: "available",
    downloadCount: 234,
    rating: 4.3,
    reviewCount: 78
  },

  "Introduction to Probability – Dimitri P. Bertsekas & John N. Tsitsiklis.pdf": {
    title: "Introduction to Probability",
    author: "Dimitri P. Bertsekas, John N. Tsitsiklis",
    isbn: "978-1-886529-23-6",
    publisher: "Athena Scientific",
    subject: "Mathematics",
    category: "Mathematics",
    year: 2008,
    pages: 544,
    language: "English",
    description: "M.I.T. lecture notes for an intuitive yet rigorous introduction to probability.",
    tags: ["probability", "mathematics", "mit"],
    availability: "available",
    downloadCount: 892,
    rating: 4.6,
    reviewCount: 312
  },

  "ML problem approach - AI , ML.pdf": {
    title: "Approaching (Almost) Any Machine Learning Problem",
    author: "Abhishek Thakur",
    publisher: "Self-published",
    edition: "1st",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2020,
    pages: 256,
    language: "English",
    description: "Competition-proven templates and tricks for tackling real-world ML problems.",
    tags: ["kaggle", "competitions", "tabular-data", "abhishek-thakur"],
    availability: "available",
    downloadCount: 567,
    rating: 4.4,
    reviewCount: 234
  },

  "Machine Learning Engineering (Andriy Burkov) (Z-Library).pdf": {
    title: "Machine Learning Engineering",
    author: "Andriy Burkov",
    publisher: "Burkov Press",
    edition: "1st",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2020,
    pages: 298,
    language: "English",
    description: "Practical guide to productionizing, deploying and maintaining ML systems at scale.",
    tags: ["ml-engineering", "production-ml", "mle", "andriy-burkov"],
    availability: "available",
    downloadCount: 445,
    rating: 4.6,
    reviewCount: 156
  },

  "Machine Learning- A Probabilistic Perspective – Kevin P. Murphy.pdf": {
    title: "Machine Learning: A Probabilistic Perspective",
    author: "Kevin P. Murphy",
    isbn: "978-0-262-01802-9",
    publisher: "MIT Press",
    edition: "1st",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2012,
    pages: 1104,
    language: "English",
    description: "Comprehensive graduate-level introduction to machine learning from a probabilistic viewpoint.",
    tags: ["probabilistic-ml", "bayesian-methods", "kevin-murphy", "mit-press"],
    availability: "available",
    downloadCount: 789,
    rating: 4.5,
    reviewCount: 298
  },

  "Machine.Learning.with.PyTorch.and.Scikit-Learn.Sebastian.Raschka.Packt.9781801819312.EBooksWorld.ir.pdf": {
    title: "Machine Learning with PyTorch and Scikit-Learn",
    author: "Sebastian Raschka, Yuxi (Hayden) Liu",
    publisher: "Packt Publishing",
    edition: "1st",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2022,
    pages: 770,
    language: "English",
    description: "Hands-on deep-learning and ML tutorials using PyTorch and scikit-learn.",
    tags: ["pytorch", "scikit-learn", "deep-learning", "python", "packt"],
    availability: "available",
    downloadCount: 634,
    rating: 4.7,
    reviewCount: 187
  },

  "Pattern Recognition and Machine Learning – Christopher M. Bishop.pdf": {
    title: "Pattern Recognition and Machine Learning",
    author: "Christopher M. Bishop",
    isbn: "978-0-387-31073-2",
    publisher: "Springer",
    edition: "1st",
    subject: "Machine Learning",
    category: "Machine Learning",
    year: 2006,
    pages: 738,
    language: "English",
    description: "Advanced treatment of pattern recognition and machine learning from a Bayesian perspective.",
    tags: ["Pattern Recognition", "Bayesian", "Advanced ML", "Theory"],
    availability: "available",
    downloadCount: 1123,
    rating: 4.8,
    reviewCount: 567
  },

  "The Elements of Statistical Learning- Data Mining, Inference, and Prediction.pdf": {
    title: "The Elements of Statistical Learning – Data Mining, Inference, and Prediction",
    author: "Trevor Hastie, Robert Tibshirani, Jerome Friedman",
    isbn: "978-0-387-84857-0",
    publisher: "Springer",
    edition: "2nd",
    subject: "Statistics",
    category: "Machine Learning",
    year: 2009,
    pages: 745,
    language: "English",
    description: "Classic text on statistical learning theory, covering supervised and unsupervised learning methods.",
    tags: ["Statistical Learning", "Classic", "Theory", "Comprehensive"],
    availability: "available",
    downloadCount: 1456,
    rating: 4.9,
    reviewCount: 567
  },

  // Programming and Data Science
  "fluent-python_-clear-conciseluciano-ramalho-and-effective-programming-oreilly-media-2022.pdf": {
    title: "Fluent Python",
    author: "Luciano Ramalho",
    isbn: "978-1-492-05635-5",
    publisher: "O'Reilly Media",
    edition: "2nd",
    subject: "Programming",
    category: "Programming",
    year: 2022,
    pages: 792,
    language: "English",
    description: "Advanced Python programming techniques for data scientists and ML engineers, covering Pythonic patterns and best practices.",
    tags: ["Python", "Programming", "Advanced", "Data Science"],
    availability: "available",
    downloadCount: 892,
    rating: 4.6,
    reviewCount: 312
  },

  "linear algebra by strang 4 th edition.pdf": {
    title: "Linear Algebra and Its Applications",
    author: "Gilbert Strang",
    publisher: "Cengage Learning",
    edition: "4th",
    subject: "Mathematics",
    category: "Mathematics",
    year: 2006,
    pages: 544,
    language: "English",
    description: "Linear algebra fundamentals essential for machine learning, presented with clarity and mathematical rigor.",
    tags: ["Linear Algebra", "Mathematics", "ML Foundations", "Vector Spaces"],
    availability: "available",
    downloadCount: 567,
    rating: 4.7,
    reviewCount: 234
  },

  "python codes.pdf": {
    title: "Ultimate Python Guide",
    subject: "Programming",
    category: "Programming",
    language: "English",
    description: "Beginner-friendly quick-start guide to Python programming with practical examples.",
    tags: ["python", "guide", "beginner", "coding"],
    availability: "available",
    downloadCount: 234,
    rating: 4.2,
    reviewCount: 67
  },

  // Data Science and Analytics
  "datapot.vn-Practical-Statistics-for-Data-Scientists.pdf": {
    title: "Practical Statistics for Data Scientists – 50+ Essential Concepts Using R and Python",
    author: "Peter Bruce, Andrew Bruce, Peter Gedeck",
    publisher: "O'Reilly Media",
    subject: "Statistics",
    category: "Data Science",
    language: "English",
    description: "Cookbook-style survey of the statistics actually used in day-to-day data-science work.",
    tags: ["statistics", "R", "Python", "OReilly", "data-science"],
    availability: "available",
    downloadCount: 456,
    rating: 4.5,
    reviewCount: 189
  },

  "sample EDA project.pdf": {
    title: "EDA Basics – Super-Store Sales Case Study",
    subject: "Data Science",
    category: "Data Science",
    language: "English",
    description: "Comprehensive guide to exploratory data analysis and visualization techniques using modern tools and methods.",
    tags: ["EDA", "Visualization", "Data Analysis", "Case Study"],
    availability: "available",
    downloadCount: 345,
    rating: 4.4,
    reviewCount: 123
  },

  "statistics - Data science , AI , ML.pdf": {
    title: "The SAGE Dictionary of Statistics",
    author: "Duncan Cramer, Dennis Howitt",
    publisher: "SAGE Publications",
    subject: "Statistics",
    category: "Mathematics",
    language: "English",
    description: "A-Z definitions and short explanations of statistical terms used in psychology & social sciences.",
    tags: ["dictionary", "statistics", "sage", "reference"],
    availability: "available",
    downloadCount: 298,
    rating: 4.1,
    reviewCount: 89
  },

  // Interview and Career
  "data analyst interview questions.pdf": {
    title: "Top 50 Data Analyst Interview Questions & Answers",
    author: "@coding_knowladge",
    subject: "Career",
    category: "Programming",
    language: "English",
    description: "Quick-fire Q&A covering analytics types, data-cleaning, qualitative vs quantitative data, etc.",
    tags: ["interview", "data-analyst", "Q&A", "career"],
    availability: "available",
    downloadCount: 567,
    rating: 4.3,
    reviewCount: 234
  },

  "SQL interview questions.pdf": {
    title: "Top 100 Advanced SQL Questions & Answers for Query Writing",
    subject: "Database",
    category: "Programming",
    language: "English",
    description: "Comprehensive collection of SQL interview questions and answers for data analysts and data scientists.",
    tags: ["SQL", "Interview", "Database", "Questions"],
    availability: "available",
    downloadCount: 567,
    rating: 4.3,
    reviewCount: 234
  },

  "power bi interview questions.pdf": {
    title: "Power BI Questions & Answers",
    subject: "Business Intelligence",
    category: "Data Science",
    language: "English",
    description: "Complete guide to Microsoft Power BI for data visualization, analytics, and business intelligence solutions.",
    tags: ["Power BI", "Business Intelligence", "Visualization", "Microsoft"],
    availability: "available",
    downloadCount: 198,
    rating: 4.1,
    reviewCount: 78
  }
};

async function updateLibraryBooks() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    console.log('🔄 Starting library books update...');

    // First, remove all existing books to start fresh
    await Book.deleteMany({});
    console.log('🗑️  Cleared existing books');

    let addedCount = 0;
    let skippedCount = 0;

    for (const [fileName, bookData] of Object.entries(fileToBookMapping)) {
      try {
        // Create new book with the filename
        const book = new Book({
          ...bookData,
          fileName: fileName,
          // Calculate fileSize from the actual file if needed (placeholder for now)
          fileSize: Math.floor(Math.random() * 50000000) + 5000000, // 5MB to 55MB
          addedDate: new Date(),
          updatedAt: new Date()
        });

        await book.save();
        console.log(`✅ Added: "${bookData.title}"`);
        addedCount++;
      } catch (error) {
        console.log(`❌ Error adding "${bookData.title}":`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Added: ${addedCount} books`);
    console.log(`❌ Failed: ${skippedCount} books`);
    console.log(`📁 Total files mapped: ${Object.keys(fileToBookMapping).length}`);

    // Show final stats
    const totalBooks = await Book.countDocuments();
    console.log(`\n📚 Total books in library: ${totalBooks}`);

    // Show books by category
    const booksByCategory = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Books by Category:');
    booksByCategory.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} books`);
    });

    // Show books by subject
    const booksBySubject = await Book.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Books by Subject:');
    booksBySubject.forEach(subj => {
      console.log(`  ${subj._id}: ${subj.count} books`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating library books:', error);
    process.exit(1);
  }
}

// Run the update
if (require.main === module) {
  updateLibraryBooks();
}

module.exports = { updateLibraryBooks, fileToBookMapping };
