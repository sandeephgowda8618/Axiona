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
    console.log('Running comprehensive video seeding...');

    // Run the curated videos seeding
    const { execSync } = require('child_process');
    
    console.log('🔄 Running curated videos seeding...');
    execSync('node seedCuratedVideos.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    console.log('✅ Video seeding completed successfully!');
    
    // Get final count
    const totalVideos = await Video.countDocuments();
    console.log(`📊 Total videos in database: ${totalVideos}`);
    
  } catch (error) {
    console.error('❌ Error during video seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
});
