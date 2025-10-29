const mongoose = require('mongoose');
const { Schema } = mongoose;

// Highlight/Annotation schema for PDF annotations
const HighlightSchema = new Schema({
  pdfId: {
    type: Schema.Types.ObjectId,
    ref: 'PDF',
    required: true,
    index: true
  },
  userId: {
    type: String, // Firebase UID
    ref: 'User',
    required: true,
    index: true
  },
  
  // Highlight content and position
  content: {
    text: {
      type: String,
      required: true,
      maxlength: 5000
    },
    image: String // Optional screenshot of the highlighted area
  },
  
  // Position information for the highlight
  position: {
    pageNumber: {
      type: Number,
      required: true,
      min: 1
    },
    
    // Bounding rectangles for the highlighted text
    boundingRect: {
      x1: { type: Number, required: true },
      y1: { type: Number, required: true },
      x2: { type: Number, required: true },
      y2: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    
    // Multiple rects for text that spans multiple lines
    rects: [{
      x1: Number,
      y1: Number,
      x2: Number,
      y2: Number,
      width: Number,
      height: Number
    }],
    
    // Viewport info when highlight was created
    viewportDimensions: {
      width: Number,
      height: Number
    }
  },
  
  // Highlight styling
  style: {
    color: {
      type: String,
      default: '#ffeb3b', // Yellow highlight
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Invalid color format. Use hex format like #ffeb3b'
      }
    },
    opacity: {
      type: Number,
      default: 0.3,
      min: 0.1,
      max: 1
    }
  },
  
  // User comment/note on the highlight
  comment: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  
  // Highlight type
  type: {
    type: String,
    enum: ['highlight', 'underline', 'strikethrough', 'note'],
    default: 'highlight'
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Removed public/private logic - highlights are private to the user
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // For study sessions and review
  reviewCount: {
    type: Number,
    default: 0
  },
  lastReviewed: Date,
  
  // Difficulty rating (for spaced repetition)
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
});

// Compound indexes for efficient queries
HighlightSchema.index({ pdfId: 1, userId: 1 });
HighlightSchema.index({ userId: 1, createdAt: -1 });
HighlightSchema.index({ pdfId: 1, 'position.pageNumber': 1 });
HighlightSchema.index({ tags: 1 });

// Update the updatedAt field on save
HighlightSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted creation date
HighlightSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Static method to get highlights for a PDF (user-specific only)
HighlightSchema.statics.getHighlightsForPDF = function(pdfId, userId) {
  if (!userId) {
    return this.find({ pdfId: null }); // Return empty result if no user
  }
  
  const query = { pdfId, userId };
  
  return this.find(query)
    .populate('userId', 'fullName email avatarUrl')
    .sort({ 'position.pageNumber': 1, createdAt: 1 });
};

// Static method to get user's highlights across all PDFs
HighlightSchema.statics.getUserHighlights = function(userId, options = {}) {
  const { limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({ userId })
    .populate('pdfId', 'topic domain fileName')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Method to increment review count
HighlightSchema.methods.markAsReviewed = function() {
  this.reviewCount += 1;
  this.lastReviewed = new Date();
  return this.save();
};

// Export the model
const Highlight = mongoose.model('Highlight', HighlightSchema);

module.exports = { Highlight };
