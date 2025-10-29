const mongoose = require('mongoose');
const { Schema } = mongoose;

// User schema definition
const UserSchema = new Schema({
  _id: {
    type: String, // Use Firebase UID as primary key
    required: true
  },
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
  firebaseUID: {
    type: String,
    required: true,
    unique: true // Firebase UID should be unique
  },
  passwordHash: {
    type: String,
    required: false, // Not required for Firebase auth
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
}, {
  _id: false, // Disable automatic ObjectId generation
  timestamps: true // Add automatic createdAt and updatedAt
});

// Indexes
UserSchema.index({ currentRoadmapId: 1 });
// Email already has unique: true in schema definition

// Hide sensitive fields when converting to JSON
UserSchema.methods.toJSON = function() {
  try {
    const userObject = this.toObject();
    delete userObject.passwordHash;
    if (userObject.security) {
      delete userObject.security.tfaSecret;
    }
    return userObject;
  } catch (error) {
    console.error('Error in toJSON:', error);
    // Return a minimal object if there's an error
    return {
      _id: this._id,
      fullName: this.fullName,
      email: this.email
    };
  }
};

// Export the model
const User = mongoose.model('User', UserSchema);

module.exports = { User };
