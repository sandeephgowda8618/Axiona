import mongoose, { Schema, Document } from 'mongoose'

export interface ITopic extends Document {
  name: string
  iconUrl: string
  displayOrder: number
  isTopFive: boolean
}

const topicSchema = new Schema<ITopic>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  iconUrl: {
    type: String,
    required: true
  },
  displayOrder: {
    type: Number,
    required: true,
    min: 0
  },
  isTopFive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
topicSchema.index({ isTopFive: 1, displayOrder: 1 })
topicSchema.index({ name: 1 }, { unique: true })

export const Topic = mongoose.model<ITopic>('Topic', topicSchema)
