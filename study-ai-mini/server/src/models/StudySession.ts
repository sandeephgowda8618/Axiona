import mongoose, { Schema, Document } from 'mongoose';

// StudySession document interface
export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dailyPlanId?: mongoose.Types.ObjectId;
  startAt: Date;
  endAt?: Date;
  actualMinutes?: number;
  pulseIntervals?: number[];
  status: 'open' | 'closed';
  createdAt: Date;
}

// StudySession schema definition
const StudySessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dailyPlanId: {
    type: Schema.Types.ObjectId,
    ref: 'DailyPlan'
  },
  startAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  endAt: {
    type: Date
  },
  actualMinutes: {
    type: Number,
    min: 0
  },
  pulseIntervals: [{
    type: Number,
    min: 0
  }],
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
StudySessionSchema.index({ userId: 1, startAt: -1 });
StudySessionSchema.index({ status: 1, endAt: 1 }, { expireAfterSeconds: 0 }); // TTL for closed sessions

// Pre-save middleware to calculate actual minutes
StudySessionSchema.pre('save', function(this: IStudySession, next) {
  if (this.status === 'closed' && this.startAt && this.endAt) {
    this.actualMinutes = Math.round((this.endAt.getTime() - this.startAt.getTime()) / (1000 * 60));
  }
  next();
});

// Methods
StudySessionSchema.methods.close = function() {
  this.status = 'closed';
  this.endAt = new Date();
  return this.save();
};

StudySessionSchema.methods.addPulseInterval = function(interval: number) {
  if (!this.pulseIntervals) {
    this.pulseIntervals = [];
  }
  this.pulseIntervals.push(interval);
  return this.save();
};

// Static methods
StudySessionSchema.statics.getActiveSession = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId, status: 'open' });
};

StudySessionSchema.statics.getTodaysSessions = function(userId: mongoose.Types.ObjectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    userId,
    startAt: { $gte: today, $lt: tomorrow }
  }).sort({ startAt: -1 });
};

// Export the model
export const StudySession = mongoose.model<IStudySession>('StudySession', StudySessionSchema);
