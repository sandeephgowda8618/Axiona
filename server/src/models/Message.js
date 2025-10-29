const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message schema for meeting chat
const MessageSchema = new Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  meetingId: {
    type: String,
    ref: 'Meeting',
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
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
  content: {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: ['text', 'emoji', 'file', 'system'],
      default: 'text'
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number
  },
  reactions: [{
    userId: {
      type: String, // Firebase UID
      required: true
    },
    userName: String,
    emoji: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  replyTo: {
    messageId: String,
    userName: String,
    content: String
  },
  mentions: [{
    userId: String,
    userName: String
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  privateRecipients: [String], // Firebase UIDs
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
MessageSchema.index({ meetingId: 1, timestamp: -1 });
MessageSchema.index({ roomId: 1, timestamp: -1 });
MessageSchema.index({ userId: 1, timestamp: -1 });
MessageSchema.index({ 'mentions.userId': 1 });

// Virtual for formatted timestamp
MessageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to add reaction
MessageSchema.methods.addReaction = function(userId, userName, emoji) {
  // Remove existing reaction from same user
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  
  // Add new reaction
  this.reactions.push({
    userId,
    userName,
    emoji,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to remove reaction
MessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  return this.save();
};

// Method to edit message
MessageSchema.methods.editMessage = function(newContent) {
  this.content.text = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to delete message
MessageSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content.text = '[Message deleted]';
  return this.save();
};

// Static method to generate message ID
MessageSchema.statics.generateMessageId = function() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Static method to get recent messages
MessageSchema.statics.getRecentMessages = function(roomId, limit = 50) {
  return this.find({ 
    roomId, 
    isDeleted: false 
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('userId', 'fullName email avatarUrl');
};

// Static method to get messages by meeting
MessageSchema.statics.getMessagesByMeeting = function(meetingId, options = {}) {
  const { limit = 100, skip = 0, since } = options;
  
  let query = { meetingId, isDeleted: false };
  
  if (since) {
    query.timestamp = { $gte: new Date(since) };
  }
  
  return this.find(query)
    .sort({ timestamp: 1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email avatarUrl');
};

// Static method to search messages
MessageSchema.statics.searchMessages = function(meetingId, searchQuery, options = {}) {
  const { limit = 50 } = options;
  
  return this.find({
    meetingId,
    isDeleted: false,
    'content.text': { $regex: searchQuery, $options: 'i' }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('userId', 'fullName email avatarUrl');
};

// Pre-save middleware
MessageSchema.pre('save', function(next) {
  // Generate messageId if not provided
  if (!this.messageId) {
    this.messageId = MessageSchema.statics.generateMessageId();
  }
  next();
});

// Export the model
const Message = mongoose.model('Message', MessageSchema);

module.exports = { Message };
