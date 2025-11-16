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
    console.log('Adding curated video collection to database...');

    // Curated YouTube playlists and videos
    // NOTE: Only the first video from each playlist is included as requested
    const curatedVideos = [
      // ==========================================
      // WEB DEVELOPMENT PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "HTML Tutorial for Beginners: HTML Crash Course",
        description: "Learn HTML basics in this comprehensive crash course. Perfect for beginners starting their web development journey.",
        thumbnailUrl: "https://i.ytimg.com/vi/qz0aGYrrlhU/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=qz0aGYrrlhU",
        youtubeId: "qz0aGYrrlhU",
        durationSec: 3600, // 1 hour
        channelName: "Programming with Mosh",
        topicTags: ["html", "web-development", "frontend"],
        views: 2500000,
        likes: 45000,
        saves: 8900,
        downloads: 2100,
        playlistId: "PLTjRvDozrdlxj-7gc47ytVJurZPUYecyX",
        playlistTitle: "HTML Tutorial for Beginners",
        episodeNumber: 1
      },
      {
        title: "CSS Tutorial - Zero to Hero (Complete Course)",
        description: "Master CSS from basics to advanced concepts. Learn layouts, flexbox, grid, animations, and responsive design.",
        thumbnailUrl: "https://i.ytimg.com/vi/1Rs2ND1ryYc/maxresdefault.jpg", 
        videoUrl: "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
        youtubeId: "1Rs2ND1ryYc",
        durationSec: 21600, // 6 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["css", "web-development", "frontend"],
        views: 1800000,
        likes: 42000,
        saves: 12000,
        downloads: 3400,
        playlistId: "PLWKjhJtqVAbllLK6r2dnGjUVWB_cFNcuO",
        playlistTitle: "CSS Tutorial for Beginners",
        episodeNumber: 1
      },
      {
        title: "JavaScript Crash Course For Beginners",
        description: "Learn JavaScript fundamentals including variables, functions, loops, objects, and DOM manipulation.",
        thumbnailUrl: "https://i.ytimg.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
        youtubeId: "hdI2bqOjy3c",
        durationSec: 6120, // 1 hour 42 minutes
        channelName: "Traversy Media",
        topicTags: ["javascript", "web-development", "programming"],
        views: 3200000,
        likes: 78000,
        saves: 15600,
        downloads: 4200,
        playlistId: "PLWKjhJtqVAbk2qRZtWSzCIN38JC_NdhW5",
        playlistTitle: "JavaScript Fundamentals",
        episodeNumber: 1
      },
      {
        title: "React JS Full Course for Beginners | Complete All-in-One Tutorial",
        description: "Complete React.js course covering components, state, props, hooks, routing, and building real projects.",
        thumbnailUrl: "https://i.ytimg.com/vi/bMknfKXIFA8/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8",
        youtubeId: "bMknfKXIFA8",
        durationSec: 39600, // 11 hours
        channelName: "Dave Gray",
        topicTags: ["react", "javascript", "frontend"],
        views: 1500000,
        likes: 35000,
        saves: 9800,
        downloads: 2800,
        playlistId: "PL0Zuz27SZ-6PrE9srvEn8nbhOOyxnWXfp",
        playlistTitle: "React JS Full Course",
        episodeNumber: 1
      },
      {
        title: "Node.js Tutorial for Beginners: Learn Node in 1 Hour",
        description: "Learn Node.js fundamentals including modules, npm, express, file system, and building REST APIs.",
        thumbnailUrl: "https://i.ytimg.com/vi/TlB_eWDSMt4/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
        youtubeId: "TlB_eWDSMt4",
        durationSec: 3720, // 1 hour 2 minutes
        channelName: "Programming with Mosh",
        topicTags: ["nodejs", "backend", "javascript"],
        views: 2100000,
        likes: 52000,
        saves: 11200,
        downloads: 3100,
        playlistId: "PLTjRvDozrdlyM5MtIC5vnFVSrxs-Bap8Z",
        playlistTitle: "Node.js Tutorial for Beginners",
        episodeNumber: 1
      },

      // ==========================================
      // PYTHON PROGRAMMING PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "Python Tutorial - Python Full Course for Beginners",
        description: "Complete Python programming course covering syntax, data types, control structures, functions, and OOP.",
        thumbnailUrl: "https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
        youtubeId: "_uQrJ0TkZlc",
        durationSec: 21600, // 6 hours
        channelName: "Programming with Mosh",
        topicTags: ["python", "programming", "beginner"],
        views: 4500000,
        likes: 95000,
        saves: 18700,
        downloads: 5600,
        playlistId: "PLTjRvDozrdlxj-7gc47ytVJurZPUYecyX",
        playlistTitle: "Python Tutorial for Beginners",
        episodeNumber: 1
      },
      {
        title: "Python Django Web Framework - Full Course for Beginners",
        description: "Learn Django web framework from scratch. Build real web applications with Python's most popular framework.",
        thumbnailUrl: "https://i.ytimg.com/vi/F5mRW0jo-U4/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=F5mRW0jo-U4",
        youtubeId: "F5mRW0jo-U4",
        durationSec: 14400, // 4 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["django", "python", "web-development"],
        views: 1200000,
        likes: 28000,
        saves: 7800,
        downloads: 2200,
        playlistId: "PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p",
        playlistTitle: "Django Web Framework",
        episodeNumber: 1
      },
      {
        title: "Machine Learning Course for Beginners",
        description: "Introduction to machine learning concepts, algorithms, and practical implementation with Python and scikit-learn.",
        thumbnailUrl: "https://i.ytimg.com/vi/NWONeJKn6kc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=NWONeJKn6kc",
        youtubeId: "NWONeJKn6kc",
        durationSec: 36000, // 10 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["machine-learning", "python", "ai"],
        views: 2800000,
        likes: 67000,
        saves: 14500,
        downloads: 4100,
        playlistId: "PLWKjhJtqVAblcjHlvR7_kzq3-T2ZLprtW",
        playlistTitle: "Machine Learning with Python",
        episodeNumber: 1
      },

      // ==========================================
      // DATA SCIENCE PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "Data Science Full Course - Learn Data Science in 12 Hours",
        description: "Complete data science course covering statistics, Python, pandas, numpy, matplotlib, and machine learning.",
        thumbnailUrl: "https://i.ytimg.com/vi/ua-CiDNNj30/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ua-CiDNNj30",
        youtubeId: "ua-CiDNNj30",
        durationSec: 43200, // 12 hours
        channelName: "Simplilearn",
        topicTags: ["data-science", "python", "analytics"],
        views: 1600000,
        likes: 38000,
        saves: 9200,
        downloads: 2700,
        playlistId: "PLEiEAq2VkUULYYDWK7R7kiIVBVZzRQR2y",
        playlistTitle: "Data Science Full Course",
        episodeNumber: 1
      },
      {
        title: "SQL Tutorial - Full Database Course for Beginners",
        description: "Learn SQL from basics to advanced. Master database queries, joins, functions, and database design.",
        thumbnailUrl: "https://i.ytimg.com/vi/HXV3zeQKqGY/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        youtubeId: "HXV3zeQKqGY",
        durationSec: 14400, // 4 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["sql", "database", "data-science"],
        views: 3100000,
        likes: 72000,
        saves: 16800,
        downloads: 4800,
        playlistId: "PLWKjhJtqVAbllLK6r2dnGjUVWB_cFNcuO",
        playlistTitle: "SQL Database Tutorial",
        episodeNumber: 1
      },

      // ==========================================
      // MOBILE DEVELOPMENT PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "React Native Tutorial for Beginners - Build a React Native App",
        description: "Learn React Native mobile development. Build cross-platform iOS and Android apps with JavaScript.",
        thumbnailUrl: "https://i.ytimg.com/vi/0-S5a0eXPoc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=0-S5a0eXPoc",
        youtubeId: "0-S5a0eXPoc",
        durationSec: 18000, // 5 hours
        channelName: "Programming with Mosh",
        topicTags: ["react-native", "mobile", "javascript"],
        views: 1400000,
        likes: 32000,
        saves: 8100,
        downloads: 2300,
        playlistId: "PLWKjhJtqVAbk2qRZtWSzCIN38JC_NdhW5",
        playlistTitle: "React Native Tutorial",
        episodeNumber: 1
      },
      {
        title: "Flutter Course - Learn Dart & Flutter to Build iOS & Android Apps",
        description: "Complete Flutter course teaching Dart language and Flutter framework for mobile app development.",
        thumbnailUrl: "https://i.ytimg.com/vi/pTJJsmejUOQ/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=pTJJsmejUOQ",
        youtubeId: "pTJJsmejUOQ",
        durationSec: 37800, // 10.5 hours
        channelName: "Academind",
        topicTags: ["flutter", "dart", "mobile"],
        views: 2200000,
        likes: 54000,
        saves: 12600,
        downloads: 3700,
        playlistId: "PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ",
        playlistTitle: "Flutter & Dart - The Complete Guide",
        episodeNumber: 1
      },

      // ==========================================
      // DEVOPS & CLOUD PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "Docker Tutorial for Beginners - A Full DevOps Course",
        description: "Learn Docker containerization from basics to advanced concepts. Master containers, images, and orchestration.",
        thumbnailUrl: "https://i.ytimg.com/vi/3c-iBn73dDE/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=3c-iBn73dDE",
        youtubeId: "3c-iBn73dDE",
        durationSec: 19800, // 5.5 hours
        channelName: "TechWorld with Nana",
        topicTags: ["docker", "devops", "containers"],
        views: 1800000,
        likes: 41000,
        saves: 9700,
        downloads: 2900,
        playlistId: "PLy7NrYWoggjwPggqtFsI_zMAwvG0SqYCb",
        playlistTitle: "Docker Tutorial for Beginners",
        episodeNumber: 1
      },
      {
        title: "AWS Certified Cloud Practitioner Training 2024",
        description: "Complete AWS cloud training course covering core services, pricing, security, and cloud concepts.",
        thumbnailUrl: "https://i.ytimg.com/vi/3hLmDS179YE/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=3hLmDS179YE",
        youtubeId: "3hLmDS179YE",
        durationSec: 14400, // 4 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["aws", "cloud", "certification"],
        views: 980000,
        likes: 23000,
        saves: 6800,
        downloads: 1900,
        playlistId: "PLWKjhJtqVAbll8G2Q9Vh_YLzRPJrR9mjF",
        playlistTitle: "AWS Cloud Practitioner",
        episodeNumber: 1
      },

      // ==========================================
      // CYBERSECURITY PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "Ethical Hacking Full Course - Learn Ethical Hacking in 15 Hours",
        description: "Complete ethical hacking course covering penetration testing, network security, and cybersecurity fundamentals.",
        thumbnailUrl: "https://i.ytimg.com/vi/3Kq1MIfTWCE/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=3Kq1MIfTWCE",
        youtubeId: "3Kq1MIfTWCE",
        durationSec: 54000, // 15 hours
        channelName: "Simplilearn",
        topicTags: ["cybersecurity", "ethical-hacking", "security"],
        views: 1300000,
        likes: 29000,
        saves: 7600,
        downloads: 2200,
        playlistId: "PLEiEAq2VkUULYYDWK7R7kiIVBVZzRQR2y",
        playlistTitle: "Ethical Hacking Course",
        episodeNumber: 1
      },

      // ==========================================
      // COMPUTER SCIENCE FUNDAMENTALS (First Videos)
      // ==========================================
      {
        title: "Data Structures and Algorithms Course - Full Course for Beginners",
        description: "Learn fundamental data structures and algorithms. Master arrays, linked lists, trees, graphs, sorting, and searching.",
        thumbnailUrl: "https://i.ytimg.com/vi/8hly31xKli0/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
        youtubeId: "8hly31xKli0",
        durationSec: 18000, // 5 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["data-structures", "algorithms", "computer-science"],
        views: 2600000,
        likes: 58000,
        saves: 13400,
        downloads: 3900,
        playlistId: "PLWKjhJtqVAbll8G2Q9Vh_YLzRPJrR9mjF",
        playlistTitle: "Data Structures and Algorithms",
        episodeNumber: 1
      },
      {
        title: "Operating Systems Course - Full Course for Beginners",
        description: "Learn operating system concepts including processes, threads, memory management, file systems, and synchronization.",
        thumbnailUrl: "https://i.ytimg.com/vi/mXw9ruZaxzQ/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=mXw9ruZaxzQ",
        youtubeId: "mXw9ruZaxzQ",
        durationSec: 10800, // 3 hours
        channelName: "Neso Academy",
        topicTags: ["operating-systems", "computer-science", "theory"],
        views: 850000,
        likes: 19000,
        saves: 5200,
        downloads: 1500,
        playlistId: "PLBlnK6fEyqRhX6r2uhhlubuF5QextdCSM",
        playlistTitle: "Operating Systems",
        episodeNumber: 1
      },

      // ==========================================
      // DESIGN & UI/UX PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "UI/UX Design Tutorial - Wireframe, Mockup & Design in Figma",
        description: "Learn UI/UX design principles and create professional designs using Figma. Master wireframing and prototyping.",
        thumbnailUrl: "https://i.ytimg.com/vi/c9Wg6Cb_YlU/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
        youtubeId: "c9Wg6Cb_YlU",
        durationSec: 7200, // 2 hours
        channelName: "DesignCourse",
        topicTags: ["ui-ux", "design", "figma"],
        views: 1100000,
        likes: 26000,
        saves: 6900,
        downloads: 2000,
        playlistId: "PLWKjhJtqVAbllLK6r2dnGjUVWB_cFNcuO",
        playlistTitle: "UI/UX Design with Figma",
        episodeNumber: 1
      },

      // ==========================================
      // GAME DEVELOPMENT PLAYLISTS (First Videos)
      // ==========================================
      {
        title: "Unity Tutorial for Beginners - How to Make a Game",
        description: "Learn Unity game development from scratch. Create 2D and 3D games with C# scripting.",
        thumbnailUrl: "https://i.ytimg.com/vi/XtQMytORBmM/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=XtQMytORBmM",
        youtubeId: "XtQMytORBmM",
        durationSec: 16200, // 4.5 hours
        channelName: "Brackeys",
        topicTags: ["unity", "game-development", "c-sharp"],
        views: 2400000,
        likes: 56000,
        saves: 12800,
        downloads: 3600,
        playlistId: "PLPV2KyIb3jR5QFsefuO2RlAgWEz6EvVi6",
        playlistTitle: "Unity Beginner Tutorials",
        episodeNumber: 1
      },

      // ==========================================
      // BLOCKCHAIN & CRYPTOCURRENCY (First Videos)
      // ==========================================
      {
        title: "Blockchain Full Course - 4 Hours | Blockchain Tutorial",
        description: "Complete blockchain technology course covering Bitcoin, Ethereum, smart contracts, and cryptocurrency fundamentals.",
        thumbnailUrl: "https://i.ytimg.com/vi/gyMwXuJrbJQ/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=gyMwXuJrbJQ",
        youtubeId: "gyMwXuJrbJQ",
        durationSec: 14400, // 4 hours
        channelName: "Simplilearn",
        topicTags: ["blockchain", "cryptocurrency", "web3"],
        views: 760000,
        likes: 17000,
        saves: 4800,
        downloads: 1400,
        playlistId: "PLEiEAq2VkUULYYDWK7R7kiIVBVZzRQR2y",
        playlistTitle: "Blockchain Technology",
        episodeNumber: 1
      },

      // ==========================================
      // ARTIFICIAL INTELLIGENCE (First Videos)
      // ==========================================
      {
        title: "Artificial Intelligence Full Course | AI Tutorial for Beginners",
        description: "Complete AI course covering machine learning, deep learning, neural networks, and AI applications.",
        thumbnailUrl: "https://i.ytimg.com/vi/JMUxmLyrhSk/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=JMUxmLyrhSk",
        youtubeId: "JMUxmLyrhSk",
        durationSec: 32400, // 9 hours
        channelName: "Simplilearn",
        topicTags: ["ai", "machine-learning", "deep-learning"],
        views: 1900000,
        likes: 44000,
        saves: 10200,
        downloads: 3000,
        playlistId: "PLEiEAq2VkUULYYDWK7R7kiIVBVZzRQR2y",
        playlistTitle: "Artificial Intelligence Course",
        episodeNumber: 1
      },

      // ==========================================
      // ADDITIONAL POPULAR TECHNOLOGY COURSES
      // ==========================================
      {
        title: "Kubernetes Course - Full Beginners Tutorial",
        description: "Learn Kubernetes container orchestration platform. Master pods, services, deployments, and cluster management.",
        thumbnailUrl: "https://i.ytimg.com/vi/X48VuDVv0do/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=X48VuDVv0do",
        youtubeId: "X48VuDVv0do",
        durationSec: 21600, // 6 hours
        channelName: "TechWorld with Nana",
        topicTags: ["kubernetes", "devops", "containers"],
        views: 1500000,
        likes: 34000,
        saves: 8700,
        downloads: 2500,
        playlistId: "PLy7NrYWoggjwPggqtFsI_zMAwvG0SqYCb",
        playlistTitle: "Kubernetes Tutorial",
        episodeNumber: 1
      },
      {
        title: "Go Programming Language Tutorial - Golang Course for Beginners",
        description: "Learn Go (Golang) programming language from basics to advanced concepts. Build scalable applications.",
        thumbnailUrl: "https://i.ytimg.com/vi/YS4e4q9oBaU/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=YS4e4q9oBaU",
        youtubeId: "YS4e4q9oBaU",
        durationSec: 25200, // 7 hours
        channelName: "freeCodeCamp.org",
        topicTags: ["golang", "programming", "backend"],
        views: 1200000,
        likes: 28000,
        saves: 7300,
        downloads: 2100,
        playlistId: "PLWKjhJtqVAbll8G2Q9Vh_YLzRPJrR9mjF",
        playlistTitle: "Go Programming Tutorial",
        episodeNumber: 1
      },
      {
        title: "TypeScript Course for Beginners - Learn TypeScript from Scratch",
        description: "Master TypeScript programming language. Learn types, interfaces, generics, and advanced TypeScript features.",
        thumbnailUrl: "https://i.ytimg.com/vi/BwuLxPH8IDs/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=BwuLxPH8IDs",
        youtubeId: "BwuLxPH8IDs",
        durationSec: 10800, // 3 hours
        channelName: "Academind",
        topicTags: ["typescript", "javascript", "programming"],
        views: 980000,
        likes: 22000,
        saves: 6100,
        downloads: 1800,
        playlistId: "PL4cUxeGkcC9gKdViBsblBUH4C4kn8-PGN",
        playlistTitle: "TypeScript Tutorial",
        episodeNumber: 1
      }
    ];

    console.log(`Adding ${curatedVideos.length} curated videos...`);
    
    // Add all videos to database
    const savedVideos = await Video.insertMany(curatedVideos);
    console.log(`✅ Successfully added ${savedVideos.length} curated videos to the database`);

    // Display summary
    const topicCounts = {};
    curatedVideos.forEach(video => {
      video.topicTags.forEach(tag => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });
    });

    console.log('\n📊 Topic Distribution:');
    Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([topic, count]) => {
        console.log(`  ${topic}: ${count} videos`);
      });

    console.log('\n🎉 Curated video database seeding completed successfully!');
    console.log(`Total videos in database: ${savedVideos.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding curated videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
});
