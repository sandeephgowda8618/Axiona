const mongoose = require('mongoose');
const { Schema } = mongoose;

// Study Material schema - Updated for StudyPES format
const StudyMaterialSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: "StudyPES Materials"
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  subject_key: {
    type: String,
    trim: true,
    uppercase: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  unit: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: "StudyPES"
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  pages: {
    type: Number,
    required: true,
    min: 1,
    max: 2000
  },
  language: {
    type: String,
    required: true,
    default: "English"
  },
  publisher: {
    type: String,
    required: true,
    default: "StudyPES"
  },
  publication_year: {
    type: Number,
    default: 2024
  },
  isbn: {
    type: String,
    default: ""
  },
  file_url: {
    type: String,
    required: true,
    trim: true
  },
  downloadUrl: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true,
    default: "/images/default-thumbnail.png"
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  file_type: {
    type: String,
    required: true,
    uppercase: true
  },
  file_size: {
    type: Number,
    required: true
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
  approved: {
    type: Boolean,
    default: true  // Auto-approve StudyPES materials
  },
  uploadedBy: {
    type: String,
    default: "studypes_system"
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'pps', 'ppsx'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Legacy fields for backward compatibility
  class: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  fileSize: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
StudyMaterialSchema.index({ subject: 1, semester: 1 });
StudyMaterialSchema.index({ subject_key: 1 });
StudyMaterialSchema.index({ semester: 1, unit: 1 });
StudyMaterialSchema.index({ category: 1 });
StudyMaterialSchema.index({ level: 1 });
StudyMaterialSchema.index({ fileName: 1 }, { unique: true });
StudyMaterialSchema.index({ uploadedBy: 1 });
StudyMaterialSchema.index({ tags: 1 });
StudyMaterialSchema.index({ approved: 1, isActive: 1 });
StudyMaterialSchema.index({ title: 'text', description: 'text', topic: 'text' });

// Virtual for formatted file size
StudyMaterialSchema.virtual('formattedFileSize').get(function() {
  if (!this.file_size) return 'Unknown';
  
  const bytes = this.file_size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for semester year mapping
StudyMaterialSchema.virtual('academicYear').get(function() {
  if (!this.semester) return 'Unknown';
  
  const yearMapping = {
    1: '1st Year', 2: '1st Year',
    3: '2nd Year', 4: '2nd Year', 
    5: '3rd Year', 6: '3rd Year',
    7: '4th Year', 8: '4th Year'
  };
  
  return yearMapping[this.semester] || `Semester ${this.semester}`;
});

// Methods
StudyMaterialSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

StudyMaterialSchema.methods.approve = function() {
  this.approved = true;
  return this.save();
};

StudyMaterialSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Virtual for file size in bytes (if needed for sorting)
StudyMaterialSchema.virtual('fileSizeBytes').get(function() {
  const size = this.fileSize;
  const units = ['B', 'KB', 'MB', 'GB'];
  const value = parseFloat(size);
  const unit = size.replace(/[0-9.]/g, '').trim();
  
  const unitIndex = units.indexOf(unit.toUpperCase());
  if (unitIndex === -1) return 0;
  
  return value * Math.pow(1024, unitIndex);
});

const StudyMaterial = mongoose.model('StudyMaterial', StudyMaterialSchema);

module.exports = { StudyMaterial };
