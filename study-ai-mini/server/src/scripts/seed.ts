import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { 
  Topic, 
  Video, 
  PDF, 
  TopTutorial, 
  User 
} from '../models'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai'

export async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB for seeding')

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await clearDatabase()

    // Seed data
    await seedTopics()
    await seedVideos()
    await seedPDFs()
    await seedTopTutorials()
    await seedTestUser()

    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

async function clearDatabase() {
  console.log('Clearing existing data...')
  await Promise.all([
    Topic.deleteMany({}),
    Video.deleteMany({}),
    PDF.deleteMany({}),
    TopTutorial.deleteMany({})
  ])
  console.log('Database cleared')
}

async function seedTopics() {
  console.log('Seeding topics...')
  
  const topics = [
    {
      name: 'Computer Science',
      iconUrl: '/icons/computer-science.svg',
      displayOrder: 1,
      isTopFive: true
    },
    {
      name: 'Data Structures',
      iconUrl: '/icons/data-structures.svg',
      displayOrder: 2,
      isTopFive: true
    },
    {
      name: 'Algorithms',
      iconUrl: '/icons/algorithms.svg',
      displayOrder: 3,
      isTopFive: true
    },
    {
      name: 'Machine Learning',
      iconUrl: '/icons/machine-learning.svg',
      displayOrder: 4,
      isTopFive: true
    },
    {
      name: 'Web Development',
      iconUrl: '/icons/web-development.svg',
      displayOrder: 5,
      isTopFive: true
    },
    {
      name: 'Database Systems',
      iconUrl: '/icons/database.svg',
      displayOrder: 6,
      isTopFive: false
    },
    {
      name: 'Operating Systems',
      iconUrl: '/icons/operating-systems.svg',
      displayOrder: 7,
      isTopFive: false
    },
    {
      name: 'Software Engineering',
      iconUrl: '/icons/software-engineering.svg',
      displayOrder: 8,
      isTopFive: false
    }
  ]

  for (const topicData of topics) {
    const existingTopic = await Topic.findOne({ name: topicData.name })
    if (!existingTopic) {
      await Topic.create(topicData)
    }
  }
  
  console.log('Topics seeded')
}

async function seedVideos() {
  console.log('Seeding videos...')
  
  const videos = [
    {
      title: 'Introduction to Data Structures and Algorithms',
      description: 'Learn the fundamentals of data structures and algorithms with practical examples and implementations.',
      thumbnailUrl: 'https://img.youtube.com/vi/8hly31xKli0/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=8hly31xKli0',
      youtubeId: '8hly31xKli0',
      durationSec: 3600,
      channelName: 'CS Dojo',
      topicTags: ['Data Structures', 'Algorithms', 'Computer Science'],
      views: 125000,
      likes: 8500,
      saves: 2300,
      downloads: 450
    },
    {
      title: 'React Tutorial for Beginners - Full Course',
      description: 'Complete React tutorial covering components, state management, hooks, and modern React patterns.',
      thumbnailUrl: 'https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
      youtubeId: 'w7ejDZ8SWv8',
      durationSec: 7200,
      channelName: 'Programming with Mosh',
      topicTags: ['Web Development', 'React', 'JavaScript'],
      views: 89000,
      likes: 6200,
      saves: 1800,
      downloads: 320
    },
    {
      title: 'Machine Learning Explained - A Complete Guide',
      description: 'Comprehensive introduction to machine learning concepts, algorithms, and practical applications.',
      thumbnailUrl: 'https://img.youtube.com/vi/I74ymkoNTnw/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=I74ymkoNTnw',
      youtubeId: 'I74ymkoNTnw',
      durationSec: 5400,
      channelName: 'StatQuest',
      topicTags: ['Machine Learning', 'Data Science', 'Python'],
      views: 234000,
      likes: 15600,
      saves: 4200,
      downloads: 890
    },
    {
      title: 'SQL Database Design Tutorial',
      description: 'Learn database design principles, normalization, and SQL query optimization techniques.',
      thumbnailUrl: 'https://img.youtube.com/vi/ztHopE5Wnpc/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=ztHopE5Wnpc',
      youtubeId: 'ztHopE5Wnpc',
      durationSec: 4500,
      channelName: 'freeCodeCamp',
      topicTags: ['Database Systems', 'SQL', 'Data Management'],
      views: 156000,
      likes: 9800,
      saves: 2700,
      downloads: 560
    },
    {
      title: 'Operating Systems Fundamentals',
      description: 'Deep dive into operating system concepts including processes, memory management, and file systems.',
      thumbnailUrl: 'https://img.youtube.com/vi/26QPDBe-NB8/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=26QPDBe-NB8',
      youtubeId: '26QPDBe-NB8',
      durationSec: 6000,
      channelName: 'Neso Academy',
      topicTags: ['Operating Systems', 'System Programming', 'Computer Science'],
      views: 178000,
      likes: 11200,
      saves: 3100,
      downloads: 670
    }
  ]

  for (const videoData of videos) {
    const existingVideo = await Video.findOne({ youtubeId: videoData.youtubeId })
    if (!existingVideo) {
      await Video.create(videoData)
    }
  }
  
  console.log('Videos seeded')
}

async function seedPDFs() {
  console.log('Seeding PDFs...')
  
  const pdfs = [
    {
      topic: 'Introduction to Algorithms',
      fileName: 'algorithms-intro.pdf',
      fileUrl: 'https://example.com/pdfs/algorithms-intro.pdf',
      fileSize: 2048576, // 2MB
      pages: 45,
      author: 'MIT OpenCourseWare',
      domain: 'CS',
      year: 2023,
      class: 'CS 101',
      description: 'Comprehensive introduction to algorithmic thinking and basic algorithm design techniques.',
      approved: true,
      downloadCount: 1250
    },
    {
      topic: 'Database Management Systems',
      fileName: 'dbms-fundamentals.pdf',
      fileUrl: 'https://example.com/pdfs/dbms-fundamentals.pdf',
      fileSize: 3145728, // 3MB
      pages: 78,
      author: 'Stanford University',
      domain: 'DBMS',
      year: 2023,
      class: 'CS 145',
      description: 'Fundamental concepts of database systems including relational model, SQL, and transaction management.',
      approved: true,
      downloadCount: 980
    },
    {
      topic: 'Machine Learning Basics',
      fileName: 'ml-basics.pdf',
      fileUrl: 'https://example.com/pdfs/ml-basics.pdf',
      fileSize: 4194304, // 4MB
      pages: 92,
      author: 'Andrew Ng',
      domain: 'ML',
      year: 2023,
      class: 'CS 229',
      description: 'Introduction to machine learning algorithms and their applications.',
      approved: true,
      downloadCount: 2340
    },
    {
      topic: 'Web Development with React',
      fileName: 'react-guide.pdf',
      fileUrl: 'https://example.com/pdfs/react-guide.pdf',
      fileSize: 1572864, // 1.5MB
      pages: 67,
      author: 'Meta Developers',
      domain: 'Web Dev',
      year: 2023,
      class: 'WEB 301',
      description: 'Complete guide to building modern web applications with React.js.',
      approved: true,
      downloadCount: 1567
    },
    {
      topic: 'Operating System Concepts',
      fileName: 'os-concepts.pdf',
      fileUrl: 'https://example.com/pdfs/os-concepts.pdf',
      fileSize: 5242880, // 5MB
      pages: 134,
      author: 'Silberschatz, Galvin, Gagne',
      domain: 'OS',
      year: 2023,
      class: 'CS 162',
      description: 'Comprehensive coverage of operating system principles and design.',
      approved: true,
      downloadCount: 1890
    }
  ]

  // Create a test user first to assign as uploader
  let testUser = await User.findOne({ email: 'admin@studyai.com' })
  if (!testUser) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    testUser = await User.create({
      fullName: 'Study AI Admin',
      email: 'admin@studyai.com',
      passwordHash,
      avatarUrl: '/avatars/admin.jpg'
    })
  }

  for (const pdfData of pdfs) {
    const existingPdf = await PDF.findOne({ fileName: pdfData.fileName })
    if (!existingPdf) {
      await PDF.create({
        ...pdfData,
        uploadedBy: testUser._id
      })
    }
  }
  
  console.log('PDFs seeded')
}

async function seedTopTutorials() {
  console.log('Seeding top tutorials...')
  
  // Get some videos to feature as top tutorials
  const videos = await Video.find().limit(3)
  
  if (videos.length > 0) {
    for (let i = 0; i < videos.length; i++) {
      const existingTopTutorial = await TopTutorial.findOne({ videoId: videos[i]._id })
      if (!existingTopTutorial) {
        await TopTutorial.create({
          videoId: videos[i]._id,
          sliderOrder: i + 1
        })
      }
    }
  }
  
  console.log('Top tutorials seeded')
}

async function seedTestUser() {
  console.log('Seeding test user...')
  
  const existingUser = await User.findOne({ email: 'test@studyai.com' })
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('password123', 12)
    await User.create({
      fullName: 'Test User',
      email: 'test@studyai.com',
      passwordHash,
      avatarUrl: '/avatars/test-user.jpg',
      preferences: {
        theme: 'light',
        language: 'en',
        emailNotif: true,
        pushNotif: true,
        reminder: {
          enabled: true,
          time: '09:00',
          frequency: 'daily'
        }
      }
    })
  }
  
  console.log('Test user seeded')
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    mongoose.connection.close()
    process.exit(0)
  }).catch(error => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
}
