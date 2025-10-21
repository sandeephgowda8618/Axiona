import mongoose, { Schema, Document } from 'mongoose';

// Video document interface
export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  youtubeId?: string;
  durationSec: number;
  channelName?: string;
  topicTags: string[];
  uploadedAt: Date;
  views: number;
  likes: number;
  saves: number;
  downloads: number;
  createdAt: Date;
}

// Video schema definition
const VideoSchema: Schema = new Schema({
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
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      },
      message: 'Invalid thumbnail URL format'
    }
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid video URL format'
    }
  },
  youtubeId: {
    type: String,
    validate: {
      validator: function(v: string) {
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
VideoSchema.virtual('formattedDuration').get(function(this: IVideo) {
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
export const Video = mongoose.model<IVideo>('Video', VideoSchema);
