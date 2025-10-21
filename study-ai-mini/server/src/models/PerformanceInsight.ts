import mongoose, { Schema, Document } from 'mongoose'

export interface IPerformanceInsight extends Document {
  userId: mongoose.Types.ObjectId
  roadmapId?: mongoose.Types.ObjectId
  sessionId?: mongoose.Types.ObjectId
  insight: {
    headline: string
    summary: string
    tip: string
    emoji: string
    color: string
  }
  createdAt: Date
  expiresAt: Date
}

const performanceInsightSchema = new Schema<IPerformanceInsight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmapId: {
    type: Schema.Types.ObjectId,
    ref: 'Roadmap'
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'StudySession'
  },
  insight: {
    headline: {
      type: String,
      required: true,
      maxlength: 100
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500
    },
    tip: {
      type: String,
      required: true,
      maxlength: 300
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
})

// TTL index - expire after 7 days
performanceInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Performance indexes
performanceInsightSchema.index({ userId: 1, createdAt: -1 })

export const PerformanceInsight = mongoose.model<IPerformanceInsight>('PerformanceInsight', performanceInsightSchema)
