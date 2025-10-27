const mongoose = require('mongoose');
const { Schema } = mongoose;

const AiThreadSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkspaceSession',
    required: true,
    unique: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 4000
    },
    ts: {
      type: Date,
      default: Date.now
    },
    resourceRef: {
      type: Schema.Types.ObjectId
    }
  }]
}, {
  timestamps: true
});

// Indexes
AiThreadSchema.index({ sessionId: 1 }, { unique: true });
AiThreadSchema.index({ 'messages.ts': 1 }, { 
  expireAfterSeconds: 60 * 24 * 60 * 60 // 60 days based on oldest message
});

// Methods
AiThreadSchema.methods.addMessage = function(role, text, resourceRef = null) {
  this.messages.push({
    role,
    text,
    resourceRef,
    ts: new Date()
  });
  return this.save();
};

AiThreadSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
    .reverse();
};

const AiThread = mongoose.model('AiThread', AiThreadSchema);

module.exports = { AiThread };
