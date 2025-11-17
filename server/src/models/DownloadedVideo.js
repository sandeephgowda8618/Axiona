const mongoose = require('mongoose');
const { Schema } = mongoose;

const downloadedVideoSchema = new Schema({
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
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  fileName: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    default: 0,
    min: 0
  },
  quality: {
    type: String,
    enum: ['720p', '1080p', '480p', '360p'],
    default: '720p'
  },
  format: {
    type: String,
    enum: ['mp4', 'webm', 'mkv'],
    default: 'mp4'
  },
  downloadStatus: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
downloadedVideoSchema.index({ userId: 1 });
downloadedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });
downloadedVideoSchema.index({ userId: 1, downloadedAt: -1 });

const DownloadedVideo = mongoose.model('DownloadedVideo', downloadedVideoSchema);

module.exports = { DownloadedVideo };
