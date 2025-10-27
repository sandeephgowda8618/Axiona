const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExportSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['building', 'ready', 'failed'],
    default: 'building'
  },
  fileSize: {
    type: Number,
    min: 0
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
ExportSchema.index({ userId: 1, createdAt: -1 });
ExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Methods
ExportSchema.methods.markReady = function(fileSize) {
  this.status = 'ready';
  this.fileSize = fileSize;
  return this.save();
};

ExportSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

ExportSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static methods
ExportSchema.statics.createExport = function(userId, fileName) {
  return this.create({
    userId,
    fileName,
    status: 'building'
  });
};

ExportSchema.statics.getUserExports = function(userId) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
};

const Export = mongoose.model('Export', ExportSchema);

module.exports = { Export };
