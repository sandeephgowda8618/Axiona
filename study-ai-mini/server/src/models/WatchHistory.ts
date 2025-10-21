import mongoose, { Schema, Document } from 'mongoose'

export interface IWatchHistory extends Document {
  userId: mongoose.Types.ObjectId
  videoId: mongoose.Types.ObjectId
  watchedAt: Date
  progressSec: number
  lastUpdated: Date
}

const watchHistorySchema = new Schema<IWatchHistory>({
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
})

// Indexes for performance
watchHistorySchema.index({ userId: 1, watchedAt: -1 }) // history page speed
watchHistorySchema.index({ videoId: 1 })
watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true }) // prevent duplicates

// Update lastUpdated on save
watchHistorySchema.pre('save', function(next) {
  this.lastUpdated = new Date()
  next()
})

export const WatchHistory = mongoose.model<IWatchHistory>('WatchHistory', watchHistorySchema)
