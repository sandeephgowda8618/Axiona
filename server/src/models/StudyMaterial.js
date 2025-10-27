const mongoose = require('mongoose');
const { Schema } = mongoose;

// Study Material schema
const StudyMaterialSchema = new Schema({
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
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  }
}, {
  timestamps: true
});

// Indexes
StudyMaterialSchema.index({ subject: 1, class: 1 });
StudyMaterialSchema.index({ category: 1 });
StudyMaterialSchema.index({ uploadedBy: 1 });
StudyMaterialSchema.index({ tags: 1 });
StudyMaterialSchema.index({ approved: 1, isActive: 1 });
StudyMaterialSchema.index({ title: 'text', description: 'text' });

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
