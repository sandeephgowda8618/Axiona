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

// Compound indexes for efficient queries - optimized for performance
// Primary query pattern: get highlights for specific PDF and user, sorted by page
HighlightSchema.index({ pdfId: 1, userId: 1, 'position.pageNumber': 1 });

// User-centric queries: timeline and recent activity
HighlightSchema.index({ userId: 1, createdAt: -1 });
HighlightSchema.index({ userId: 1, updatedAt: -1 }); // For recently modified highlights

// User's highlights in specific PDF, chronologically sorted
HighlightSchema.index({ userId: 1, pdfId: 1, createdAt: -1 });

// Tag-based filtering for user
HighlightSchema.index({ userId: 1, tags: 1 });

// Spaced repetition and study session queries
HighlightSchema.index({ userId: 1, lastReviewed: 1 }); // Due for review
HighlightSchema.index({ userId: 1, difficulty: 1, lastReviewed: 1 }); // Study optimization
HighlightSchema.index({ userId: 1, reviewCount: 1 }); // Review frequency analysis

// Search optimization for text content
HighlightSchema.index({ userId: 1, 'content.text': 'text' }); // Text search within user's highlights

// Type-specific queries (note vs highlight vs underline)
HighlightSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Update the updatedAt field on save
HighlightSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted creation date
HighlightSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Static method to get highlights for a PDF (user-specific only) - optimized
HighlightSchema.statics.getHighlightsForPDF = function(pdfId, userId, options = {}) {
  if (!userId) {
    return this.find({ pdfId: null }); // Return empty result if no user
  }
  
  const { 
    pageNumber, 
    populateUser = false, 
    lean = true // Use lean queries for better performance
  } = options;
  
  let query = { pdfId, userId };
  
  // Filter by specific page if provided
  if (pageNumber !== undefined) {
    query['position.pageNumber'] = pageNumber;
  }
  
  let queryBuilder = this.find(query);
  
  // Use lean for better performance unless population is needed
  if (lean && !populateUser) {
    queryBuilder = queryBuilder.lean();
  }
  
  if (populateUser) {
    queryBuilder = queryBuilder.populate('userId', 'fullName email avatarUrl');
  }
  
  return queryBuilder.sort({ 'position.pageNumber': 1, createdAt: 1 });
};

// Static method to get user's highlights across all PDFs - optimized
HighlightSchema.statics.getUserHighlights = function(userId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    sortBy = 'createdAt', 
    sortOrder = -1, 
    populatePDF = false,
    lean = true,
    tags,
    type,
    searchText
  } = options;
  
  let query = { userId };
  
  // Add filters
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  if (type) {
    query.type = type;
  }
  
  if (searchText) {
    query['content.text'] = { $regex: searchText, $options: 'i' };
  }
  
  let queryBuilder = this.find(query);
  
  // Use lean for better performance
  if (lean && !populatePDF) {
    queryBuilder = queryBuilder.lean();
  }
  
  if (populatePDF) {
    queryBuilder = queryBuilder.populate('pdfId', 'topic domain fileName');
  }
  
  return queryBuilder
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method for bulk operations - optimized for performance
HighlightSchema.statics.bulkUpdateReviewed = function(highlightIds, userId) {
  return this.updateMany(
    { _id: { $in: highlightIds }, userId },
    { 
      $inc: { reviewCount: 1 },
      $set: { lastReviewed: new Date() }
    }
  );
};

// Static method to get highlights due for review
HighlightSchema.statics.getDueForReview = function(userId, options = {}) {
  const { limit = 20, difficultyRange } = options;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let query = {
    userId,
    $or: [
      { lastReviewed: { $exists: false } }, // Never reviewed
      { lastReviewed: null },
      { 
        difficulty: { $gte: 4 }, 
        lastReviewed: { $lt: oneDayAgo } 
      }, // Hard items - review daily
      { 
        difficulty: 3, 
        lastReviewed: { $lt: threeDaysAgo } 
      }, // Medium items - review every 3 days
      { 
        difficulty: { $lte: 2 }, 
        lastReviewed: { $lt: oneWeekAgo } 
      } // Easy items - review weekly
    ]
  };
  
  if (difficultyRange) {
    query.difficulty = { $gte: difficultyRange.min, $lte: difficultyRange.max };
  }
  
  return this.find(query)
    .lean()
    .sort({ lastReviewed: 1, difficulty: -1 }) // Oldest and hardest first
    .limit(limit);
};

// Static method to get statistics for user's highlights
HighlightSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalHighlights: { $sum: 1 },
        totalReviews: { $sum: '$reviewCount' },
        avgDifficulty: { $avg: '$difficulty' },
        typeBreakdown: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        recentActivity: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
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
