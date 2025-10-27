const mongoose = require('mongoose');
const { Schema } = mongoose;

// DailyPlan schema definition
const DailyPlanSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  goalMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 1440 // Max 24 hours
  },
  tasks: [{
    taskId: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    estMinutes: {
      type: Number,
      required: true,
      min: 1
    },
    done: {
      type: Boolean,
      default: false
    },
    resourceRef: {
      type: Schema.Types.ObjectId,
      refPath: 'tasks.resourceModel'
    },
    resourceModel: {
      type: String,
      enum: ['Video', 'PDF', 'Quiz']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
DailyPlanSchema.index({ userId: 1, date: -1 }, { unique: true });

// TTL index - keep plans for 365 days
DailyPlanSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for completion percentage
DailyPlanSchema.virtual('completionPercentage').get(function() {
  if (this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(task => task.done).length;
  return Math.round((completedTasks / this.tasks.length) * 100);
});

// Virtual for total estimated minutes
DailyPlanSchema.virtual('totalEstMinutes').get(function() {
  return this.tasks.reduce((sum, task) => sum + (task.estMinutes || 0), 0);
});

// Virtual for completed minutes
DailyPlanSchema.virtual('completedMinutes').get(function() {
  return this.tasks
    .filter(task => task.done)
    .reduce((sum, task) => sum + (task.estMinutes || 0), 0);
});

// Methods
DailyPlanSchema.methods.toggleTask = function(taskId) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.done = !task.done;
    return this.save();
  }
  throw new Error('Task not found');
};

DailyPlanSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  return this.save();
};

DailyPlanSchema.methods.removeTask = function(taskId) {
  this.tasks.id(taskId)?.remove();
  return this.save();
};

const DailyPlan = mongoose.model('DailyPlan', DailyPlanSchema);

module.exports = { DailyPlan };
