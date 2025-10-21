import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkspaceSession extends Document {
  userId: mongoose.Types.ObjectId
  resourceType: 'video' | 'pdf' | 'quiz'
  resourceId: mongoose.Types.ObjectId
  resourceTitle: string
  resourceUrl: string
  pageNum?: number
  videoTime?: number
  status: 'open' | 'closed'
  openedAt: Date
  closedAt?: Date
  aiThread: {
    role: string
    text: string
    ts: Date
    resourceRef?: mongoose.Types.ObjectId
  }[]
  notes: {
    noteId: mongoose.Types.ObjectId
    content: string
    videoTime?: number
    pageNum?: number
    colour: string
    createdAt: Date
    updatedAt: Date
  }[]
}

const workspaceSessionSchema = new Schema<IWorkspaceSession>({
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
    min: 1
  },
  videoTime: {
    type: Number,
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
      required: true,
      enum: ['user', 'assistant', 'system']
    },
    text: {
      type: String,
      required: true
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
      required: true
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
      default: '#FFE066'
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
})

// TTL index - expire 7 days after closing
workspaceSessionSchema.index(
  { openedAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { status: 'closed' }
  }
)

// Performance indexes
workspaceSessionSchema.index({ userId: 1, resourceType: 1, resourceId: 1, status: 1 })
workspaceSessionSchema.index({ openedAt: -1 })

// Pre-save middleware
workspaceSessionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date()
  }
  
  // Update notes updatedAt when notes array is modified
  if (this.isModified('notes')) {
    this.notes.forEach(note => {
      note.updatedAt = new Date()
    })
  }
  
  next()
})

export const WorkspaceSession = mongoose.model<IWorkspaceSession>('WorkspaceSession', workspaceSessionSchema)
