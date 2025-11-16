const mongoose = require('mongoose');

// Import the Video model
const { Video } = require('./src/models/Video');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Function to format duration from seconds to readable format
function formatDuration(durationSec) {
  if (!durationSec) return '0:00';
  
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = durationSec % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to format date
function formatDate(date) {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Function to display all videos with metadata
async function displayAllVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📹 Fetching all videos from database...\n');
    
    // Get all videos with all fields
    const videos = await Video.find({}).sort({ createdAt: -1 });
    
    if (videos.length === 0) {
      console.log('❌ No videos found in the database');
      return;
    }
    
    console.log(`📊 Found ${videos.length} videos in the database\n`);
    console.log('='.repeat(120));
    console.log('📹 VIDEO METADATA DISPLAY');
    console.log('='.repeat(120));
    
    // Group videos by subject/topic for better organization
    const videosByTopic = {};
    videos.forEach(video => {
      const primaryTag = video.topicTags && video.topicTags.length > 0 ? video.topicTags[0] : 'Uncategorized';
      if (!videosByTopic[primaryTag]) {
        videosByTopic[primaryTag] = [];
      }
      videosByTopic[primaryTag].push(video);
    });
    
    // Display videos grouped by topic
    let totalVideoCount = 0;
    Object.keys(videosByTopic).sort().forEach(topic => {
      const topicVideos = videosByTopic[topic];
      console.log(`\n📚 ${topic.toUpperCase()} (${topicVideos.length} videos)`);
      console.log('-'.repeat(80));
      
      topicVideos.forEach((video, index) => {
        totalVideoCount++;
        console.log(`\n${totalVideoCount}. 📹 ${video.title}`);
        console.log(`   👤 Channel: ${video.channelName || 'Unknown'}`);
        console.log(`   ⏱️  Duration: ${formatDuration(video.durationSec)}`);
        console.log(`   🏷️  Tags: ${video.topicTags.join(', ') || 'No tags'}`);
        console.log(`   📅 Upload Date: ${formatDate(video.uploadedAt)}`);
        console.log(`   📊 Stats: ${video.views || 0} views, ${video.likes || 0} likes, ${video.saves || 0} saves`);
        console.log(`   🔗 YouTube URL: https://www.youtube.com/watch?v=${video.youtubeId || 'N/A'}`);
        console.log(`   📝 Description: ${video.description ? (video.description.substring(0, 100) + '...') : 'No description'}`);
        
        if (video.playlistTitle) {
          console.log(`   📂 Playlist: ${video.playlistTitle}${video.episodeNumber ? ` (Episode ${video.episodeNumber})` : ''}`);
        }
        
        console.log(`   🆔 Video ID: ${video._id}`);
        console.log(`   📅 Added: ${formatDate(video.createdAt)}`);
      });
    });
    
    // Summary statistics
    console.log('\n' + '='.repeat(120));
    console.log('📊 DATABASE SUMMARY STATISTICS');
    console.log('='.repeat(120));
    
    const totalDuration = videos.reduce((sum, video) => sum + (video.durationSec || 0), 0);
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0);
    const totalSaves = videos.reduce((sum, video) => sum + (video.saves || 0), 0);
    
    const uniqueChannels = [...new Set(videos.map(v => v.channelName).filter(Boolean))];
    const uniqueTags = [...new Set(videos.flatMap(v => v.topicTags || []))];
    
    console.log(`📹 Total Videos: ${videos.length}`);
    console.log(`⏱️  Total Duration: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`);
    console.log(`👥 Unique Channels: ${uniqueChannels.length}`);
    console.log(`🏷️  Unique Tags: ${uniqueTags.length}`);
    console.log(`👀 Total Views: ${totalViews.toLocaleString()}`);
    console.log(`👍 Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`💾 Total Saves: ${totalSaves.toLocaleString()}`);
    
    // Top channels by video count
    const channelCounts = {};
    videos.forEach(video => {
      if (video.channelName) {
        channelCounts[video.channelName] = (channelCounts[video.channelName] || 0) + 1;
      }
    });
    
    const topChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topChannels.length > 0) {
      console.log('\n🏆 Top 5 Channels by Video Count:');
      topChannels.forEach(([channel, count], index) => {
        console.log(`   ${index + 1}. ${channel}: ${count} videos`);
      });
    }
    
    // Most common tags
    const tagCounts = {};
    videos.forEach(video => {
      if (video.topicTags) {
        video.topicTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    if (topTags.length > 0) {
      console.log('\n🏷️  Top 10 Most Common Tags:');
      topTags.forEach(([tag, count], index) => {
        console.log(`   ${index + 1}. ${tag}: ${count} videos`);
      });
    }
    
    console.log('\n' + '='.repeat(120));
    console.log('✅ Video metadata display completed successfully!');
    console.log('='.repeat(120));
    
  } catch (error) {
    console.error('❌ Error displaying videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Function to display videos with filtering options
async function displayVideosWithFilter(filter = {}) {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('🔍 Applying filters:', JSON.stringify(filter, null, 2));
    
    const videos = await Video.find(filter).sort({ createdAt: -1 });
    
    console.log(`\n📹 Found ${videos.length} videos matching the filter\n`);
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channelName || 'Unknown'}`);
      console.log(`   Duration: ${formatDuration(video.durationSec)}`);
      console.log(`   Tags: ${video.topicTags.join(', ') || 'No tags'}`);
      console.log(`   URL: https://www.youtube.com/watch?v=${video.youtubeId || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error filtering videos:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Function to get specific video by ID
async function getVideoById(videoId) {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      console.log(`❌ Video with ID ${videoId} not found`);
      return;
    }
    
    console.log('📹 Video Details:');
    console.log('='.repeat(60));
    console.log(`Title: ${video.title}`);
    console.log(`Channel: ${video.channelName || 'Unknown'}`);
    console.log(`Duration: ${formatDuration(video.durationSec)}`);
    console.log(`Tags: ${video.topicTags.join(', ') || 'No tags'}`);
    console.log(`Description: ${video.description || 'No description'}`);
    console.log(`YouTube URL: https://www.youtube.com/watch?v=${video.youtubeId || 'N/A'}`);
    console.log(`Views: ${video.views || 0}`);
    console.log(`Likes: ${video.likes || 0}`);
    console.log(`Saves: ${video.saves || 0}`);
    console.log(`Upload Date: ${formatDate(video.uploadedAt)}`);
    console.log(`Added to DB: ${formatDate(video.createdAt)}`);
    
  } catch (error) {
    console.error('❌ Error fetching video:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Display all videos
    await displayAllVideos();
  } else if (args[0] === '--filter') {
    // Display videos with filter
    const filterStr = args[1];
    try {
      const filter = JSON.parse(filterStr);
      await displayVideosWithFilter(filter);
    } catch (error) {
      console.error('❌ Invalid filter JSON:', error.message);
      console.log('Example usage: node display_videos.js --filter \'{"topicTags": "ECE"}\'');
    }
  } else if (args[0] === '--id') {
    // Get specific video by ID
    const videoId = args[1];
    if (!videoId) {
      console.error('❌ Please provide a video ID');
      console.log('Example usage: node display_videos.js --id 673f1234567890abcdef1234');
      return;
    }
    await getVideoById(videoId);
  } else {
    console.log('Usage:');
    console.log('  node display_videos.js                           # Display all videos');
    console.log('  node display_videos.js --filter \'{"topicTags": "ECE"}\'  # Filter videos');
    console.log('  node display_videos.js --id VIDEO_ID             # Get specific video');
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting video metadata display...\n');
  main().catch(console.error);
}

module.exports = {
  displayAllVideos,
  displayVideosWithFilter,
  getVideoById,
  formatDuration,
  formatDate
};
