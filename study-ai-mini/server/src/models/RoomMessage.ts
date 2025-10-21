import mongoose, { Schema, Document } from 'mongoose'

export interface IRoomMessage extends Document {
  roomId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  msg: string
  ts: Date
  edited: boolean
  editedAt?: Date
  replyTo?: mongoose.Types.ObjectId
}

const roomMessageSchema = new Schema<IRoomMessage>({
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
  msg: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  ts: {
    type: Date,
    default: Date.now
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'RoomMessage'
  }
}, {
  timestamps: false
})

// TTL index - expire after 30 days
roomMessageSchema.index({ ts: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

// Performance indexes
roomMessageSchema.index({ roomId: 1, ts: 1 })

// Pre-save middleware to set editedAt when edited
roomMessageSchema.pre('save', function(next) {
  if (this.isModified('msg') && !this.isNew) {
    this.edited = true
    this.editedAt = new Date()
  }
  next()
})

export const RoomMessage = mongoose.model<IRoomMessage>('RoomMessage', roomMessageSchema)
