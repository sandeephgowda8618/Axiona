const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF',
    required: true
  },
  userId: {
    type: String, // Firebase UID
    ref: 'User',
    required: true
  },
  pdfTitle: {
    type: String,
    required: true // Store PDF title for easy reference
  },
  pageNumber: {
    type: Number,
    min: 1 // Page numbers start from 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastViewedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
noteSchema.index({ userId: 1, pdfId: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ pdfId: 1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = { Note };
