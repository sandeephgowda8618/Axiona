const mongoose = require('mongoose');
const { Schema } = mongoose;

// Video schema definition
const VideoSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  thumbnailUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      },
      message: 'Invalid thumbnail URL format'
    }
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid video URL format'
    }
  },
  youtubeId: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[a-zA-Z0-9_-]{11}$/.test(v);
      },
      message: 'Invalid YouTube ID format'
    }
  },
  durationSec: {
    type: Number,
    required: true,
    min: 0
  },
  channelName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  topicTags: [{
    type: String,
    trim: true
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  saves: {
    type: Number,
    default: 0,
    min: 0
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0
  },
  playlistId: {
    type: String,
    trim: true
  },
  playlistTitle: {
    type: String,
    trim: true,
    maxlength: 200
  },
  episodeNumber: {
    type: Number,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
VideoSchema.index({ title: 'text', channelName: 'text' }, {
  weights: { title: 10, channelName: 5 },
  name: 'video_search_index'
});
VideoSchema.index({ topicTags: 1 });
VideoSchema.index({ uploadedAt: -1 });
VideoSchema.index({ views: -1 });
VideoSchema.index({ likes: -1 });

// Virtual for formatted duration
VideoSchema.virtual('formattedDuration').get(function() {
  const duration = this.durationSec || 0;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Export the model
const Video = mongoose.model('Video', VideoSchema);

module.exports = { Video };
