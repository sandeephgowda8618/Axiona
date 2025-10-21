import mongoose, { Schema, Document } from 'mongoose';

// Participant interface
interface IParticipant {
  studentId: mongoose.Types.ObjectId;
  joinedAt: Date;
  socketId?: string;
  isAlive: boolean;
}

// Room document interface
export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  conferenceId: string;
  studentId: mongoose.Types.ObjectId;
  password?: string;
  startAt: Date;
  scheduledEnd: Date;
  maxParticipants: number;
  participants: IParticipant[];
  status: 'waiting' | 'active' | 'ended';
  endedAt?: Date;
  autoSave: boolean;
  createdAt: Date;
}

// Room schema definition
const RoomSchema: Schema = new Schema({
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
RoomSchema.pre('save', function(this: IRoom, next) {
  if (this.scheduledEnd <= this.startAt) {
    next(new Error('Scheduled end time must be after start time'));
  }
  next();
});

// Virtual for participant count
RoomSchema.virtual('participantCount').get(function(this: IRoom) {
  return this.participants.filter((p: IParticipant) => p.isAlive).length;
});

// Virtual for is password protected
RoomSchema.virtual('hasPassword').get(function(this: IRoom) {
  return !!this.password;
});

// Virtual for duration in minutes
RoomSchema.virtual('durationMinutes').get(function(this: IRoom) {
  return Math.round((this.scheduledEnd.getTime() - this.startAt.getTime()) / (1000 * 60));
});

// Methods
RoomSchema.methods.addParticipant = function(studentId: mongoose.Types.ObjectId, socketId?: string) {
  // Check if already participant
  const existingParticipant = this.participants.find((p: IParticipant) => 
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

RoomSchema.methods.removeParticipant = function(studentId: mongoose.Types.ObjectId) {
  const participant = this.participants.find((p: IParticipant) => 
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
  this.participants.forEach((p: IParticipant) => {
    p.isAlive = false;
  });
  return this.save();
};

// Static methods
RoomSchema.statics.generateConferenceId = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'STUDY-AI-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

RoomSchema.statics.findByConferenceId = function(conferenceId: string) {
  return this.findOne({ conferenceId }).populate('studentId', 'fullName avatarUrl');
};

// Export the model
export const Room = mongoose.model<IRoom>('Room', RoomSchema);
