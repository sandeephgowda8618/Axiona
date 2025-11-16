#!/usr/bin/env node

require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { Book } = require('../src/models/Book');

// Additional library books to seed
const additionalBooks = [
  {
    title: "AI for Data Science – Artificial-Intelligence Frameworks and Functionality for Deep Learning, Optimization and Beyond",
    author: "Zacharias Yunus, Emrah Bul",
    subject: "Artificial Intelligence",
    category: "Machine Learning",
    language: "English",
    description: "Hands-on guide to AI frameworks for deep-learning, optimisation and data-science workflows.",
    tags: ["AI", "deep-learning", "optimisation", "data-science", "frameworks"],
    fileName: "AI_for_Data_Science_Zacharias_Bul.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.2,
    reviewCount: 0
  },
  {
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
    fileName: "Boyd_Vandenberghe_Convex_Optimization.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.8,
    reviewCount: 0
  },
  {
    title: "Top 50 Data Analyst Interview Questions & Answers",
    author: "@coding_knowladge",
    subject: "Career",
    category: "Programming",
    language: "English",
    description: "Quick-fire Q&A covering analytics types, data-cleaning, qualitative vs quantitative data, etc.",
    tags: ["interview", "data-analyst", "Q&A", "career"],
    fileName: "Top50_DataAnalyst_Interview_QA.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.1,
    reviewCount: 0
  },
  {
    title: "Practical Statistics for Data Scientists – 50+ Essential Concepts Using R and Python",
    author: "Peter Bruce, Andrew Bruce, Peter Gedeck",
    publisher: "O'Reilly Media",
    subject: "Statistics",
    category: "Data Science",
    language: "English",
    description: "Cookbook-style survey of the statistics actually used in day-to-day data-science work.",
    tags: ["statistics", "R", "Python", "OReilly", "data-science"],
    fileName: "Practical_Statistics_for_Data_Scientists_OReilly.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.5,
    reviewCount: 0
  },
  {
    title: "EDA Basics – Super-Store Sales Case Study",
    subject: "Data Science",
    category: "Data Science",
    language: "English",
    description: "Step-by-step pandas/matplotlib walk-through using the classic Super-Store dataset.",
    tags: ["EDA", "pandas", "matplotlib", "superstore", "jupyter"],
    fileName: "EDA_Basics_Superstore_Sales.ipynb",
    availability: "available",
    downloadCount: 0,
    rating: 4.0,
    reviewCount: 0
  },
  {
    title: "Top 100 Advanced SQL Questions & Answers for Query Writing",
    subject: "Database",
    category: "Programming",
    language: "English",
    description: "Curated advanced SQL snippets: nth-highest salary, duplicates, window functions, etc.",
    tags: ["SQL", "interview", "advanced", "snippets"],
    fileName: "Top100_Advanced_SQL_QA.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.3,
    reviewCount: 0
  },
  {
    title: "The SAGE Dictionary of Statistics",
    author: "Duncan Cramer, Dennis Howitt",
    publisher: "SAGE Publications",
    subject: "Statistics",
    category: "Mathematics",
    language: "English",
    description: "A-Z definitions and short explanations of statistical terms used in psychology & social sciences.",
    tags: ["dictionary", "statistics", "sage", "reference"],
    fileName: "SAGE_Dictionary_of_Statistics_Cramer_Howitt.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.1,
    reviewCount: 0
  },
  {
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
    description: "Graduate-level classic covering supervised & unsupervised learning, sparse models, graphs, etc.",
    tags: ["ESL", "springer", "statistical-learning", "machine-learning"],
    fileName: "Elements_of_Statistical_Learning_2e_Hastie.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.9,
    reviewCount: 0
  },
  {
    title: "Linear Algebra and Its Applications",
    author: "Gilbert Strang",
    publisher: "Cengage Learning",
    edition: "4th",
    subject: "Mathematics",
    category: "Mathematics",
    year: 2006,
    pages: 544,
    language: "English",
    description: "Classic undergraduate text on matrix algebra, vector spaces, orthogonality, eigenvalues and applications.",
    tags: ["linear-algebra", "mathematics", "textbook", "gilbert-strang"],
    fileName: "linear_algebra_strang.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.7,
    reviewCount: 0
  },
  {
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
    fileName: "machine_learning_engineering_burkov.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.6,
    reviewCount: 0
  },
  {
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
    fileName: "ml_probabilistic_perspective_murphy.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.5,
    reviewCount: 0
  },
  {
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
    fileName: "ml_pytorch_scikit_learn.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.7,
    reviewCount: 0
  },
  {
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
    fileName: "approaching_any_ml_problem_thakur.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.4,
    reviewCount: 0
  },
  {
    title: "Power BI Questions & Answers",
    subject: "Business Intelligence",
    category: "Data Science",
    language: "English",
    description: "Quick reference covering Power BI components and comparison with Tableau.",
    tags: ["power-bi", "tableau", "bi-tools", "faq"],
    fileName: "power_bi_qa_sheet.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.0,
    reviewCount: 0
  },
  {
    title: "Ultimate Python Guide",
    subject: "Programming",
    category: "Programming",
    language: "English",
    description: "Beginner-friendly quick-start guide to Python.",
    tags: ["python", "guide", "beginner"],
    fileName: "ultimate_python_guide.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.2,
    reviewCount: 0
  },
  {
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
    fileName: "introducing_mlops_treveil.pdf",
    availability: "available",
    downloadCount: 0,
    rating: 4.3,
    reviewCount: 0
  }
];

async function seedAdditionalBooks() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    console.log(`Starting to seed ${additionalBooks.length} additional library books...`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const bookData of additionalBooks) {
      // Check if book already exists by title and author
      const existingBook = await Book.findOne({
        title: bookData.title,
        author: bookData.author || { $exists: false }
      });

      if (existingBook) {
        console.log(`📚 Skipped: "${bookData.title}" (already exists)`);
        skippedCount++;
        continue;
      }

      // Create new book
      const book = new Book(bookData);
      await book.save();
      console.log(`✅ Added: "${bookData.title}" by ${bookData.author || 'Unknown'}`);
      addedCount++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Added: ${addedCount} books`);
    console.log(`⏭️  Skipped: ${skippedCount} books (already exist)`);
    console.log(`📖 Total attempted: ${additionalBooks.length} books`);

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

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding additional books:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedAdditionalBooks();
}

module.exports = { seedAdditionalBooks, additionalBooks };
