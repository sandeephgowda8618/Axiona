const mongoose = require('mongoose');
const { Schema } = mongoose;

const likedVideoSchema = new Schema({
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
  likedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes
likedVideoSchema.index({ userId: 1 });
likedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const LikedVideo = mongoose.model('LikedVideo', likedVideoSchema);

module.exports = { LikedVideo };
