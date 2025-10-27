const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomEventSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['user_joined', 'user_left', 'screenshare_start', 'screenshare_stop', 'mute', 'unmute', 'room_created', 'room_ended'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false
});

// TTL index - expire after 30 days
roomEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Performance indexes
roomEventSchema.index({ room: 1, createdAt: -1 });
roomEventSchema.index({ user: 1, createdAt: -1 });

const RoomEvent = mongoose.model('RoomEvent', roomEventSchema);

module.exports = { RoomEvent };
