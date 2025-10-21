import mongoose, { Schema, Document } from 'mongoose'

export interface IAiThread extends Document {
  sessionId: mongoose.Types.ObjectId
  messages: {
    role: string
    text: string
    ts: Date
    resourceRef?: mongoose.Types.ObjectId
  }[]
}

const aiThreadSchema = new Schema<IAiThread>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkspaceSession',
    required: true,
    unique: true
  },
  messages: [{
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system']
    },
    text: {
      type: String,
      required: true
    },
    ts: {
      type: Date,
      default: Date.now
    },
    resourceRef: {
      type: Schema.Types.ObjectId
    }
  }]
}, {
  timestamps: true
})

// TTL index - expire after 60 days based on oldest message
aiThreadSchema.index(
  { 'messages.ts': 1 },
  { expireAfterSeconds: 60 * 24 * 60 * 60 }
)

export const AiThread = mongoose.model<IAiThread>('AiThread', aiThreadSchema)
