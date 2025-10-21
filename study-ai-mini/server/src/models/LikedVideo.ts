import mongoose, { Schema, Document } from 'mongoose'

export interface ILikedVideo extends Document {
  userId: mongoose.Types.ObjectId
  videoId: mongoose.Types.ObjectId
  likedAt: Date
}

const likedVideoSchema = new Schema<ILikedVideo>({
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
})

// Indexes
likedVideoSchema.index({ userId: 1 })
likedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true })

export const LikedVideo = mongoose.model<ILikedVideo>('LikedVideo', likedVideoSchema)
