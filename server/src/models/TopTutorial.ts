import mongoose, { Schema, Document } from 'mongoose'

export interface ITopTutorial extends Document {
  videoId: mongoose.Types.ObjectId
  sliderOrder: number
}

const topTutorialSchema = new Schema<ITopTutorial>({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    unique: true
  },
  sliderOrder: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
})

// Indexes
topTutorialSchema.index({ sliderOrder: 1 })

export const TopTutorial = mongoose.model<ITopTutorial>('TopTutorial', topTutorialSchema)
