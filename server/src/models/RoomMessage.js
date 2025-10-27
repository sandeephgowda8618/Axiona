const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomMessageSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  createdAt: {
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
});

// TTL index - expire after 30 days
roomMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Performance indexes
roomMessageSchema.index({ room: 1, createdAt: 1 });

// Pre-save middleware to set editedAt when edited
roomMessageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.edited = true;
    this.editedAt = new Date();
  }
  next();
});

const RoomMessage = mongoose.model('RoomMessage', roomMessageSchema);

module.exports = { RoomMessage };
