import mongoose, { Schema, Document } from 'mongoose'

export interface IRoomEvent extends Document {
  roomId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  eventType: 'join' | 'leave' | 'screenshare_start' | 'screenshare_stop' | 'mute' | 'unmute'
  ts: Date
  payload: {
    reason?: string
    track?: string
    [key: string]: any
  }
}

const roomEventSchema = new Schema<IRoomEvent>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['join', 'leave', 'screenshare_start', 'screenshare_stop', 'mute', 'unmute'],
    required: true
  },
  ts: {
    type: Date,
    default: Date.now
  },
  payload: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false
})

// TTL index - expire after 30 days
roomEventSchema.index({ ts: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

// Performance indexes
roomEventSchema.index({ roomId: 1, ts: -1 })
roomEventSchema.index({ studentId: 1, ts: -1 })

export const RoomEvent = mongoose.model<IRoomEvent>('RoomEvent', roomEventSchema)
