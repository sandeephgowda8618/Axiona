const mongoose = require('mongoose');
const { Video } = require('../src/models/Video');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing videos
    console.log('Clearing existing videos...');
    await Video.deleteMany({});
    console.log('✅ Existing videos cleared');

    // All videos data in one place
    const allVideos = [
      // ==========================================
      // STANDALONE VIDEOS
      // ==========================================
      {
        title: "SQL Database Design - Normalization and Best Practices",
        description: "Learn database design principles, normalization, relationships, and SQL best practices for efficient database management.",
        thumbnailUrl: "https://i.ytimg.com/vi/UrYLYV7WSHM/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=UrYLYV7WSHM",
        youtubeId: "UrYLYV7WSHM",
        durationSec: 14520, // 4 hours 2 minutes
        channelName: "Database Masters",
        topicTags: ["sql", "database", "design"],
        views: 167000,
        likes: 4500,
        saves: 890,
        downloads: 234
      },
      {
        title: "Git and GitHub - Version Control Mastery",
        description: "Master Git version control and GitHub collaboration. Learn branching, merging, pull requests, and team workflows.",
        thumbnailUrl: "https://i.ytimg.com/vi/RGOj5yH7evk/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
        youtubeId: "RGOj5yH7evk",
        durationSec: 7200, // 2 hours
        channelName: "DevOps Academy",
        topicTags: ["git", "github", "version-control"],
        views: 234000,
        likes: 6700,
        saves: 1200,
        downloads: 445
      },
      {
        title: "Docker for Beginners - Containerization Made Easy",
        description: "Complete Docker tutorial covering containers, images, volumes, networking, and Docker Compose for beginners.",
        thumbnailUrl: "https://i.ytimg.com/vi/fqMOX6JJhGo/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
        youtubeId: "fqMOX6JJhGo",
        durationSec: 9000, // 2.5 hours
        channelName: "Container Academy",
        topicTags: ["docker", "containers", "devops"],
        views: 189000,
        likes: 5200,
        saves: 950,
        downloads: 320
      },
      {
        title: "API Design Best Practices - RESTful APIs",
        description: "Learn REST API design principles, HTTP methods, status codes, authentication, and best practices for scalable APIs.",
        thumbnailUrl: "https://i.ytimg.com/vi/flCGHaMajFo/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=flCGHaMajFo",
        youtubeId: "flCGHaMajFo",
        durationSec: 6300, // 1 hour 45 minutes
        channelName: "API Masters",
        topicTags: ["api", "rest", "backend"],
        views: 145000,
        likes: 3800,
        saves: 720,
        downloads: 198
      },
      {
        title: "CSS Grid Layout - Complete Guide",
        description: "Master CSS Grid Layout with practical examples. Learn grid containers, items, areas, and responsive design patterns.",
        thumbnailUrl: "https://i.ytimg.com/vi/jV8B24rSN5o/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=jV8B24rSN5o",
        youtubeId: "jV8B24rSN5o",
        durationSec: 5400, // 1.5 hours
        channelName: "CSS Masters",
        topicTags: ["css", "grid", "layout"],
        views: 198000,
        likes: 5600,
        saves: 1100,
        downloads: 387
      },
      {
        title: "TypeScript Crash Course - JavaScript with Types",
        description: "Learn TypeScript fundamentals, type annotations, interfaces, generics, and how to integrate with existing JavaScript projects.",
        thumbnailUrl: "https://i.ytimg.com/vi/BwuLxPH8IDs/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=BwuLxPH8IDs",
        youtubeId: "BwuLxPH8IDs",
        durationSec: 7800, // 2 hours 10 minutes
        channelName: "TypeScript Academy",
        topicTags: ["typescript", "javascript", "types"],
        views: 276000,
        likes: 7200,
        saves: 1400,
        downloads: 523
      },

      // ==========================================
      // JAVASCRIPT FUNDAMENTALS COMPLETE COURSE
      // ==========================================
      {
        title: "JavaScript Fundamentals - Variables and Data Types",
        description: "Learn JavaScript variables, data types, operators, and basic syntax. Perfect starting point for beginners.",
        thumbnailUrl: "https://i.ytimg.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
        youtubeId: "hdI2bqOjy3c",
        durationSec: 2400, // 40 minutes
        channelName: "JavaScript Academy",
        topicTags: ["javascript", "variables", "data-types"],
        views: 156000,
        likes: 4200,
        saves: 890,
        downloads: 267,
        playlistId: "js_fundamentals_series",
        playlistTitle: "JavaScript Fundamentals Complete Course",
        episodeNumber: 1
      },
      {
        title: "JavaScript Fundamentals - Functions and Scope",
        description: "Deep dive into JavaScript functions, scope, closures, and function expressions. Master the core concepts.",
        thumbnailUrl: "https://i.ytimg.com/vi/N8ap4k_1QEQ/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=N8ap4k_1QEQ",
        youtubeId: "N8ap4k_1QEQ",
        durationSec: 3600, // 1 hour
        channelName: "JavaScript Academy",
        topicTags: ["javascript", "functions", "scope"],
        views: 142000,
        likes: 3900,
        saves: 765,
        downloads: 234,
        playlistId: "js_fundamentals_series",
        playlistTitle: "JavaScript Fundamentals Complete Course",
        episodeNumber: 2
      },
      {
        title: "JavaScript Fundamentals - Arrays and Objects",
        description: "Master JavaScript arrays and objects, including methods, properties, and advanced manipulation techniques.",
        thumbnailUrl: "https://i.ytimg.com/vi/W6NZfCO5SIk/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
        youtubeId: "W6NZfCO5SIk",
        durationSec: 4200, // 1 hour 10 minutes
        channelName: "JavaScript Academy",
        topicTags: ["javascript", "arrays", "objects"],
        views: 178000,
        likes: 4800,
        saves: 980,
        downloads: 312,
        playlistId: "js_fundamentals_series",
        playlistTitle: "JavaScript Fundamentals Complete Course",
        episodeNumber: 3
      },
      {
        title: "JavaScript Fundamentals - DOM Manipulation",
        description: "Learn to manipulate the DOM with JavaScript. Event handling, element selection, and dynamic content creation.",
        thumbnailUrl: "https://i.ytimg.com/vi/0ik6X4DJKCc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=0ik6X4DJKCc",
        youtubeId: "0ik6X4DJKCc",
        durationSec: 5400, // 1.5 hours
        channelName: "JavaScript Academy",
        topicTags: ["javascript", "dom", "events"],
        views: 203000,
        likes: 5600,
        saves: 1200,
        downloads: 398,
        playlistId: "js_fundamentals_series",
        playlistTitle: "JavaScript Fundamentals Complete Course",
        episodeNumber: 4
      },
      {
        title: "JavaScript Fundamentals - Asynchronous Programming",
        description: "Master async JavaScript with promises, async/await, fetch API, and handling asynchronous operations.",
        thumbnailUrl: "https://i.ytimg.com/vi/PoRJizFvM7s/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=PoRJizFvM7s",
        youtubeId: "PoRJizFvM7s",
        durationSec: 6000, // 1 hour 40 minutes
        channelName: "JavaScript Academy",
        topicTags: ["javascript", "async", "promises"],
        views: 187000,
        likes: 5100,
        saves: 1100,
        downloads: 445,
        playlistId: "js_fundamentals_series",
        playlistTitle: "JavaScript Fundamentals Complete Course",
        episodeNumber: 5
      },

      // ==========================================
      // REACT COMPLETE COURSE - BEGINNER TO ADVANCED
      // ==========================================
      {
        title: "React Complete Course - Getting Started with React",
        description: "Introduction to React, JSX, components, and setting up your first React application. Perfect for beginners.",
        thumbnailUrl: "https://i.ytimg.com/vi/w7ejDZ8SWv8/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
        youtubeId: "w7ejDZ8SWv8",
        durationSec: 4800, // 1 hour 20 minutes
        channelName: "React Masters",
        topicTags: ["react", "jsx", "components"],
        views: 298000,
        likes: 8900,
        saves: 1890,
        downloads: 567,
        playlistId: "react_complete_series",
        playlistTitle: "React Complete Course - Beginner to Advanced",
        episodeNumber: 1
      },
      {
        title: "React Complete Course - State and Props",
        description: "Deep dive into React state management, props, component communication, and data flow patterns.",
        thumbnailUrl: "https://i.ytimg.com/vi/O6P86uwfdR0/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=O6P86uwfdR0",
        youtubeId: "O6P86uwfdR0",
        durationSec: 5400, // 1.5 hours
        channelName: "React Masters",
        topicTags: ["react", "state", "props"],
        views: 267000,
        likes: 7800,
        saves: 1650,
        downloads: 489,
        playlistId: "react_complete_series",
        playlistTitle: "React Complete Course - Beginner to Advanced",
        episodeNumber: 2
      },
      {
        title: "React Complete Course - Event Handling and Forms",
        description: "Master React event handling, form validation, controlled components, and user input management.",
        thumbnailUrl: "https://i.ytimg.com/vi/7Vo_VCcWupQ/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=7Vo_VCcWupQ",
        youtubeId: "7Vo_VCcWupQ",
        durationSec: 4200, // 1 hour 10 minutes
        channelName: "React Masters",
        topicTags: ["react", "events", "forms"],
        views: 234000,
        likes: 6900,
        saves: 1450,
        downloads: 423,
        playlistId: "react_complete_series",
        playlistTitle: "React Complete Course - Beginner to Advanced",
        episodeNumber: 3
      },

      // ==========================================
      // PYTHON DATA SCIENCE COMPLETE COURSE
      // ==========================================
      {
        title: "Python Data Science - Introduction to NumPy",
        description: "Learn NumPy fundamentals for data science. Arrays, mathematical operations, broadcasting, and performance optimization.",
        thumbnailUrl: "https://i.ytimg.com/vi/QUT1VHiLmmI/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=QUT1VHiLmmI",
        youtubeId: "QUT1VHiLmmI",
        durationSec: 7200, // 2 hours
        channelName: "Python Data Academy",
        topicTags: ["python", "numpy", "data-science"],
        views: 345000,
        likes: 9800,
        saves: 2100,
        downloads: 678,
        playlistId: "python_data_science_series",
        playlistTitle: "Python Data Science Complete Course",
        episodeNumber: 1
      },
      {
        title: "Python Data Science - Pandas for Data Analysis",
        description: "Master Pandas for data manipulation and analysis. DataFrames, data cleaning, aggregation, and visualization prep.",
        thumbnailUrl: "https://i.ytimg.com/vi/vmEHCJofslg/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vmEHCJofslg",
        youtubeId: "vmEHCJofslg",
        durationSec: 8400, // 2 hours 20 minutes
        channelName: "Python Data Academy",
        topicTags: ["python", "pandas", "data-analysis"],
        views: 312000,
        likes: 8700,
        saves: 1950,
        downloads: 612,
        playlistId: "python_data_science_series",
        playlistTitle: "Python Data Science Complete Course",
        episodeNumber: 2
      }
    ];

    console.log(`Inserting ${allVideos.length} videos...`);
    
    // Insert all videos
    const insertedVideos = await Video.insertMany(allVideos);
    console.log(`✅ Successfully inserted ${insertedVideos.length} videos`);

    // Display summary
    console.log('\n=== DATABASE SUMMARY ===');
    
    const totalVideos = await Video.countDocuments();
    console.log(`📊 Total videos: ${totalVideos}`);
    
    const standaloneCount = await Video.countDocuments({ playlistId: { $exists: false } });
    console.log(`🎬 Standalone videos: ${standaloneCount}`);
    
    const playlistCount = await Video.countDocuments({ playlistId: { $exists: true } });
    console.log(`📺 Playlist videos: ${playlistCount}`);
    
    console.log('\n=== PLAYLISTS ===');
    const playlists = await Video.aggregate([
      { $match: { playlistId: { $exists: true } } },
      { 
        $group: { 
          _id: '$playlistId', 
          title: { $first: '$playlistTitle' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { title: 1 } }
    ]);
    
    playlists.forEach(playlist => {
      console.log(`📚 ${playlist.title} (${playlist.count} episodes)`);
    });

    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});
