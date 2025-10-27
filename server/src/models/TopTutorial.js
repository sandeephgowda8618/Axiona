const mongoose = require('mongoose');
const { Schema } = mongoose;

const TopTutorialSchema = new Schema({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  sliderOrder: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

// Indexes
TopTutorialSchema.index({ sliderOrder: 1 });
TopTutorialSchema.index({ videoId: 1 }, { unique: true });

// Static method to reorder tutorials
TopTutorialSchema.statics.reorder = async function(newOrder) {
  const operations = newOrder.map((videoId, index) => ({
    updateOne: {
      filter: { videoId },
      update: { sliderOrder: index + 1 },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

const TopTutorial = mongoose.model('TopTutorial', TopTutorialSchema);

module.exports = { TopTutorial };
