const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// StudyMaterial schema (matching the server schema)
const StudyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    enum: ['IT', 'CS', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General']
  },
  class: {
    type: String,
    required: true,
    trim: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD']
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  pages: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  downloadUrl: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  fileSize: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['lecture-notes', 'reference', 'assignments', 'textbooks', 'question-papers'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  approved: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional StudyPES specific fields
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  unit: {
    type: String
  },
  topic: {
    type: String
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  studyPESCategory: {
    type: String,
    default: 'StudyPES'
  }
}, {
  timestamps: true
});

const StudyMaterial = mongoose.model('StudyMaterial', StudyMaterialSchema);

// Mapping functions
function mapSubjectToEnum(subject) {
  const subjectMap = {
    'Data Structures & Algorithms': 'CS',
    'Data Structures and its Applications': 'CS',
    'Database Management Systems': 'CS',
    'Machine Learning': 'CS',
    'Computer Networks': 'CS',
    'Operating Systems': 'CS',
    'Software Engineering': 'CS',
    'Web Technology': 'CS',
    'Design and Analysis of Algorithms': 'CS',
    'Design, Analysis, and Algorithm': 'CS',
    'Automata & Formal Language Theory': 'CS',
    'Automata Formal Language and Logic': 'CS',
    'Automata Formal Languages & Logic': 'CS',
    'Digital Design & Computer Organization': 'Electronics',
    'Digital Design and Computer Organization': 'Electronics',
    'DIGITAL DESIGN AND COMPUTER ORGANIZATION': 'Electronics',
    'Electronic Principles & Devices': 'Electronics',
    'Electronic Principles and Devices': 'Electronics',
    'Microprocessor & Computer Architecture': 'Electronics',
    'Mechanical Engineering': 'Mechanical',
    'Mechanical Engineering Science': 'Mechanical',
    'Electrical Engineering': 'Electronics',
    'Electrical Machines': 'Electronics',
    'Electrical and Electronics Engineering': 'Electronics',
    'Mathematics': 'Mathematics',
    'Engineering Mathematics - II': 'Mathematics',
    'Engineering Mathematics – I': 'Mathematics',
    'Engineering Mathematics-II': 'Mathematics',
    'Mathematics for Computer Science Engineers': 'Mathematics',
    'Linear Algebra': 'Mathematics',
    'Physics': 'Physics',
    'Chemistry': 'Chemistry',
    'Environmental Studies & Life Sciences': 'Biology',
    'Environmental Studies and Life Sciences': 'Biology'
  };
  
  return subjectMap[subject] || 'General';
}

function mapSemesterToClass(semester) {
  const classMap = {
    1: '1st Year',
    2: '1st Year', 
    3: '2nd Year',
    4: '2nd Year',
    5: '3rd Year',
    6: '3rd Year',
    7: '4th Year',
    8: '4th Year'
  };
  
  return classMap[semester] || '1st Year';
}

function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'doc',
    'docx': 'docx',
    'ppt': 'ppt',
    'pptx': 'pptx',
    'txt': 'txt',
    'pps': 'ppt',
    'ppsx': 'pptx'
  };
  
  return typeMap[ext] || 'pdf';
}

function generateFileSize(pages) {
  // Estimate file size based on pages and type
  const avgSizePerPage = 0.5; // MB
  const estimatedSize = pages * avgSizePerPage;
  
  if (estimatedSize < 1) {
    return `${Math.round(estimatedSize * 1000)}KB`;
  } else {
    return `${estimatedSize.toFixed(1)}MB`;
  }
}

function generateDownloadUrl(fileName) {
  // Generate a placeholder download URL
  return `https://studypes-materials.s3.amazonaws.com/materials/${encodeURIComponent(fileName)}`;
}

function generateThumbnail(fileName, fileType) {
  // Generate a placeholder thumbnail URL
  const thumbnailMap = {
    'pdf': 'https://studypes-assets.s3.amazonaws.com/thumbnails/pdf-icon.png',
    'pptx': 'https://studypes-assets.s3.amazonaws.com/thumbnails/ppt-icon.png',
    'ppt': 'https://studypes-assets.s3.amazonaws.com/thumbnails/ppt-icon.png',
    'docx': 'https://studypes-assets.s3.amazonaws.com/thumbnails/doc-icon.png',
    'doc': 'https://studypes-assets.s3.amazonaws.com/thumbnails/doc-icon.png',
    'txt': 'https://studypes-assets.s3.amazonaws.com/thumbnails/txt-icon.png'
  };
  
  return thumbnailMap[fileType] || thumbnailMap['pdf'];
}

async function importStudyPESMaterials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/study-ai');
    
    console.log('📁 Reading StudyPES metadata...');
    const jsonData = fs.readFileSync('StudyPES_data.json', 'utf8');
    const studyPESData = JSON.parse(jsonData);
    
    console.log(`📊 Found ${studyPESData.length} StudyPES materials to import`);
    
    // Check existing count
    const existingCount = await StudyMaterial.countDocuments({ studyPESCategory: 'StudyPES' });
    console.log(`📚 Existing StudyPES materials in database: ${existingCount}`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const item of studyPESData) {
      try {
        // Check if material already exists
        const existing = await StudyMaterial.findOne({
          title: item.title,
          studyPESCategory: 'StudyPES'
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Map the data to StudyMaterial schema
        const fileName = item.file_info?.file_name || `${item.title}.pdf`;
        const fileType = getFileType(fileName);
        const pages = Math.max(1, item.file_info?.pages || 10);
        
        const studyMaterial = new StudyMaterial({
          title: item.title.substring(0, 200),
          subject: mapSubjectToEnum(item.subject),
          class: mapSemesterToClass(item.semester),
          year: new Date().getFullYear().toString(),
          pages: Math.min(1000, pages),
          downloadUrl: generateDownloadUrl(fileName),
          thumbnail: generateThumbnail(fileName, fileType),
          author: 'StudyPES Team',
          description: item.description ? item.description.substring(0, 500) : `${item.subject} - ${item.topic} study material for semester ${item.semester}`,
          fileSize: generateFileSize(pages),
          category: 'lecture-notes',
          tags: item.tags || [item.subject_key?.toLowerCase(), `semester-${item.semester}`, item.level?.toLowerCase()].filter(Boolean),
          approved: true,
          uploadedBy: 'studypes-system',
          fileType: fileType,
          isActive: true,
          // StudyPES specific fields
          semester: item.semester,
          unit: item.unit,
          topic: item.topic,
          level: item.level,
          studyPESCategory: 'StudyPES'
        });
        
        await studyMaterial.save();
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`✅ Imported ${imported} materials...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing ${item.title}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📚 Total StudyPES materials now: ${existingCount + imported}`);
    
    // Show some sample data
    console.log('\n🔍 Sample imported materials:');
    const samples = await StudyMaterial.find({ studyPESCategory: 'StudyPES' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title subject semester unit topic level');
    
    samples.forEach((sample, index) => {
      console.log(`${index + 1}. ${sample.title}`);
      console.log(`   Subject: ${sample.subject} | Semester: ${sample.semester} | Level: ${sample.level}`);
      console.log(`   Unit: ${sample.unit} | Topic: ${sample.topic}\n`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the import
importStudyPESMaterials();
