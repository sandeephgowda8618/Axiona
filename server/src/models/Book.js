const mongoose = require('mongoose');
const { Schema } = mongoose;

// Book schema definition for Library
const BookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  isbn: {
    type: String,
    trim: true,
    maxlength: 17
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: 200
  },
  edition: {
    type: String,
    trim: true,
    maxlength: 50
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  pages: {
    type: Number,
    min: 1
  },
  language: {
    type: String,
    default: 'English',
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Enhanced AI-generated metadata fields
  summary: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  key_concepts: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    trim: true
  },
  target_audience: {
    type: String,
    enum: ['Students', 'Professionals', 'Researchers', 'General'],
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  
  // File information
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  file_url: {
    type: String,
    default: "N/A",
    trim: true,
    maxlength: 500
  },
  
  // Availability and status
  availability: {
    type: String,
    enum: ['available', 'borrowed', 'reserved'],
    default: 'available'
  },
  
  // Statistics
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Cover image
  coverImage: {
    type: String,
    default: '/api/placeholder/300/400'
  },
  
  // Timestamps
  addedDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
BookSchema.index({ title: 'text', author: 'text', description: 'text', summary: 'text', key_concepts: 'text' });
BookSchema.index({ subject: 1, category: 1 });
BookSchema.index({ difficulty: 1, target_audience: 1 });
BookSchema.index({ addedDate: -1 });
BookSchema.index({ downloadCount: -1 });
BookSchema.index({ rating: -1 });

// Virtual for file size in human readable format
BookSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
});

// Pre-save middleware to update the updatedAt field
BookSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find books by subject
BookSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: new RegExp(subject, 'i') });
};

// Static method to find books by category
BookSchema.statics.findByCategory = function(category) {
  return this.find({ category: new RegExp(category, 'i') });
};

// Instance method to increment download count
BookSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

const Book = mongoose.model('Book', BookSchema);

module.exports = { Book, BookSchema };
