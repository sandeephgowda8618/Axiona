const mongoose = require('mongoose');
const { Schema } = mongoose;

// Meeting schema for video conferences
const MeetingSchema = new Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  createdBy: {
    type: String, // Firebase UID
    ref: 'User',
    required: true
  },
  hostUserId: {
    type: String, // Firebase UID - current host (can change)
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: String, // Firebase UID
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    role: {
      type: String,
      enum: ['host', 'moderator', 'participant'],
      default: 'participant'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    maxParticipants: {
      type: Number,
      default: 6,
      min: 2,
      max: 6 // Enforce maximum of 6 participants
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowRecording: {
      type: Boolean,
      default: false
    },
    muteOnEntry: {
      type: Boolean,
      default: false
    }
  },
  roomPassword: {
    type: String,
    required: false,
    trim: true,
    minlength: 4,
    maxlength: 20
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  scheduledStartTime: Date,
  actualStartTime: Date,
  endTime: Date,
  duration: Number, // Duration in minutes
  roomId: String, // Socket.IO room identifier
  recordingUrl: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
MeetingSchema.index({ meetingId: 1 }, { unique: true });
MeetingSchema.index({ createdBy: 1, createdAt: -1 });
MeetingSchema.index({ status: 1, scheduledStartTime: 1 });
MeetingSchema.index({ 'participants.userId': 1 });
MeetingSchema.index({ roomId: 1 });

// Virtual for active participants count
MeetingSchema.virtual('activeParticipants').get(function() {
  return this.participants ? this.participants.filter(p => p.isActive).length : 0;
});

// Virtual for meeting duration in human readable format
MeetingSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Method to verify room password
MeetingSchema.methods.verifyPassword = function(password) {
  // If no password is set, anyone can join
  if (!this.roomPassword) return true;
  return this.roomPassword === password;
};

// Method to check if meeting is joinable
MeetingSchema.methods.canJoin = function(password = null) {
  // Check if meeting is active or scheduled
  if (this.status === 'ended' || this.status === 'cancelled') {
    return { success: false, message: `Meeting is ${this.status}` };
  }

  // Check participant limit
  if (this.activeParticipants >= this.settings.maxParticipants) {
    return { success: false, message: 'Meeting is full (maximum 6 participants)' };
  }

  // Check password if required
  if (this.roomPassword && !this.verifyPassword(password)) {
    return { success: false, message: 'Invalid room password' };
  }

  return { success: true };
};

// Method to add participant
MeetingSchema.methods.addParticipant = function(userId, userName, userEmail, password = null, role = 'participant') {
  // Check if user can join (including password verification)
  const joinCheck = this.canJoin(password);
  if (!joinCheck.success) {
    throw new Error(joinCheck.message);
  }

  const existingParticipant = this.participants.find(p => p.userId === userId);
  
  if (existingParticipant) {
    // Reactivate if was inactive
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = undefined;
  } else {
    // Double-check participant limit before adding
    if (this.activeParticipants >= this.settings.maxParticipants) {
      throw new Error('Meeting is full (maximum 6 participants)');
    }
    
    this.participants.push({
      userId,
      userName,
      userEmail,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove participant
MeetingSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.userId === userId && p.isActive);
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Method to start meeting
MeetingSchema.methods.startMeeting = function() {
  this.status = 'active';
  this.actualStartTime = new Date();
  return this.save();
};

// Method to end meeting
MeetingSchema.methods.endMeeting = function() {
  this.status = 'ended';
  this.endTime = new Date();
  
  // Calculate duration
  if (this.actualStartTime) {
    this.duration = Math.round((this.endTime - this.actualStartTime) / (1000 * 60));
  }
  
  // Mark all participants as inactive
  this.participants.forEach(p => {
    if (p.isActive) {
      p.isActive = false;
      p.leftAt = this.endTime;
    }
  });
  
  return this.save();
};

// Static method to generate unique meeting ID
MeetingSchema.statics.generateMeetingId = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Static method to find active meetings
MeetingSchema.statics.findActiveMeetings = function() {
  return this.find({ status: 'active' }).populate('participants.userId', 'fullName email');
};

// Static method to find user's meetings
MeetingSchema.statics.findUserMeetings = function(userId, options = {}) {
  const { status, limit = 20, skip = 0 } = options;
  
  let query = {
    $or: [
      { createdBy: userId },
      { 'participants.userId': userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('participants.userId', 'fullName email avatarUrl');
};

// Pre-save middleware to update updatedAt
MeetingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model
const Meeting = mongoose.model('Meeting', MeetingSchema);

module.exports = { Meeting };
