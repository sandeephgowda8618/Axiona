const mongoose = require('mongoose');
const { Schema } = mongoose;

// User schema definition
const UserSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  avatarUrl: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    emailNotif: {
      type: Boolean,
      default: true
    },
    pushNotif: {
      type: Boolean,
      default: true
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false
      },
      time: {
        type: String,
        default: '09:00'
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekdays', 'custom'],
        default: 'daily'
      }
    }
  },
  privacy: {
    exportExp: Date,
    deleteReqAt: Date
  },
  security: {
    tfaSecret: String,
    tfaEnabled: {
      type: Boolean,
      default: false
    },
    sessions: [{
      id: {
        type: String,
        required: true
      },
      ua: String,
      ip: String,
      lastSeen: {
        type: Date,
        default: Date.now
      },
      current: {
        type: Boolean,
        default: false
      }
    }]
  },
  currentRoadmapId: {
    type: Schema.Types.ObjectId,
    ref: 'Roadmap',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ currentRoadmapId: 1 });

// Hide sensitive fields when converting to JSON
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.security.tfaSecret;
  return userObject;
};

// Export the model
const User = mongoose.model('User', UserSchema);

module.exports = { User };
