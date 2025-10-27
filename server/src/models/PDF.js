const mongoose = require('mongoose');
const { Schema } = mongoose;

// PDF schema definition
const PDFSchema = new Schema({
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.pdf$/i.test(v);
      },
      message: 'Invalid PDF URL format'
    }
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  pages: {
    type: Number,
    required: true,
    min: 1
  },
  author: {
    type: String,
    trim: true,
    maxlength: 100
  },
  domain: {
    type: String,
    trim: true,
    enum: ['CS', 'ML', 'DBMS', 'OS', 'DSA', 'Networks', 'Security', 'AI', 'Web Dev', 'Mobile Dev', 'Other']
  },
  year: {
    type: Number,
    validate: {
      validator: function(v) {
        return !v || (v >= 1 && v <= 4) || (v >= 2020 && v <= new Date().getFullYear());
      },
      message: 'Year must be between 1-4 (academic year) or a valid calendar year'
    }
  },
  class: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  publishedAt: {
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
    default: false
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
PDFSchema.index({ domain: 1, year: 1, class: 1 });
PDFSchema.index({ topic: 'text', author: 'text' }, {
  weights: { topic: 10, author: 5 },
  name: 'pdf_search_index'
});
PDFSchema.index({ publishedAt: -1 });
PDFSchema.index({ approved: 1 });
PDFSchema.index({ uploadedBy: 1 });
PDFSchema.index({ downloadCount: -1 });

// Virtual for file size in human readable format
PDFSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize || 0;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Export the model
const PDF = mongoose.model('PDF', PDFSchema);

module.exports = { PDF };
