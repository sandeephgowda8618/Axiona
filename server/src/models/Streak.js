const mongoose = require('mongoose');
const { Schema } = mongoose;

const streakSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  longest: {
    type: Number,
    default: 0,
    min: 0
  },
  lastStudyDate: {
    type: Date
  },
  freezeLeft: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Methods for streak management
streakSchema.methods.updateStreak = function(studyDate) {
  const today = new Date(studyDate);
  today.setHours(0, 0, 0, 0);
  
  const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate) : null;
  if (lastStudy) {
    lastStudy.setHours(0, 0, 0, 0);
  }
  
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (!lastStudy) {
    // First study session
    this.current = 1;
    this.longest = Math.max(this.longest, 1);
  } else if (today.getTime() === lastStudy.getTime()) {
    // Same day, no change
    return;
  } else if (today.getTime() - lastStudy.getTime() === oneDayMs) {
    // Consecutive day
    this.current += 1;
    this.longest = Math.max(this.longest, this.current);
  } else if (today.getTime() - lastStudy.getTime() === 2 * oneDayMs && this.freezeLeft > 0) {
    // Used freeze day
    this.current += 1;
    this.longest = Math.max(this.longest, this.current);
    this.freezeLeft -= 1;
  } else {
    // Streak broken
    this.current = 1;
  }
  
  this.lastStudyDate = today;
};

const Streak = mongoose.model('Streak', streakSchema);

module.exports = { Streak };
