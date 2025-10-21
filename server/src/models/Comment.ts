import mongoose, { Schema, Document } from 'mongoose'

export interface IComment extends Document {
  videoId?: mongoose.Types.ObjectId
  pdfId?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  text: string
  createdAt: Date
  likes: number
}

const commentSchema = new Schema<IComment>({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: function(this: IComment) {
      return !this.pdfId
    }
  },
  pdfId: {
    type: Schema.Types.ObjectId,
    ref: 'PDF',
    required: function(this: IComment) {
      return !this.videoId
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Validation: must have either videoId or pdfId, but not both
commentSchema.pre('validate', function(next) {
  if (!this.videoId && !this.pdfId) {
    next(new Error('Comment must reference either a video or PDF'))
  } else if (this.videoId && this.pdfId) {
    next(new Error('Comment cannot reference both video and PDF'))
  } else {
    next()
  }
})

// Indexes
commentSchema.index({ videoId: 1, createdAt: -1 })
commentSchema.index({ pdfId: 1, createdAt: -1 })
commentSchema.index({ userId: 1, createdAt: -1 })

export const Comment = mongoose.model<IComment>('Comment', commentSchema)
