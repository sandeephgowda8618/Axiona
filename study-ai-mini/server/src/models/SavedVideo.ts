import mongoose, { Schema, Document } from 'mongoose'

export interface ISavedVideo extends Document {
  userId: mongoose.Types.ObjectId
  videoId: mongoose.Types.ObjectId
  savedAt: Date
}

const savedVideoSchema = new Schema<ISavedVideo>({
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
})

// Indexes
savedVideoSchema.index({ userId: 1 })
savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true })

export const SavedVideo = mongoose.model<ISavedVideo>('SavedVideo', savedVideoSchema)
