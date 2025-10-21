import mongoose, { Schema, Document } from 'mongoose'

export interface IExport extends Document {
  userId: mongoose.Types.ObjectId
  fileName: string
  status: 'building' | 'ready'
  expiresAt: Date
  fileId?: mongoose.Types.ObjectId // GridFS file ID
}

const exportSchema = new Schema<IExport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['building', 'ready'],
    default: 'building'
  },
  fileId: {
    type: Schema.Types.ObjectId // Reference to GridFS file
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
  }
}, {
  timestamps: true
})

// TTL index - expire after 1 day
exportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Performance indexes
exportSchema.index({ userId: 1, status: 1 })

export const Export = mongoose.model<IExport>('Export', exportSchema)
