import mongoose, { Schema, Document } from 'mongoose';

// Milestone interface
interface IMilestone {
  mileId: string;
  name: string;
  description: string;
  subLessons: number;
  finished: number;
  resources: Array<{
    type: string;
    id: string;
    title: string;
  }>;
  order: number;
}

// Roadmap document interface
export interface IRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  milestones: IMilestone[];
  createdAt: Date;
}

// Roadmap schema definition
const RoadmapSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  milestones: [{
    mileId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      maxlength: 500
    },
    subLessons: {
      type: Number,
      required: true,
      min: 0
    },
    finished: {
      type: Number,
      default: 0,
      min: 0
    },
    resources: [{
      type: {
        type: String,
        required: true,
        enum: ['video', 'pdf', 'quiz', 'article', 'practice']
      },
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      }
    }],
    order: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
RoadmapSchema.index({ userId: 1 }, { unique: true }); // One active roadmap per user
RoadmapSchema.index({ createdAt: -1 });

// Virtual for completion percentage
RoadmapSchema.virtual('completionPercentage').get(function(this: IRoadmap) {
  if (this.milestones.length === 0) return 0;
  
  const totalSubLessons = this.milestones.reduce((sum: number, milestone: IMilestone) => sum + milestone.subLessons, 0);
  const finishedSubLessons = this.milestones.reduce((sum: number, milestone: IMilestone) => sum + milestone.finished, 0);
  
  return totalSubLessons > 0 ? Math.round((finishedSubLessons / totalSubLessons) * 100) : 0;
});

// Virtual for current milestone
RoadmapSchema.virtual('currentMilestone').get(function(this: IRoadmap) {
  return this.milestones.find((milestone: IMilestone) => milestone.finished < milestone.subLessons) || null;
});

// Methods
RoadmapSchema.methods.updateProgress = function(mileId: string, increment: number = 1) {
  const milestone = this.milestones.find((m: IMilestone) => m.mileId === mileId);
  if (milestone && milestone.finished < milestone.subLessons) {
    milestone.finished = Math.min(milestone.finished + increment, milestone.subLessons);
    return this.save();
  }
  throw new Error('Milestone not found or already completed');
};

// Export the model
export const Roadmap = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);
