const mongoose = require('mongoose');

// Use the existing Video model from the server
const { Video } = require('./src/models/Video');

// Use the same MongoDB URI as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

async function verifyECEVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🔍 Verifying ECE videos in tutorial database...\n');
    
    // Get all ECE videos
    const eceVideos = await Video.find({
      topicTags: { $in: ['ece'] }
    }).sort({ createdAt: -1 });
    
    console.log(`📚 Total ECE videos found: ${eceVideos.length}\n`);
    
    // Group videos by subject
    const subjectGroups = {};
    
    eceVideos.forEach(video => {
      const subjectTag = video.topicTags.find(tag => 
        tag !== 'ece' && 
        tag !== 'electronics_&_communication_engineering' && 
        tag !== 'electronics' && 
        tag !== 'communication' && 
        tag !== 'engineering' && 
        tag !== 'playlist' && 
        tag !== 'video'
      );
      
      if (subjectTag) {
        const subjectName = subjectTag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (!subjectGroups[subjectName]) {
          subjectGroups[subjectName] = [];
        }
        subjectGroups[subjectName].push(video);
      }
    });
    
    console.log('📖 ECE Videos by Subject:');
    console.log('='.repeat(80));
    
    for (const [subject, videos] of Object.entries(subjectGroups)) {
      console.log(`\n📚 ${subject} (${videos.length} videos):`);
      
      videos.forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title}`);
        console.log(`      🔗 YouTube ID: ${video.youtubeId}`);
        console.log(`      📹 Type: ${video.topicTags.includes('playlist') ? 'Playlist' : 'Single Video'}`);
        console.log(`      📝 Description: ${video.description.substring(0, 80)}...`);
        console.log(`      🏷️  Tags: ${video.topicTags.join(', ')}\n`);
      });
    }
    
    // API Response Format Simulation
    console.log('\n' + '='.repeat(80));
    console.log('🌐 Tutorial Hub API Response Format:');
    console.log('='.repeat(80));
    
    // Simulate the API response format that the frontend expects
    const apiResponse = {
      success: true,
      data: eceVideos.slice(0, 10).map(video => ({
        _id: video._id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        youtubeId: video.youtubeId,
        durationSec: video.durationSec,
        channelName: video.channelName,
        topicTags: video.topicTags,
        views: video.views,
        likes: video.likes,
        saves: video.saves,
        downloads: video.downloads,
        uploadedAt: video.uploadedAt,
        createdAt: video.createdAt
      })),
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(eceVideos.length / 10),
        totalVideos: eceVideos.length,
        hasNextPage: eceVideos.length > 10,
        hasPrevPage: false
      }
    };
    
    console.log('Sample API Response (first 10 ECE videos):');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Search functionality verification
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Search Functionality Test:');
    console.log('='.repeat(80));
    
    const searchTerms = ['digital', 'communication', 'embedded', 'vlsi', 'microprocessor'];
    
    for (const term of searchTerms) {
      const searchResults = await Video.find({
        $and: [
          { topicTags: { $in: ['ece'] } },
          {
            $or: [
              { title: { $regex: term, $options: 'i' } },
              { description: { $regex: term, $options: 'i' } },
              { topicTags: { $regex: term, $options: 'i' } }
            ]
          }
        ]
      });
      
      console.log(`🔍 Search for "${term}": ${searchResults.length} results`);
      if (searchResults.length > 0) {
        console.log(`   Top result: ${searchResults[0].title}`);
      }
    }
    
    // Topic filtering verification
    console.log('\n' + '='.repeat(80));
    console.log('🏷️  Topic Filtering Test:');
    console.log('='.repeat(80));
    
    const topicTags = ['digital_logic_design', 'communication_systems', 'embedded_systems', 'vlsi_design'];
    
    for (const tag of topicTags) {
      const topicResults = await Video.find({
        topicTags: { $in: [tag] }
      });
      
      console.log(`🏷️  Topic "${tag.replace(/_/g, ' ')}": ${topicResults.length} videos`);
    }
    
    // Frontend integration format
    console.log('\n' + '='.repeat(80));
    console.log('⚛️  Frontend Tutorial Interface Format:');
    console.log('='.repeat(80));
    
    const frontendFormat = eceVideos.slice(0, 5).map(video => ({
      id: video._id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnailUrl,
      videoId: video.youtubeId,
      duration: `${Math.floor(video.durationSec / 60)}:${(video.durationSec % 60).toString().padStart(2, '0')}`,
      views: video.views,
      publishedAt: video.uploadedAt,
      category: video.topicTags.find(tag => tag.includes('_')) || 'ECE',
      tags: video.topicTags,
      instructor: video.channelName,
      difficulty: 'Intermediate',
      rating: 4.5,
      isLiked: false,
      isSaved: false,
      isDownloaded: false
    }));
    
    console.log('Frontend Tutorial Cards Format:');
    frontendFormat.forEach((tutorial, index) => {
      console.log(`\n📱 Tutorial Card ${index + 1}:`);
      console.log(`   Title: ${tutorial.title}`);
      console.log(`   Category: ${tutorial.category}`);
      console.log(`   Duration: ${tutorial.duration}`);
      console.log(`   Instructor: ${tutorial.instructor}`);
      console.log(`   Thumbnail: ${tutorial.thumbnail}`);
      console.log(`   Video ID: ${tutorial.videoId}`);
    });
    
    console.log('\n🎉 ECE Video verification completed successfully!');
    console.log(`📊 Summary: ${eceVideos.length} ECE videos are ready for the Tutorial Hub`);
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Test how videos are retrieved and displayed
async function testTutorialHubAPI() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 Tutorial Hub API Simulation Test:');
    console.log('='.repeat(80));
    
    // Simulate the API call that TutorialHub.tsx makes
    const page = 1;
    const limit = 20;
    
    const videos = await Video.find({})
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    const total = await Video.countDocuments({});
    
    const apiResponse = {
      success: true,
      data: videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVideos: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
    
    console.log(`📊 Total videos in database: ${total}`);
    console.log(`📄 Videos in current page: ${videos.length}`);
    
    // Count ECE videos in current page
    const eceVideosInPage = videos.filter(v => v.topicTags && v.topicTags.includes('ece'));
    console.log(`📚 ECE videos in current page: ${eceVideosInPage.length}`);
    
    if (eceVideosInPage.length > 0) {
      console.log('\n✅ ECE videos are properly integrated and will appear in Tutorial Hub!');
      console.log('\nSample ECE videos that will be displayed:');
      eceVideosInPage.slice(0, 3).forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API simulation error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run verification
console.log('🚀 Starting ECE video verification and tutorial integration test...\n');
verifyECEVideos()
  .then(() => testTutorialHubAPI())
  .catch(console.error);
