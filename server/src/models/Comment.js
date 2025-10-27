const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: function() {
      return !this.pdfId;
    }
  },
  pdfId: {
    type: Schema.Types.ObjectId,
    ref: 'PDF',
    required: function() {
      return !this.videoId;
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Validation: must have either videoId or pdfId, but not both
commentSchema.pre('validate', function(next) {
  if (!this.videoId && !this.pdfId) {
    next(new Error('Comment must reference either a video or PDF'));
  } else if (this.videoId && this.pdfId) {
    next(new Error('Comment cannot reference both video and PDF'));
  } else {
    next();
  }
});

// Indexes
commentSchema.index({ videoId: 1, createdAt: -1 });
commentSchema.index({ pdfId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Comment };
