const mongoose = require('mongoose');
const { Schema } = mongoose;

const WorkspaceSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['video', 'pdf', 'quiz'],
    required: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  resourceTitle: {
    type: String,
    required: true
  },
  resourceUrl: {
    type: String,
    required: true
  },
  pageNum: {
    type: Number,
    default: 1,
    min: 1
  },
  videoTime: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date
  },
  aiThread: [{
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
  }],
  notes: [{
    noteId: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    videoTime: {
      type: Number,
      min: 0
    },
    pageNum: {
      type: Number,
      min: 1
    },
    colour: {
      type: String,
      enum: ['yellow', 'blue', 'green', 'red', 'purple', 'orange'],
      default: 'yellow'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
WorkspaceSessionSchema.index({ userId: 1, resourceType: 1, resourceId: 1, status: 1 });
WorkspaceSessionSchema.index({ openedAt: -1 });
WorkspaceSessionSchema.index({ openedAt: 1 }, { 
  expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
  partialFilterExpression: { status: 'closed' }
});

// Methods
WorkspaceSessionSchema.methods.addNote = function(noteData) {
  noteData.updatedAt = new Date();
  this.notes.push(noteData);
  return this.save();
};

WorkspaceSessionSchema.methods.updateNote = function(noteId, updates) {
  const note = this.notes.id(noteId);
  if (note) {
    Object.assign(note, updates);
    note.updatedAt = new Date();
    return this.save();
  }
  throw new Error('Note not found');
};

WorkspaceSessionSchema.methods.deleteNote = function(noteId) {
  this.notes.id(noteId).remove();
  return this.save();
};

WorkspaceSessionSchema.methods.addMessage = function(role, text, resourceRef = null) {
  this.aiThread.push({
    role,
    text,
    resourceRef,
    ts: new Date()
  });
  return this.save();
};

WorkspaceSessionSchema.methods.closeSession = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

// Check if aiThread is approaching size limit (14MB to be safe)
WorkspaceSessionSchema.methods.isThreadNearLimit = function() {
  return JSON.stringify(this.aiThread).length > 14 * 1024 * 1024;
};

const WorkspaceSession = mongoose.model('WorkspaceSession', WorkspaceSessionSchema);

module.exports = { WorkspaceSession };
