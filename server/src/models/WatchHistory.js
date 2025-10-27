const mongoose = require('mongoose');
const { Schema } = mongoose;

const watchHistorySchema = new Schema({
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
  watchedAt: {
    type: Date,
    default: Date.now
  },
  progressSec: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for performance
watchHistorySchema.index({ userId: 1, watchedAt: -1 }); // history page speed
watchHistorySchema.index({ videoId: 1 });
watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true }); // prevent duplicates

// Update lastUpdated on save
watchHistorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

module.exports = { WatchHistory };
