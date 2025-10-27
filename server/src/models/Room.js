const mongoose = require('mongoose');
const { Schema } = mongoose;

// Room schema definition
const RoomSchema = new Schema({
  conferenceId: {
    type: String,
    required: true,
    unique: true,
    match: /^STUDY-AI-[A-Z0-9]{4}$/
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  password: {
    type: String,
    minlength: 4
  },
  startAt: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 200,
    min: 2,
    max: 500
  },
  participants: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    socketId: String,
    isAlive: {
      type: Boolean,
      default: true
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  endedAt: Date,
  autoSave: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
RoomSchema.index({ studentId: 1, startAt: -1 });
RoomSchema.index({ status: 1, scheduledEnd: 1 }, { expireAfterSeconds: 0 }); // TTL for ended rooms
RoomSchema.index({ conferenceId: 1 }, { unique: true });

// Validation
RoomSchema.pre('save', function(next) {
  if (this.scheduledEnd <= this.startAt) {
    next(new Error('Scheduled end time must be after start time'));
  }
  next();
});

// Virtual for participant count
RoomSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => p.isAlive).length;
});

// Virtual for is password protected
RoomSchema.virtual('hasPassword').get(function() {
  return !!this.password;
});

// Virtual for duration in minutes
RoomSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.scheduledEnd.getTime() - this.startAt.getTime()) / (1000 * 60));
});

// Methods
RoomSchema.methods.addParticipant = function(studentId, socketId) {
  // Check if already participant
  const existingParticipant = this.participants.find(p => 
    p.studentId.toString() === studentId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isAlive = true;
    existingParticipant.socketId = socketId;
    existingParticipant.joinedAt = new Date();
  } else {
    // Check room capacity
    if (this.participantCount >= this.maxParticipants) {
      throw new Error('Room is at maximum capacity');
    }
    
    this.participants.push({
      studentId,
      joinedAt: new Date(),
      socketId,
      isAlive: true
    });
  }
  
  // Auto-activate room if first participant joins
  if (this.status === 'waiting' && this.participantCount === 1) {
    this.status = 'active';
  }
  
  return this.save();
};

RoomSchema.methods.removeParticipant = function(studentId) {
  const participant = this.participants.find(p => 
    p.studentId.toString() === studentId.toString()
  );
  
  if (participant) {
    participant.isAlive = false;
  }
  
  // Auto-end room if no participants left
  if (this.participantCount === 0 && this.status === 'active') {
    this.status = 'ended';
    this.endedAt = new Date();
  }
  
  return this.save();
};

RoomSchema.methods.endRoom = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  // Mark all participants as not alive
  this.participants.forEach(p => {
    p.isAlive = false;
  });
  return this.save();
};

// Static methods
RoomSchema.statics.generateConferenceId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'STUDY-AI-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

RoomSchema.statics.findByConferenceId = function(conferenceId) {
  return this.findOne({ conferenceId }).populate('studentId', 'fullName avatarUrl');
};

// Export the model
const Room = mongoose.model('Room', RoomSchema);

module.exports = { Room };
