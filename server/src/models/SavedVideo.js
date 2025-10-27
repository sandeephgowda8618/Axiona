const mongoose = require('mongoose');
const { Schema } = mongoose;

const savedVideoSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes
savedVideoSchema.index({ userId: 1 });
savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const SavedVideo = mongoose.model('SavedVideo', savedVideoSchema);

module.exports = { SavedVideo };
