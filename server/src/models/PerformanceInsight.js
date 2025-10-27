const mongoose = require('mongoose');
const { Schema } = mongoose;

const PerformanceInsightSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmapId: {
    type: Schema.Types.ObjectId,
    ref: 'Roadmap'
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'StudySession'
  },
  insight: {
    headline: {
      type: String,
      required: true,
      maxlength: 100
    },
    summary: {
      type: String,
      required: true,
      maxlength: 300
    },
    tip: {
      type: String,
      maxlength: 200
    },
    emoji: {
      type: String,
      default: '📊'
    },
    color: {
      type: String,
      enum: ['blue', 'green', 'yellow', 'red', 'purple', 'orange'],
      default: 'blue'
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

// Indexes
PerformanceInsightSchema.index({ userId: 1, createdAt: -1 });
PerformanceInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static methods
PerformanceInsightSchema.statics.createInsight = function(userId, insightData, roadmapId = null, sessionId = null) {
  return this.create({
    userId,
    roadmapId,
    sessionId,
    insight: insightData
  });
};

PerformanceInsightSchema.statics.getActiveInsights = function(userId, limit = 5) {
  return this.find({ 
    userId,
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

const PerformanceInsight = mongoose.model('PerformanceInsight', PerformanceInsightSchema);

module.exports = { PerformanceInsight };
