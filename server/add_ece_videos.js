const mongoose = require('mongoose');

// Use the existing Video model from the server
const { Video } = require('./src/models/Video');

// Use the same MongoDB URI as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Helper function to extract YouTube ID from URL
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to generate thumbnail URL from YouTube ID
function getThumbnailUrl(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

// Electronics & Communication Engineering (ECE) Core Subjects Data
const eceSubjects = [
  {
    subject: "Electronic Devices and Circuits",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Electronic Devices and Circuits - Complete Course",
        url: "https://www.youtube.com/watch?v=n9ZytPvXi7w&list=PL3eEXnCBViH_ynvBiNPBBkzCOZ4vDCG7f",
        type: "playlist",
        description: "Complete course on electronic devices and circuits covering diodes, transistors, amplifiers, and circuit analysis."
      },
      {
        title: "Electronic Devices and Circuits - Gate Lectures",
        url: "https://www.youtube.com/watch?v=7jaa1rlW7Ak&list=PLBlnK6fEyqRiw-GZRqfnlVIBz9dxrqHJS",
        type: "playlist",
        description: "GATE focused lectures on electronic devices and circuits with problem-solving techniques."
      },
      {
        title: "Electronic Devices and Circuits - One Shot",
        url: "https://www.youtube.com/watch?v=l7Kmtoxrld4",
        type: "video",
        description: "One-shot comprehensive tutorial covering all essential topics in electronic devices and circuits."
      },
      {
        title: "Electronic Devices and Circuits - Revision Video",
        url: "https://www.youtube.com/watch?v=pHNbm-4reIc&t=680s",
        type: "video",
        description: "Quick revision video for electronic devices and circuits with key concepts and formulas."
      }
    ]
  },
  {
    subject: "Digital Logic Design",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Digital Logic Design - Complete Course",
        url: "https://www.youtube.com/watch?v=O0gtKDu_cJc&list=PLxCzCOWd7aiGmXg4NoX6R31AsC5LeCPHe",
        type: "playlist",
        description: "Comprehensive digital logic design course covering Boolean algebra, logic gates, and digital circuits."
      },
      {
        title: "Digital Logic Design - Gate Smashers",
        url: "https://www.youtube.com/watch?v=--dVx5AD_Gw&list=PLXj4XH7LcRfBQXAd8FPZXmMzxZY-rViLP",
        type: "playlist",
        description: "Digital logic design playlist focusing on GATE preparation with solved examples."
      },
      {
        title: "Digital Logic Design - Basics",
        url: "https://www.youtube.com/watch?v=--dVx5AD_Gw",
        type: "video",
        description: "Introduction to digital logic design concepts and fundamentals."
      },
      {
        title: "Digital Logic Design - One Shot",
        url: "https://www.youtube.com/watch?v=pHNbm-4reIc&t=680s",
        type: "video",
        description: "Complete one-shot video covering digital logic design for quick revision."
      }
    ]
  },
  {
    subject: "Signals and Systems",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Signals and Systems - Complete Course",
        url: "https://www.youtube.com/watch?v=-jyvlVnnhfk&list=PLPvaSRcEQh4l5h9QsJqREYUvsxcZ0aiiy",
        type: "playlist",
        description: "Comprehensive signals and systems course covering continuous and discrete-time signals, Fourier transforms, and system analysis."
      },
      {
        title: "Signals and Systems - GATE Lectures",
        url: "https://www.youtube.com/watch?v=s8rsR_TStaA&list=PLBlnK6fEyqRhG6s3jYIU48CqsT5cyiDTO",
        type: "playlist",
        description: "GATE focused signals and systems lectures with solved problems and exam strategies."
      },
      {
        title: "Signals and Systems - One Shot",
        url: "https://www.youtube.com/watch?v=I-KfGK37dRk",
        type: "video",
        description: "Complete one-shot tutorial on signals and systems covering all important topics."
      },
      {
        title: "Signals and Systems - Quick Revision",
        url: "https://www.youtube.com/watch?v=I-KfGK37dRk",
        type: "video",
        description: "Quick revision video for signals and systems with key formulas and concepts."
      }
    ]
  },
  {
    subject: "Network Theory",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Network Theory - Complete Course",
        url: "https://www.youtube.com/watch?v=-YVvO1QYaMI&list=PL3eEXnCBViH-sapLfY9RfnNQWry7HpFBE",
        type: "playlist",
        description: "Complete network theory course covering circuit analysis, network theorems, and two-port networks."
      },
      {
        title: "Network Theory - GATE Preparation",
        url: "https://www.youtube.com/watch?v=-DN2S-hmbis&list=PLBlnK6fEyqRgLR-hMp7wem-bdVN1iEhsh",
        type: "playlist",
        description: "Network theory playlist specifically designed for GATE exam preparation."
      },
      {
        title: "Network Theory - One Shot",
        url: "https://www.youtube.com/watch?v=U0eWhYw-92Y",
        type: "video",
        description: "Comprehensive one-shot video covering all network theory concepts."
      },
      {
        title: "Network Theory - Quick Tutorial",
        url: "https://www.youtube.com/watch?v=wO-f7l9l-E0",
        type: "video",
        description: "Quick tutorial on network theory fundamentals and important concepts."
      }
    ]
  },
  {
    subject: "Analog Circuits",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Analog Circuits - Complete Course",
        url: "https://www.youtube.com/watch?v=1zg4EY148m0&list=PL0c0N7xv8s05MjPmenQrMW3rJJtJ-aJLF",
        type: "playlist",
        description: "Comprehensive analog circuits course covering op-amps, filters, oscillators, and amplifier circuits."
      },
      {
        title: "Analog Circuits - Advanced Topics",
        url: "https://www.youtube.com/watch?v=7jaa1rlW7Ak&list=PLBlnK6fEyqRiw-GZRqfnlVIBz9dxrqHJS",
        type: "playlist",
        description: "Advanced analog circuits topics including feedback systems and frequency response."
      },
      {
        title: "Analog Circuits - One Shot",
        url: "https://www.youtube.com/watch?v=De9MvoP3WTI",
        type: "video",
        description: "Complete one-shot video covering analog circuits for quick learning."
      },
      {
        title: "Analog Circuits - Fundamentals",
        url: "https://www.youtube.com/watch?v=39Lsz6pFGRo",
        type: "video",
        description: "Fundamentals of analog circuits with practical examples and applications."
      }
    ]
  },
  {
    subject: "Microprocessors and Microcontrollers",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Microprocessors and Microcontrollers - Complete Course",
        url: "https://www.youtube.com/watch?v=-Q99XiiKfXg&list=PLBlnK6fEyqRgyFCCgqdcBowmSp_BTKs4F",
        type: "playlist",
        description: "Comprehensive course on microprocessors and microcontrollers covering 8085, 8086, and ARM processors."
      },
      {
        title: "Microprocessors - Advanced Topics",
        url: "https://www.youtube.com/watch?v=OVU0FA5Sgks&list=PLU-faXGCDVRKKQ70WuQ1JN3TwsqzPyZ5p",
        type: "playlist",
        description: "Advanced microprocessor topics including programming and interfacing."
      },
      {
        title: "Microprocessors and Microcontrollers - One Shot",
        url: "https://www.youtube.com/watch?v=2MxTZOS9yhM",
        type: "video",
        description: "Complete one-shot tutorial on microprocessors and microcontrollers."
      },
      {
        title: "Microcontrollers - Programming Guide",
        url: "https://www.youtube.com/watch?v=1GugP_Lnfyk",
        type: "video",
        description: "Programming guide for microcontrollers with practical examples."
      }
    ]
  },
  {
    subject: "Communication Systems",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Communication Systems - Complete Course",
        url: "https://www.youtube.com/watch?v=O5Y_fJqHEco&list=PL3eEXnCBViH9XJFSr_u4KDhtIihTJ6Kl6",
        type: "playlist",
        description: "Comprehensive communication systems course covering modulation, demodulation, and digital communication."
      },
      {
        title: "Communication Systems - Advanced",
        url: "https://www.youtube.com/watch?v=75waFwcql7Q&list=PLjvx7xqdpePJ8EGZq9qF4VMT4SH8j0dnY",
        type: "playlist",
        description: "Advanced communication systems topics including error correction and channel coding."
      },
      {
        title: "Communication Systems - One Shot",
        url: "https://www.youtube.com/watch?v=lhCfLR3rQAY",
        type: "video",
        description: "Complete one-shot video on communication systems fundamentals."
      },
      {
        title: "Communication Systems - Quick Review",
        url: "https://www.youtube.com/watch?v=8NgMqK9X79Y",
        type: "video",
        description: "Quick review of communication systems for exam preparation."
      }
    ]
  },
  {
    subject: "Electromagnetic Field Theory",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Electromagnetic Field Theory - Complete Course",
        url: "https://www.youtube.com/watch?v=04-smh1c1tY&list=PL_mruqjnuVd87sjSDVS9wuit9CSpgIIfx",
        type: "playlist",
        description: "Comprehensive electromagnetic field theory course covering Maxwell's equations and wave propagation."
      },
      {
        title: "Electromagnetic Fields - Advanced Topics",
        url: "https://www.youtube.com/watch?v=6WjEt8VRntY&list=PL5zwY2E7i60UOvHJEOpJEw-lR2Zdmg2Ik",
        type: "playlist",
        description: "Advanced electromagnetic field topics including antenna theory and waveguides."
      },
      {
        title: "Electromagnetic Field Theory - One Shot",
        url: "https://www.youtube.com/watch?v=BC4055r6aW0",
        type: "video",
        description: "Complete one-shot tutorial on electromagnetic field theory."
      },
      {
        title: "EM Fields - Quick Tutorial",
        url: "https://www.youtube.com/watch?v=ccosF5Q0kWU",
        type: "video",
        description: "Quick tutorial on electromagnetic fields and their applications."
      }
    ]
  },
  {
    subject: "Control Systems",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Control Systems - Complete Course",
        url: "https://www.youtube.com/watch?v=PNtFWE2hvVw&list=PLgwJf8NK-2e4la19aADOg_M5dCAxmwmfZ",
        type: "playlist",
        description: "Comprehensive control systems course covering feedback control, stability analysis, and controller design."
      },
      {
        title: "Control Systems - Advanced Topics",
        url: "https://www.youtube.com/watch?v=AdvcQ4Jzk_E&list=PL3eEXnCBViH9qIl0vB-8a5vodNlPlkxq5",
        type: "playlist",
        description: "Advanced control systems topics including modern control theory and state-space analysis."
      },
      {
        title: "Control Systems - One Shot",
        url: "https://www.youtube.com/watch?v=RRKPiD_zFqU",
        type: "video",
        description: "Complete one-shot video covering control systems engineering."
      },
      {
        title: "Control Systems - Quick Guide",
        url: "https://www.youtube.com/watch?v=YaorQEAHHT4",
        type: "video",
        description: "Quick guide to control systems for engineering students."
      }
    ]
  },
  {
    subject: "VLSI Design",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "VLSI Design - Complete Course",
        url: "https://www.youtube.com/watch?v=ONU-zFBzlXo&list=PLgwJf8NK-2e6au9bX9P_bA3ywxqigCsaC",
        type: "playlist",
        description: "Comprehensive VLSI design course covering CMOS technology, layout design, and verification."
      },
      {
        title: "VLSI Design - Advanced Topics",
        url: "https://www.youtube.com/watch?v=-08k-ff1TK0&list=PLXOntjLNZ9zpoLbMZ3a_svp5u7Y4xRul9",
        type: "playlist",
        description: "Advanced VLSI design topics including low-power design and testing."
      },
      {
        title: "VLSI Design - One Shot",
        url: "https://www.youtube.com/watch?v=AFyG3wRuq40&t=1499s",
        type: "video",
        description: "Complete one-shot tutorial on VLSI design fundamentals."
      },
      {
        title: "VLSI Design - Quick Overview",
        url: "https://www.youtube.com/watch?v=pHNbm-4reIc&t=680s",
        type: "video",
        description: "Quick overview of VLSI design concepts and methodologies."
      }
    ]
  },
  {
    subject: "Embedded Systems",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Embedded Systems - Complete Course",
        url: "https://www.youtube.com/watch?v=0qZ_J3uxWmE&list=PLvu-LC7buiaWFnFJu2lo8ceQdXtQpyI3w",
        type: "playlist",
        description: "Comprehensive embedded systems course covering microcontrollers, real-time systems, and IoT applications."
      },
      {
        title: "Embedded Systems - Programming",
        url: "https://www.youtube.com/watch?v=PDYuYGHT668&list=PLYwpaL_SFmcBpuYagx0JiSaM-Bi4dm0hG",
        type: "playlist",
        description: "Embedded systems programming with C and assembly language."
      },
      {
        title: "Embedded Systems - One Shot",
        url: "https://www.youtube.com/watch?v=JO4AEkOVF2M",
        type: "video",
        description: "Complete one-shot video on embedded systems fundamentals."
      },
      {
        title: "Embedded Systems - Quick Tutorial",
        url: "https://www.youtube.com/watch?v=RAMLdPuGbxc",
        type: "video",
        description: "Quick tutorial on embedded systems design and applications."
      }
    ]
  },
  {
    subject: "Digital Signal Processing (DSP)",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Digital Signal Processing - Complete Course",
        url: "https://www.youtube.com/watch?v=4hVWXQEVYSA&list=PLnPkMfyANm0yc6SZKH76QyucOZBPUUEYP",
        type: "playlist",
        description: "Comprehensive DSP course covering discrete-time signals, Z-transforms, and digital filters."
      },
      {
        title: "Digital Signal Processing - MIT Lectures",
        url: "https://www.youtube.com/watch?v=6dFnpz_AEyA&list=PL9567DFCA3A66F299",
        type: "playlist",
        description: "MIT lectures on digital signal processing with theoretical foundations."
      },
      {
        title: "Digital Signal Processing - Tutorial Series",
        url: "https://www.youtube.com/watch?v=klWX5FLM9Mw&list=PLBvTTYUOHEmexATY2QCehZr84QqpqwWIX",
        type: "playlist",
        description: "Tutorial series on digital signal processing with practical examples."
      },
      {
        title: "Digital Signal Processing - One Shot",
        url: "https://www.youtube.com/watch?v=EzBNf7-BuPc",
        type: "video",
        description: "Complete one-shot video covering digital signal processing concepts."
      }
    ]
  },
  {
    subject: "Antenna and Wave Propagation",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Antenna and Wave Propagation - Complete Course",
        url: "https://www.youtube.com/watch?v=2zuvDcdBMyo&list=PLJCwoCIeZAte2iWqWoXeyM2g4XPQ3Dv41",
        type: "playlist",
        description: "Comprehensive course on antenna theory and wave propagation phenomena."
      },
      {
        title: "Antenna Theory - Advanced Topics",
        url: "https://www.youtube.com/watch?v=01MNcVMvAJY&list=PLL7liBDYa4YaM1KkpFKlISOtt9RkX-PtG",
        type: "playlist",
        description: "Advanced antenna theory topics including array antennas and microwave antennas."
      },
      {
        title: "Antenna and Wave - One Shot",
        url: "https://www.youtube.com/watch?v=v29xL6HZCfY",
        type: "video",
        description: "Complete one-shot tutorial on antenna and wave propagation."
      },
      {
        title: "Antenna Theory - Quick Guide",
        url: "https://www.youtube.com/watch?v=qt-PgvDBRpU",
        type: "video",
        description: "Quick guide to antenna theory and wave propagation concepts."
      }
    ]
  },
  {
    subject: "Wireless Communication",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "Wireless Communication - Complete Course",
        url: "https://www.youtube.com/watch?v=8T7orRAQgic&list=PLCyR4nKNLRkFTER9ohRBnbRFK0pWe0Qtf",
        type: "playlist",
        description: "Comprehensive wireless communication course covering cellular systems, WiFi, and 5G technology."
      },
      {
        title: "Wireless Communication - Advanced",
        url: "https://www.youtube.com/watch?v=dWSJW-FB2ZU&list=PLA2UBjeRwle2Z9ItYhB6oPkDs7bLuvueb",
        type: "playlist",
        description: "Advanced wireless communication topics including MIMO and beamforming."
      },
      {
        title: "Wireless Communication - One Shot",
        url: "https://www.youtube.com/watch?v=7jPaxoh0DRQ",
        type: "video",
        description: "Complete one-shot video on wireless communication systems."
      },
      {
        title: "Wireless Communication - Tutorial",
        url: "https://www.youtube.com/watch?v=IPvYjXCsTg8",
        type: "video",
        description: "Tutorial on wireless communication principles and technologies."
      }
    ]
  },
  {
    subject: "IoT and Embedded Applications",
    category: "Electronics & Communication Engineering",
    videos: [
      {
        title: "IoT - Complete Course",
        url: "https://www.youtube.com/watch?v=2dywA0o5b08&list=PLo4m8hx3sbb-9ZKw3gSWYYl-5OEnwXvaB",
        type: "playlist",
        description: "Comprehensive IoT course covering sensors, connectivity, cloud platforms, and applications."
      },
      {
        title: "IoT - One Shot Tutorial",
        url: "https://www.youtube.com/watch?v=cKYgZcTjzk0",
        type: "video",
        description: "Complete one-shot tutorial on Internet of Things fundamentals."
      },
      {
        title: "IoT - Quick Guide",
        url: "https://www.youtube.com/watch?v=6ptZr9VRxPs",
        type: "video",
        description: "Quick guide to IoT concepts and practical applications."
      },
      {
        title: "IoT - Fundamentals",
        url: "https://www.youtube.com/watch?v=cKYgZcTjzk0",
        type: "video",
        description: "Fundamentals of IoT technology and embedded applications."
      }
    ]
  }
];

async function addECEVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📚 Starting ECE video uploads...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let totalVideos = 0;
    
    for (const subject of eceSubjects) {
      console.log(`📖 Processing subject: ${subject.subject}`);
      
      for (const video of subject.videos) {
        totalVideos++;
        
        try {
          const youtubeId = extractYouTubeId(video.url);
          
          if (!youtubeId) {
            console.log(`⚠️  Could not extract YouTube ID from: ${video.url}`);
            errorCount++;
            continue;
          }
          
          // Check if video already exists
          const existingVideo = await Video.findOne({ youtubeId });
          
          if (existingVideo) {
            console.log(`⚡ Video already exists: ${video.title}`);
            continue;
          }
          
          // Create new video document
          const newVideo = new Video({
            title: video.title,
            description: video.description,
            thumbnailUrl: getThumbnailUrl(youtubeId),
            videoUrl: video.url,
            youtubeId: youtubeId,
            durationSec: 3600, // Default 1 hour, can be updated later with actual duration
            channelName: "ECE Tutorial Channel", // Default channel name
            topicTags: [
              subject.subject.toLowerCase().replace(/\s+/g, '_'),
              subject.category.toLowerCase().replace(/\s+/g, '_'),
              'ece',
              'electronics',
              'communication',
              'engineering',
              video.type
            ],
            views: 0,
            likes: 0,
            saves: 0,
            downloads: 0,
            playlistTitle: video.type === 'playlist' ? video.title : null,
            episodeNumber: video.type === 'playlist' ? 1 : null,
            uploadedAt: new Date(),
            createdAt: new Date()
          });
          
          await newVideo.save();
          
          console.log(`✅ Added: ${video.title}`);
          console.log(`   Subject: ${subject.subject}`);
          console.log(`   Type: ${video.type}`);
          console.log(`   YouTube ID: ${youtubeId}\n`);
          
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error adding video "${video.title}":`, error.message);
          errorCount++;
        }
      }
      
      console.log(`✅ Completed subject: ${subject.subject}\n`);
    }
    
    console.log('📊 Upload Summary:');
    console.log(`✅ Successfully added: ${successCount} videos`);
    console.log(`❌ Errors: ${errorCount} videos`);
    console.log(`📖 Total processed: ${totalVideos} videos`);
    console.log(`📈 Success rate: ${((successCount / totalVideos) * 100).toFixed(1)}%\n`);
    
    // Verify uploads by checking some videos
    console.log('🔍 Verifying uploads...');
    const sampleVerification = await Video.findOne({ 
      topicTags: { $in: ['ece'] }
    });
    
    if (sampleVerification) {
      console.log('✅ Verification successful - sample ECE video found');
      console.log(`   Title: ${sampleVerification.title}`);
      console.log(`   Subject Tags: ${sampleVerification.topicTags.join(', ')}`);
      console.log(`   YouTube ID: ${sampleVerification.youtubeId}`);
    }
    
    // Get subject-wise counts
    console.log('\n📈 Subject-wise Video Counts:');
    for (const subject of eceSubjects) {
      const count = await Video.countDocuments({
        topicTags: { $in: [subject.subject.toLowerCase().replace(/\s+/g, '_')] }
      });
      console.log(`   ${subject.subject}: ${count} videos`);
    }
    
    console.log('\n🎉 ECE video upload process completed!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the upload
console.log('🚀 Starting ECE video upload process...\n');
addECEVideos().catch(console.error);
