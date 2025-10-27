const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudySessionSchema = new Schema({
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
  }
}, {
  timestamps: true
});

// Indexes
StudySessionSchema.index({ userId: 1, startAt: -1 });
StudySessionSchema.index({ status: 1, endAt: 1 }, { expireAfterSeconds: 0 }); // TTL for closed sessions

// Calculate actualMinutes when closing session
StudySessionSchema.pre('save', function(next) {
  if (this.isModified('endAt') && this.endAt && this.startAt) {
    this.actualMinutes = Math.round((this.endAt - this.startAt) / (1000 * 60));
  }
  next();
});

// Method to close session
StudySessionSchema.methods.closeSession = function() {
  this.status = 'closed';
  this.endAt = new Date();
  return this.save();
};

const StudySession = mongoose.model('StudySession', StudySessionSchema);

module.exports = { StudySession };
