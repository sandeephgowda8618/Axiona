const mongoose = require('mongoose');
const { Schema } = mongoose;

// Question schema
const QuestionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'single-choice', 'true-false', 'numerical', 'essay'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: Schema.Types.Mixed, // Can be string, array, or number
    required: true
  },
  explanation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 30, // minimum 30 seconds
    max: 1800 // maximum 30 minutes
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topics: [{
    type: String,
    trim: true
  }]
});

// Quiz schema
const QuizSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number,
    required: true,
    min: 5, // minimum 5 minutes
    max: 180 // maximum 3 hours
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 0
  },
  instructions: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  questions: [QuestionSchema],
  isTimeLimited: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: true
  },
  retakeAllowed: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledStart: {
    type: Date
  },
  scheduledEnd: {
    type: Date
  },
  // Proctoring and Security Settings
  proctoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    fullscreenRequired: {
      type: Boolean,
      default: true
    },
    tabSwitchLimit: {
      type: Number,
      default: 2,
      min: 0,
      max: 10
    },
    timeWarningAt: {
      type: Number,
      default: 300, // 5 minutes in seconds
      min: 60,
      max: 1800
    },
    criticalTimeWarningAt: {
      type: Number,
      default: 60, // 1 minute in seconds
      min: 30,
      max: 300
    },
    preventCopyPaste: {
      type: Boolean,
      default: true
    },
    preventRightClick: {
      type: Boolean,
      default: true
    },
    preventBrowserBack: {
      type: Boolean,
      default: true
    },
    detectTabSwitch: {
      type: Boolean,
      default: true
    },
    detectFullscreenExit: {
      type: Boolean,
      default: true
    },
    autoSubmitOnTimeExpiry: {
      type: Boolean,
      default: true
    },
    maxIdleTime: {
      type: Number,
      default: 300, // 5 minutes
      min: 60,
      max: 1800
    },
    suspiciousActivityThreshold: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    blockDeveloperTools: {
      type: Boolean,
      default: true
    },
    preventTextSelection: {
      type: Boolean,
      default: true
    },
    disableZoom: {
      type: Boolean,
      default: true
    },
    monitorMouseActivity: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
QuizSchema.index({ subject: 1, category: 1 });
QuizSchema.index({ difficulty: 1 });
QuizSchema.index({ createdBy: 1 });
QuizSchema.index({ tags: 1 });
QuizSchema.index({ isActive: 1, scheduledStart: 1 });

// Validation
QuizSchema.pre('save', function(next) {
  // Ensure passing marks is not greater than max marks
  if (this.passingMarks > this.maxMarks) {
    next(new Error('Passing marks cannot be greater than maximum marks'));
  }
  
  // Ensure total questions matches questions array length
  if (this.questions.length !== this.totalQuestions) {
    next(new Error('Total questions count does not match questions array length'));
  }
  
  // Calculate and validate max marks
  const calculatedMaxMarks = this.questions.reduce((sum, question) => sum + question.marks, 0);
  if (calculatedMaxMarks !== this.maxMarks) {
    next(new Error('Maximum marks does not match sum of question marks'));
  }
  
  next();
});

// Virtual for average question difficulty
QuizSchema.virtual('averageDifficulty').get(function() {
  if (this.questions.length === 0) return 'easy';
  
  const difficultyScores = { easy: 1, medium: 2, hard: 3 };
  const avgScore = this.questions.reduce((sum, q) => sum + difficultyScores[q.difficulty], 0) / this.questions.length;
  
  if (avgScore <= 1.5) return 'easy';
  if (avgScore <= 2.5) return 'medium';
  return 'hard';
});

// Methods
QuizSchema.methods.addQuestion = function(questionData) {
  this.questions.push(questionData);
  this.totalQuestions = this.questions.length;
  this.maxMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  return this.save();
};

QuizSchema.methods.removeQuestion = function(questionId) {
  this.questions = this.questions.filter(q => q.id !== questionId);
  this.totalQuestions = this.questions.length;
  this.maxMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  return this.save();
};

QuizSchema.methods.randomizeQuestions = function() {
  if (this.shuffleQuestions) {
    this.questions = this.questions.sort(() => Math.random() - 0.5);
  }
  return this;
};

QuizSchema.methods.getActiveQuestions = function() {
  return this.questions.filter(q => q.marks > 0);
};

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = { Quiz };
