const mongoose = require('mongoose');
const { Schema } = mongoose;

const topicSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  iconUrl: {
    type: String,
    required: true
  },
  displayOrder: {
    type: Number,
    required: true,
    min: 0
  },
  isTopFive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
topicSchema.index({ isTopFive: 1, displayOrder: 1 });
topicSchema.index({ name: 1 }, { unique: true });

const Topic = mongoose.model('Topic', topicSchema);

module.exports = { Topic };
